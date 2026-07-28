import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  CHAT_ENDPOINT,
  CHAT_STREAM_HEADER,
  CHAT_STREAM_VERSION,
  ChatRequestValidationError,
  isAllowedOrigin,
  parseChatRequest,
  type ChatError
} from "@resume-agent/contracts";
import { assertGatewayConfig, type GatewayConfig } from "./config.js";
import type {
  ChatProvider,
  GatewayAdmission,
  GatewayLogger,
  GatewayTool,
  GatewayToolCall,
  McpClient,
  ProviderChunk,
  ProviderMessage,
  ProviderResult,
  ProviderTurn
} from "./types.js";

export interface GatewayDependencies {
  provider: ChatProvider;
  mcp: McpClient;
  logger?: GatewayLogger;
  admit?: GatewayAdmission;
}

export interface GatewayHandle {
  url: string;
  closed: Promise<void>;
  close(): Promise<void>;
}

const silentLogger: GatewayLogger = { info() {}, error() {} };

class DependencyError extends Error {
  constructor(
    readonly code: "provider_unavailable" | "mcp_unavailable",
    message: string,
    cause?: unknown
  ) {
    super(message, { cause });
  }
}

function sendJson(response: ServerResponse, status: number, body: ChatError | Record<string, unknown>): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function writeCors(
  request: IncomingMessage,
  response: ServerResponse,
  origin: string,
  allowCredentials: boolean,
): void {
  const requestedHeaders = request.headers["access-control-request-headers"];
  response.setHeader("access-control-allow-origin", origin);
  response.setHeader("access-control-allow-methods", "POST, OPTIONS");
  response.setHeader(
    "access-control-allow-headers",
    typeof requestedHeaders === "string"
      ? requestedHeaders
      : `content-type, ${CHAT_STREAM_HEADER}`,
  );
  if (allowCredentials) response.setHeader("access-control-allow-credentials", "true");
  response.setHeader("vary", "Origin, Access-Control-Request-Headers");
}

function secureEqual(actual: string, expected: string): boolean {
  const actualDigest = Uint8Array.from(createHash("sha256").update(actual).digest());
  const expectedDigest = Uint8Array.from(createHash("sha256").update(expected).digest());
  return timingSafeEqual(actualDigest, expectedDigest);
}

function bearerToken(request: IncomingMessage): string | undefined {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length);
  return token.length > 0 ? token : undefined;
}

function hasGatewayAccess(request: IncomingMessage, config: GatewayConfig): boolean {
  if (config.securityMode === "local") return true;
  const token = bearerToken(request);
  return token !== undefined && secureEqual(token, config.accessToken!);
}

async function readJson(request: IncomingMessage, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers["content-length"] ?? 0);
  if (declared > maxBytes) throw new RangeError("Request body is too large.");
  request.setEncoding("utf8");
  let text = "";
  let bytes = 0;
  for await (const chunk of request) {
    const value = String(chunk);
    bytes += Buffer.byteLength(value);
    if (bytes > maxBytes) throw new RangeError("Request body is too large.");
    text += value;
  }
  return JSON.parse(text);
}

function streamEvent(response: ServerResponse, chunk: Record<string, unknown> | "[DONE]"): void {
  response.write(`data: ${chunk === "[DONE]" ? chunk : JSON.stringify(chunk)}\n\n`);
}

function publicError(error: unknown, requestId: string): ChatError {
  if (error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError")) {
    return { code: "provider_unavailable", message: "The request timed out.", requestId };
  }
  if (error instanceof DependencyError) {
    return {
      code: error.code,
      message: error.code === "mcp_unavailable"
        ? "Resume tools are temporarily unavailable."
        : "The AI provider is temporarily unavailable.",
      requestId
    };
  }
  if (error instanceof RangeError) {
    return {
      code: "internal_error",
      message: "The response exceeded the configured output limit.",
      requestId,
    };
  }
  return { code: "internal_error", message: "Unable to complete the request.", requestId };
}

async function runChat(
  initialMessages: ProviderMessage[],
  provider: ChatProvider,
  mcp: McpClient,
  config: GatewayConfig,
  signal: AbortSignal,
  onText: (delta: string) => void,
): Promise<string> {
  const allowed = new Set(config.toolAllowlist);
  let tools: GatewayTool[] = [];
  if (allowed.size > 0) {
    try {
      const discovered = await mcp.listTools(signal);
      tools = discovered.filter((tool) => allowed.has(tool.name));
    } catch (error) {
      throw new DependencyError("mcp_unavailable", "MCP tool discovery failed.", error);
    }
  }

  const messages = [...initialMessages];
  for (let round = 0; round < config.maxToolRounds; round += 1) {
    let result: ProviderTurn;
    try {
      result = await provider.generate({ messages, tools, signal });
    } catch (error) {
      throw new DependencyError("provider_unavailable", "Provider request failed.", error);
    }
    const calls: GatewayToolCall[] = [];
    let text = "";
    try {
      if (Symbol.asyncIterator in Object(result)) {
        for await (const chunk of result as AsyncIterable<ProviderChunk>) {
          if (chunk.type === "tool-call") {
            calls.push(chunk.call);
          } else {
            text += chunk.text;
            if (text.length > config.maxOutputLength) {
              throw new RangeError("Provider output exceeded the configured limit.");
            }
            onText(chunk.text);
          }
        }
      } else {
        const completed = result as ProviderResult;
        text = completed.text;
        calls.push(...(completed.toolCalls ?? []));
        if (text.length > config.maxOutputLength) {
          throw new RangeError("Provider output exceeded the configured limit.");
        }
        if (text) onText(text);
      }
    } catch (error) {
      if (error instanceof RangeError) throw error;
      throw new DependencyError("provider_unavailable", "Provider stream failed.", error);
    }
    if (calls.length === 0) {
      return text;
    }
    if (text) throw new Error("Provider returned text before requesting tools.");
    for (const call of calls) {
      if (!tools.some((tool) => tool.name === call.name)) {
        throw new Error("Provider requested a tool outside the allowlist.");
      }
    }
    messages.push({ role: "assistant", parts: [], toolCalls: calls });
    for (const call of calls) {
      let toolResult;
      try {
        toolResult = await mcp.callTool(call, signal);
      } catch (error) {
        throw new DependencyError("mcp_unavailable", "MCP tool call failed.", error);
      }
      const serializedToolResult = JSON.stringify(toolResult);
      if (Buffer.byteLength(serializedToolResult) > config.maxToolResultBytes) {
        throw new DependencyError(
          "mcp_unavailable",
          "MCP tool result exceeded the configured size limit.",
        );
      }
      messages.push({ role: "tool", toolCallId: call.id, content: toolResult });
    }
  }
  throw new Error("Maximum tool rounds exceeded.");
}

export function createGatewayServer(config: GatewayConfig, dependencies: GatewayDependencies) {
  assertGatewayConfig(config);
  const logger = dependencies.logger ?? silentLogger;
  let activeRequests = 0;

  return createServer(async (request, response) => {
    const requestId = randomUUID();
    response.setHeader("x-request-id", requestId);
    const origin = typeof request.headers.origin === "string" ? request.headers.origin : null;
    const originAllowed = isAllowedOrigin(origin, config.allowedOrigins, config.allowMissingOrigin);

    if (request.method === "GET" && (request.url === "/health" || request.url === "/healthz")) {
      sendJson(response, 200, { status: "ok" });
      return;
    }
    if (request.method === "GET" && request.url === "/readyz") {
      try {
        await dependencies.mcp.listTools(AbortSignal.timeout(config.requestTimeoutMs));
        sendJson(response, 200, { status: "ready" });
      } catch {
        sendJson(response, 503, { status: "unavailable", dependency: "mcp" });
      }
      return;
    }
    if (request.url !== CHAT_ENDPOINT) {
      sendJson(response, 404, { code: "invalid_request", message: "Not found.", requestId });
      return;
    }
    if (!originAllowed) {
      sendJson(response, 403, { code: "invalid_request", message: "Origin is not allowed.", requestId });
      return;
    }
    if (origin) writeCors(request, response, origin, config.allowCredentials);
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.method !== "POST") {
      response.setHeader("allow", "POST, OPTIONS");
      sendJson(response, 405, { code: "invalid_request", message: "Method not allowed.", requestId });
      return;
    }
    if (!hasGatewayAccess(request, config)) {
      sendJson(response, 401, { code: "invalid_request", message: "Unauthorized.", requestId });
      return;
    }
    if (dependencies.admit) {
      let admitted: boolean;
      try {
        admitted = await dependencies.admit({ request, requestId, origin });
      } catch (error) {
        logger.error("Gateway admission failed.", {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        sendJson(response, 503, { code: "internal_error", message: "Request admission is unavailable.", requestId });
        return;
      }
      if (!admitted) {
        sendJson(response, 429, { code: "rate_limited", message: "Request admission denied.", requestId });
        return;
      }
    }
    if (activeRequests >= config.maxConcurrentRequests) {
      sendJson(response, 429, { code: "rate_limited", message: "Too many concurrent requests.", requestId });
      return;
    }

    activeRequests += 1;
    const timeout = AbortSignal.timeout(config.requestTimeoutMs);
    const disconnected = new AbortController();
    request.once("aborted", () => disconnected.abort());
    response.once("close", () => {
      if (!response.writableEnded) disconnected.abort();
    });
    const signal = AbortSignal.any([timeout, disconnected.signal]);
    let streamStarted = false;
    const messageId = randomUUID();
    const textId = randomUUID();
    const startStream = () => {
      if (streamStarted) return;
      response.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        [CHAT_STREAM_HEADER]: CHAT_STREAM_VERSION
      });
      streamEvent(response, { type: "start", messageId });
      streamEvent(response, { type: "text-start", id: textId });
      streamStarted = true;
    };
    try {
      const raw = await readJson(request, config.maxBodyBytes);
      const chat = parseChatRequest(raw, {
        maxMessages: config.maxMessages,
        maxInputLength: config.maxInputLength
      });
      const groundedMessages: ProviderMessage[] = [
        {
          role: "system",
          parts: [{ type: "text", text: config.systemPrompt }]
        },
        ...chat.messages.filter((message) => message.role !== "system")
      ];
      await runChat(
        groundedMessages,
        dependencies.provider,
        dependencies.mcp,
        config,
        signal,
        (delta) => {
          startStream();
          streamEvent(response, { type: "text-delta", id: textId, delta });
        },
      );
      if (signal.aborted || response.destroyed) return;

      startStream();
      streamEvent(response, { type: "text-end", id: textId });
      streamEvent(response, { type: "finish" });
      streamEvent(response, "[DONE]");
      response.end();
      logger.info("Chat request completed.", { requestId });
    } catch (error) {
      if (response.destroyed) return;
      if (streamStarted) {
        const safe = publicError(error, requestId);
        streamEvent(response, { type: "error", errorText: safe.message });
        streamEvent(response, { type: "finish" });
        streamEvent(response, "[DONE]");
        response.end();
        logger.error("Chat stream failed.", {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      } else if (error instanceof SyntaxError) {
        sendJson(response, 400, { code: "invalid_request", message: "Request body must be valid JSON.", requestId });
      } else if (error instanceof RangeError) {
        sendJson(response, 413, { code: "message_too_long", message: error.message, requestId });
      } else if (error instanceof ChatRequestValidationError) {
        sendJson(response, 400, { code: "invalid_request", message: error.message, requestId });
      } else {
        logger.error("Chat request failed.", {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        sendJson(response, 502, publicError(error, requestId));
      }
    } finally {
      activeRequests -= 1;
    }
  });
}

export async function startGateway(
  config: GatewayConfig,
  dependencies: GatewayDependencies
): Promise<GatewayHandle> {
  const server = createGatewayServer(config, dependencies);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Gateway did not bind a TCP address.");
  const urlHost = config.host.includes(":") ? `[${config.host}]` : config.host;
  let closing: Promise<void> | undefined;
  let resolveClosed: (() => void) | undefined;
  let rejectClosed: ((error: Error) => void) | undefined;
  const closed = new Promise<void>((resolve, reject) => {
    resolveClosed = resolve;
    rejectClosed = reject;
  });
  server.once("close", () => resolveClosed?.());
  server.once("error", (error) => rejectClosed?.(error));
  return {
    url: `http://${urlHost}:${address.port}`,
    closed,
    close() {
      closing ??= new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeIdleConnections();
      });
      return closing;
    }
  };
}
