import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TOOL_ALLOWLIST, loadGatewayConfig } from "./config.js";

test("loads documented gateway and MCP environment variables", () => {
  const config = loadGatewayConfig({
    GATEWAY_PORT: "9000",
    GATEWAY_ALLOWED_ORIGINS: "https://one.test,https://two.test",
    GATEWAY_ALLOW_CREDENTIALS: "true",
    MCP_CLIENT_ORIGIN: "https://gateway.test",
    MCP_SERVER_URL: "https://mcp.test/custom",
    GATEWAY_TOOL_ALLOWLIST: "resume,projects"
  });
  assert.equal(config.port, 9000);
  assert.deepEqual(config.allowedOrigins, ["https://one.test", "https://two.test"]);
  assert.equal(config.allowCredentials, true);
  assert.equal(config.canonicalOrigin, "https://gateway.test");
  assert.equal(config.mcpUrl, "https://mcp.test/custom");
  assert.deepEqual(config.toolAllowlist, ["resume", "projects"]);
});

test("requires explicit security when the gateway is remotely reachable", () => {
  assert.throws(
    () => loadGatewayConfig({ GATEWAY_HOST: "0.0.0.0" }),
    /requires remote security mode/
  );
  assert.throws(
    () => loadGatewayConfig({
      GATEWAY_HOST: "0.0.0.0",
      GATEWAY_SECURITY_MODE: "remote",
      GATEWAY_ALLOWED_ORIGINS: "https://example.test"
    }),
    /GATEWAY_ACCESS_TOKEN/
  );
  const config = loadGatewayConfig({
    GATEWAY_HOST: "0.0.0.0",
    GATEWAY_SECURITY_MODE: "remote",
    GATEWAY_ALLOWED_ORIGINS: "https://example.test",
    GATEWAY_ACCESS_TOKEN: "secret"
  });
  assert.equal(config.allowMissingOrigin, false);
});

test("rejects origins with paths", () => {
  assert.throws(
    () => loadGatewayConfig({ GATEWAY_ALLOWED_ORIGINS: "https://example.test/path" }),
    /only scheme and authority/
  );
});

test("defaults to the public resume tools and grounded system prompt", () => {
  const config = loadGatewayConfig({});
  assert.deepEqual(config.toolAllowlist, DEFAULT_TOOL_ALLOWLIST);
  assert.equal(config.systemPrompt, DEFAULT_SYSTEM_PROMPT);
  assert.match(config.systemPrompt, /Never invent/);
});
