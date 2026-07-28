import { createHash, timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { assertValidProfile, exampleProfile, type Profile } from "@resume-agent/profile";

import {
  resolveMcpHttpConfig,
  type McpHttpConfig,
  type McpHttpConfigInput,
} from "./config.js";
import { createResumeMcpServer } from "./mcp-adapter.js";

export interface ResumeMcpServerOptions extends McpHttpConfigInput {
  profile?: Profile;
  logger?: McpLogger;
}

export interface McpLogger {
  error(message: string, fields?: Record<string, unknown>): void;
}

export interface RunningMcpServer {
  url: string;
  closed: Promise<void>;
  close(): Promise<void>;
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

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(value));
}

function forbidden(response: ServerResponse): void {
  sendJson(response, 403, {
    jsonrpc: "2.0",
    error: { code: -32001, message: "Forbidden." },
    id: null,
  });
}

function requestAllowed(request: IncomingMessage, config: McpHttpConfig): boolean {
  const origin = request.headers.origin;
  if (origin) {
    if (!config.allowedOrigins.includes(origin)) return false;
  } else if (config.securityMode === "remote") {
    return false;
  }

  if (config.securityMode === "remote") {
    const token = bearerToken(request);
    return token !== undefined && secureEqual(token, config.serviceToken!);
  }
  return true;
}

export function createMcpRequestHandler(
  profile: Profile,
  input: McpHttpConfigInput = {},
  logger: McpLogger = { error() {} },
): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
  assertValidProfile(profile);
  const config = resolveMcpHttpConfig(input);

  return async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://resume-agent.local").pathname;

    if (request.method === "GET" && pathname === config.healthPath) {
      sendJson(response, 200, { status: "ok" });
      return;
    }
    if (request.method === "GET" && pathname === config.readinessPath) {
      sendJson(response, 200, { status: "ready" });
      return;
    }
    if (pathname !== config.path) {
      sendJson(response, 404, { error: "Not found." });
      return;
    }
    if (!requestAllowed(request, config)) {
      forbidden(response);
      return;
    }
    if (request.method !== "POST" && request.method !== "GET" && request.method !== "DELETE") {
      response.setHeader("allow", "POST, GET, DELETE");
      sendJson(response, 405, {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null,
      });
      return;
    }

    const mcpServer = createResumeMcpServer(profile);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(request, response);
    } catch {
      if (!response.headersSent) {
        sendJson(response, 500, {
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error." },
          id: null,
        });
      } else {
        response.end();
      }
    } finally {
      const cleanup = await Promise.allSettled([
        transport.close(),
        mcpServer.close(),
      ]);
      cleanup.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.error("MCP request cleanup failed.", {
            component: index === 0 ? "transport" : "server",
          });
        }
      });
    }
  };
}

function listen(server: Server, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => reject(error);
    server.once("error", onError);
    server.listen(port, host, () => {
      server.off("error", onError);
      resolve();
    });
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeIdleConnections();
  });
}

export async function startMcpServer(
  options: ResumeMcpServerOptions = {},
): Promise<RunningMcpServer> {
  const { profile = exampleProfile, logger, ...configInput } = options;
  assertValidProfile(profile);
  const config = resolveMcpHttpConfig(configInput);
  const handler = createMcpRequestHandler(profile, config, logger);
  const server = createServer((request, response) => {
    void handler(request, response);
  });

  await listen(server, config.port, config.host);
  const address = server.address();
  if (!address || typeof address === "string") {
    await closeServer(server);
    throw new Error("MCP server did not expose a TCP address.");
  }
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
    url: `http://${urlHost}:${address.port}${config.path}`,
    closed,
    close() {
      closing ??= closeServer(server);
      return closing;
    },
  };
}
