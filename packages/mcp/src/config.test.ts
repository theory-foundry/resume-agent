import assert from "node:assert/strict";
import test from "node:test";

import { parseMcpHttpConfig, resolveMcpHttpConfig } from "./config.js";

test("configuration defaults to a safe loopback-only server", () => {
  const config = parseMcpHttpConfig({});

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 3001);
  assert.equal(config.path, "/mcp");
  assert.equal(config.securityMode, "local");
});

test("configuration refuses broad binding without remote security", () => {
  assert.throws(
    () => resolveMcpHttpConfig({ host: "0.0.0.0" }),
    /requires remote security mode/,
  );
});

test("remote configuration requires explicit origins and a service token", () => {
  assert.throws(
    () => resolveMcpHttpConfig({ securityMode: "remote", serviceToken: "secret" }),
    /allowed origin/,
  );
  assert.throws(
    () =>
      resolveMcpHttpConfig({
        securityMode: "remote",
        allowedOrigins: ["https://gateway.example"],
      }),
    /bearer token/,
  );
});

test("environment parsing normalizes paths, origins, and port", () => {
  const config = parseMcpHttpConfig({
    MCP_HOST: "0.0.0.0",
    MCP_PORT: "4123",
    MCP_PATH: "/context/",
    MCP_SECURITY_MODE: "remote",
    MCP_ALLOWED_ORIGINS: "https://gateway.example, https://admin.example",
    MCP_SERVICE_TOKEN: "secret",
  });

  assert.equal(config.port, 4123);
  assert.equal(config.path, "/context");
  assert.deepEqual(config.allowedOrigins, [
    "https://gateway.example",
    "https://admin.example",
  ]);
});
