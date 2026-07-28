export type McpSecurityMode = "local" | "remote";

export interface McpHttpConfig {
  host: string;
  port: number;
  path: string;
  healthPath: string;
  readinessPath: string;
  securityMode: McpSecurityMode;
  allowedOrigins: readonly string[];
  serviceToken?: string;
}

export type McpHttpConfigInput = Partial<McpHttpConfig>;

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

function parsePort(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65_535) {
    throw new Error("MCP_PORT must be an integer between 0 and 65535.");
  }
  return parsed;
}

function normalizePath(value: string, name: string): string {
  if (!value.startsWith("/") || value.includes("?") || value.includes("#")) {
    throw new Error(`${name} must be an absolute URL path.`);
  }
  return value.length > 1 ? value.replace(/\/+$/, "") : value;
}

function parseOrigins(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host.toLocaleLowerCase());
}

export function resolveMcpHttpConfig(input: McpHttpConfigInput = {}): McpHttpConfig {
  const config: McpHttpConfig = {
    host: input.host ?? "127.0.0.1",
    port: input.port ?? 3001,
    path: normalizePath(input.path ?? "/mcp", "MCP_PATH"),
    healthPath: normalizePath(input.healthPath ?? "/healthz", "MCP_HEALTH_PATH"),
    readinessPath: normalizePath(input.readinessPath ?? "/readyz", "MCP_READINESS_PATH"),
    securityMode: input.securityMode ?? "local",
    allowedOrigins: [...(input.allowedOrigins ?? [])],
    serviceToken: input.serviceToken,
  };

  if (config.securityMode === "local" && !isLoopbackHost(config.host)) {
    throw new Error("Non-loopback MCP_HOST requires remote security mode.");
  }
  if (config.securityMode === "remote") {
    if (config.allowedOrigins.length === 0) {
      throw new Error("Remote security mode requires at least one explicit allowed origin.");
    }
    if (!config.serviceToken) {
      throw new Error("Remote security mode requires a service bearer token.");
    }
  }
  for (const origin of config.allowedOrigins) {
    const parsed = new URL(origin);
    if (parsed.origin !== origin) {
      throw new Error(`Allowed origin must contain only scheme and authority: ${origin}`);
    }
  }

  return config;
}

export function parseMcpHttpConfig(
  env: NodeJS.ProcessEnv = process.env,
  overrides: McpHttpConfigInput = {},
): McpHttpConfig {
  const securityMode = env.MCP_SECURITY_MODE;
  if (securityMode !== undefined && securityMode !== "local" && securityMode !== "remote") {
    throw new Error("MCP_SECURITY_MODE must be local or remote.");
  }

  return resolveMcpHttpConfig({
    host: env.MCP_HOST,
    port: parsePort(env.MCP_PORT),
    path: env.MCP_PATH,
    healthPath: env.MCP_HEALTH_PATH,
    readinessPath: env.MCP_READINESS_PATH,
    securityMode,
    allowedOrigins: parseOrigins(env.MCP_ALLOWED_ORIGINS),
    serviceToken: env.MCP_SERVICE_TOKEN,
    ...overrides,
  });
}
