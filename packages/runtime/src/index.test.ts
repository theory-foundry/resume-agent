import assert from "node:assert/strict";
import test from "node:test";
import { CHAT_API_VERSION } from "@resume-agent/contracts";
import {
  createMcpClient,
  loadGatewayConfig,
  startGateway
} from "@resume-agent/gateway";
import { startMcpServer } from "@resume-agent/mcp";
import { startRuntime, type ServiceHandle } from "./index.js";

function handle(url: string, closeEvents: string[]): ServiceHandle & {
  fail(error: Error): void;
  stop(): void;
} {
  let resolveClosed: (() => void) | undefined;
  let rejectClosed: ((error: Error) => void) | undefined;
  const closed = new Promise<void>((resolve, reject) => {
    resolveClosed = resolve;
    rejectClosed = reject;
  });
  return {
    url,
    closed,
    fail(error) { rejectClosed?.(error); },
    stop() { resolveClosed?.(); },
    async close() {
      closeEvents.push(url);
      resolveClosed?.();
    }
  };
}

test("starts MCP before gateway and closes both services", async () => {
  const events: string[] = [];
  const runtime = await startRuntime(
    {
      gatewayHost: "127.0.0.1",
      mcpHost: "127.0.0.1",
      mcpPort: 9000,
      gatewayPort: 9001,
      canonicalOrigin: "http://127.0.0.1:9001",
      mcpSecurityMode: "local"
    },
    {
      async startMcp() {
        events.push("mcp:start");
        return handle("http://127.0.0.1:9000/mcp", events);
      },
      async startGateway(options) {
        events.push(`gateway:start:${options.mcpUrl}`);
        return handle("http://127.0.0.1:9001", events);
      }
    }
  );
  await runtime.close();
  assert.deepEqual(events, [
    "mcp:start",
    "gateway:start:http://127.0.0.1:9000/mcp",
    "http://127.0.0.1:9001",
    "http://127.0.0.1:9000/mcp"
  ]);
});

test("closes MCP when gateway startup fails", async () => {
  const events: string[] = [];
  await assert.rejects(
    startRuntime(
      {
        gatewayHost: "127.0.0.1",
        mcpHost: "127.0.0.1",
        mcpPort: 9000,
        gatewayPort: 9001,
        canonicalOrigin: "http://127.0.0.1:9001",
        mcpSecurityMode: "local"
      },
      {
        async startMcp() { return handle("http://127.0.0.1:9000", events); },
        async startGateway() { throw new Error("bind failed"); }
      }
    ),
    /bind failed/
  );
  assert.deepEqual(events, ["http://127.0.0.1:9000"]);
});

test("stops the sibling and reports an unexpected service failure", async () => {
  const events: string[] = [];
  const mcp = handle("http://127.0.0.1:9000/mcp", events);
  const gateway = handle("http://127.0.0.1:9001", events);
  const runtime = await startRuntime(
    {
      gatewayHost: "127.0.0.1",
      mcpHost: "127.0.0.1",
      mcpPort: 9000,
      gatewayPort: 9001,
      canonicalOrigin: "http://127.0.0.1:9001",
      mcpSecurityMode: "local"
    },
    {
      async startMcp() { return mcp; },
      async startGateway() { return gateway; }
    }
  );
  mcp.stop();
  await assert.rejects(runtime.done, /MCP stopped unexpectedly/);
  assert.deepEqual(events, [
    "http://127.0.0.1:9001",
    "http://127.0.0.1:9000/mcp"
  ]);
});

test("stops the sibling when a service reports an error", async () => {
  const events: string[] = [];
  const mcp = handle("http://127.0.0.1:9000/mcp", events);
  const gateway = handle("http://127.0.0.1:9001", events);
  const runtime = await startRuntime(
    {
      gatewayHost: "127.0.0.1",
      mcpHost: "127.0.0.1",
      mcpPort: 9000,
      gatewayPort: 9001,
      canonicalOrigin: "http://127.0.0.1:9001",
      mcpSecurityMode: "local"
    },
    {
      async startMcp() { return mcp; },
      async startGateway() { return gateway; }
    }
  );
  gateway.fail(new Error("socket failure"));
  await assert.rejects(runtime.done, /Gateway stopped unexpectedly/);
  assert.deepEqual(events, [
    "http://127.0.0.1:9001",
    "http://127.0.0.1:9000/mcp"
  ]);
});

test("runs a real MCP-to-gateway chat and aggregate readiness flow", async () => {
  let providerRound = 0;
  let mcpClient: Awaited<ReturnType<typeof createMcpClient>> | undefined;
  const runtime = await startRuntime(
    {
      gatewayHost: "127.0.0.1",
      mcpHost: "127.0.0.1",
      mcpPort: 0,
      gatewayPort: 0,
      canonicalOrigin: "http://127.0.0.1:8788",
      mcpSecurityMode: "local"
    },
    {
      startMcp: startMcpServer,
      async startGateway({ host, port, mcpUrl }) {
        mcpClient = await createMcpClient({
          url: mcpUrl,
          canonicalOrigin: "http://127.0.0.1:8788"
        });
        const gateway = await startGateway({
          ...loadGatewayConfig({}),
          host,
          port,
          mcpUrl,
          toolAllowlist: ["get_contact"]
        }, {
          provider: {
            async generate({ messages }) {
              providerRound += 1;
              if (providerRound === 1) {
                return {
                  text: "",
                  toolCalls: [{ id: "contact-1", name: "get_contact", arguments: {} }]
                };
              }
              const toolMessage = messages.find((message) => message.role === "tool");
              assert.ok(toolMessage && "content" in toolMessage);
              return { text: "Contact information retrieved from MCP." };
            }
          },
          mcp: mcpClient
        });
        return {
          ...gateway,
          async close() {
            await gateway.close();
            await mcpClient?.close?.();
          }
        };
      }
    }
  );
  try {
    const ready = await fetch(`${runtime.gateway.url}/readyz`);
    assert.equal(ready.status, 200);
    const response = await fetch(`${runtime.gateway.url}/v1/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        version: CHAT_API_VERSION,
        conversationId: "runtime-integration",
        trigger: "submit-message",
        messages: [{ role: "user", parts: [{ type: "text", text: "How can I connect?" }] }]
      })
    });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Contact information retrieved from MCP/);
    assert.equal(providerRound, 2);
  } finally {
    await runtime.close();
  }
});
