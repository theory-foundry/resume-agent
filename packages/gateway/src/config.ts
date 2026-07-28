export interface GatewayConfig {
  host: string;
  port: number;
  allowedOrigins: string[];
  allowMissingOrigin: boolean;
  allowCredentials: boolean;
  securityMode: "local" | "remote";
  accessToken?: string;
  canonicalOrigin: string;
  mcpUrl: string;
  mcpServiceToken?: string;
  openAiApiKey?: string;
  openAiModel: string;
  maxBodyBytes: number;
  maxMessages: number;
  maxInputLength: number;
  maxOutputLength: number;
  maxToolResultBytes: number;
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
  maxToolRounds: number;
  toolAllowlist: string[];
  systemPrompt: string;
}

export const DEFAULT_TOOL_ALLOWLIST = [
  "search_profile",
  "get_experience",
  "get_project",
  "get_contact"
] as const;

export const DEFAULT_SYSTEM_PROMPT = [
  "You are a resume assistant.",
  "Answer only resume, career, project, experience, skills, education, and contact questions.",
  "Use only facts present in the conversation or returned by the provided resume tools.",
  "Never invent, infer, embellish, or guess claims about the person.",
  "If the available evidence does not answer the question, say that the resume does not provide that information."
].join(" ");

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received ${value}.`);
  }
  return parsed;
}

function csv(value: string | undefined): string[] {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function exactOrigin(value: string): string {
  const parsed = new URL(value);
  if (parsed.origin !== value) {
    throw new Error(`Expected an Origin containing only scheme and authority, received ${value}.`);
  }
  return value;
}

function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "::1" || host.toLowerCase() === "localhost";
}

export function assertGatewayConfig(config: GatewayConfig): void {
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65_535) {
    throw new Error("GATEWAY_PORT must be an integer between 0 and 65535.");
  }
  if (config.securityMode === "local" && !isLoopbackHost(config.host)) {
    throw new Error("Non-loopback GATEWAY_HOST requires remote security mode.");
  }
  if (config.securityMode === "remote" && config.allowedOrigins.length === 0) {
    throw new Error("Remote gateway mode requires at least one explicit allowed origin.");
  }
  if (config.securityMode === "remote" && !config.accessToken) {
    throw new Error("Remote gateway mode requires GATEWAY_ACCESS_TOKEN.");
  }
  config.allowedOrigins.forEach(exactOrigin);
  exactOrigin(config.canonicalOrigin);
  const mcpUrl = new URL(config.mcpUrl);
  if (mcpUrl.protocol !== "http:" && mcpUrl.protocol !== "https:") {
    throw new Error("MCP_SERVER_URL must use HTTP or HTTPS.");
  }
  for (const [name, value] of [
    ["GATEWAY_MAX_BODY_BYTES", config.maxBodyBytes],
    ["GATEWAY_MAX_MESSAGES", config.maxMessages],
    ["GATEWAY_MAX_INPUT_LENGTH", config.maxInputLength],
    ["GATEWAY_MAX_OUTPUT_LENGTH", config.maxOutputLength],
    ["GATEWAY_MAX_TOOL_RESULT_BYTES", config.maxToolResultBytes],
    ["GATEWAY_MAX_CONCURRENT", config.maxConcurrentRequests],
    ["GATEWAY_REQUEST_TIMEOUT_MS", config.requestTimeoutMs],
    ["GATEWAY_MAX_TOOL_ROUNDS", config.maxToolRounds],
  ] as const) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`${name} must be a positive integer.`);
    }
  }
}

export function loadGatewayConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const port = positiveInteger(env.GATEWAY_PORT, 8788);
  if (port > 65_535) throw new Error("GATEWAY_PORT must not exceed 65535.");
  const host = env.GATEWAY_HOST ?? "127.0.0.1";
  const securityMode = env.GATEWAY_SECURITY_MODE ?? "local";
  if (securityMode !== "local" && securityMode !== "remote") {
    throw new Error("GATEWAY_SECURITY_MODE must be local or remote.");
  }
  const canonicalOrigin = exactOrigin(env.MCP_CLIENT_ORIGIN ?? `http://127.0.0.1:${port}`);
  const allowedOrigins = csv(env.GATEWAY_ALLOWED_ORIGINS).map(exactOrigin);
  const mcpUrl = new URL(env.MCP_SERVER_URL ?? "http://127.0.0.1:8789/mcp");
  if (mcpUrl.protocol !== "http:" && mcpUrl.protocol !== "https:") {
    throw new Error("MCP_SERVER_URL must use HTTP or HTTPS.");
  }
  const accessToken = env.GATEWAY_ACCESS_TOKEN;
  const config: GatewayConfig = {
    host,
    port,
    allowedOrigins,
    allowMissingOrigin: env.GATEWAY_ALLOW_MISSING_ORIGIN === undefined
      ? securityMode === "local"
      : env.GATEWAY_ALLOW_MISSING_ORIGIN === "true",
    allowCredentials: env.GATEWAY_ALLOW_CREDENTIALS === "true",
    securityMode,
    accessToken,
    canonicalOrigin,
    mcpUrl: mcpUrl.toString(),
    mcpServiceToken: env.MCP_SERVICE_TOKEN,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiModel: env.OPENAI_MODEL ?? "gpt-4o-mini",
    maxBodyBytes: positiveInteger(env.GATEWAY_MAX_BODY_BYTES, 64 * 1024),
    maxMessages: positiveInteger(env.GATEWAY_MAX_MESSAGES, 20),
    maxInputLength: positiveInteger(env.GATEWAY_MAX_INPUT_LENGTH, 2_000),
    maxOutputLength: positiveInteger(env.GATEWAY_MAX_OUTPUT_LENGTH, 12_000),
    maxToolResultBytes: positiveInteger(env.GATEWAY_MAX_TOOL_RESULT_BYTES, 64 * 1024),
    maxConcurrentRequests: positiveInteger(env.GATEWAY_MAX_CONCURRENT, 8),
    requestTimeoutMs: positiveInteger(env.GATEWAY_REQUEST_TIMEOUT_MS, 30_000),
    maxToolRounds: positiveInteger(env.GATEWAY_MAX_TOOL_ROUNDS, 5),
    toolAllowlist: env.GATEWAY_TOOL_ALLOWLIST === undefined
      ? [...DEFAULT_TOOL_ALLOWLIST]
      : csv(env.GATEWAY_TOOL_ALLOWLIST),
    systemPrompt: env.GATEWAY_SYSTEM_PROMPT?.trim() || DEFAULT_SYSTEM_PROMPT
  };
  assertGatewayConfig(config);
  return config;
}
