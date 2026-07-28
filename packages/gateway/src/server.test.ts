import assert from "node:assert/strict";
import test from "node:test";
import type { ChatRequest } from "@resume-agent/contracts";
import { startGateway } from "./server.js";
import type { GatewayConfig } from "./config.js";

const config: GatewayConfig = {
  host: "127.0.0.1",
  port: 0,
  allowedOrigins: ["https://example.test"],
  allowMissingOrigin: false,
  allowCredentials: false,
  securityMode: "local",
  canonicalOrigin: "https://gateway.test",
  mcpUrl: "http://127.0.0.1:8787/mcp",
  openAiModel: "test",
  maxBodyBytes: 4096,
  maxMessages: 5,
  maxInputLength: 100,
  maxOutputLength: 1000,
  maxToolResultBytes: 4096,
  maxConcurrentRequests: 1,
  requestTimeoutMs: 1000,
  maxToolRounds: 2,
  toolAllowlist: ["resume"],
  systemPrompt: "Use only verified resume facts."
};

const body: ChatRequest = {
  version: "1",
  conversationId: "test",
  trigger: "submit-message",
  messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }]
};

test("serves the AI SDK UI message stream and filters tools", async () => {
  let observedTools: string[] = [];
  let observedSystemPrompt = "";
  const gateway = await startGateway(config, {
    provider: {
      async generate({ tools, messages }) {
        observedTools = tools.map((tool) => tool.name);
        const first = messages[0];
        if (first && "parts" in first) observedSystemPrompt = first.parts[0]?.text ?? "";
        return { text: "Hello back" };
      }
    },
    mcp: {
      async listTools() {
        return [
          { name: "resume", inputSchema: { type: "object" } },
          { name: "secret", inputSchema: { type: "object" } }
        ];
      },
      async callTool() {
        throw new Error("unexpected");
      }
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-vercel-ai-ui-message-stream"), "v1");
    assert.deepEqual(observedTools, ["resume"]);
    assert.equal(observedSystemPrompt, config.systemPrompt);
    const text = await response.text();
    assert.match(text, /"type":"text-delta"/);
    assert.match(text, /Hello back/);
    assert.match(text, /data: \[DONE\]/);
  } finally {
    await gateway.close();
  }
});

test("forwards provider text deltas as separate stream events", async () => {
  const gateway = await startGateway(config, {
    provider: {
      async generate() {
        return (async function* () {
          yield { type: "text-delta" as const, text: "First " };
          yield { type: "text-delta" as const, text: "second" };
        })();
      }
    },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const stream = await response.text();
    assert.match(stream, /"delta":"First "/);
    assert.match(stream, /"delta":"second"/);
    assert.equal((stream.match(/"type":"text-delta"/g) ?? []).length, 2);
  } finally {
    await gateway.close();
  }
});

test("bounds streamed provider output and closes with a safe stream error", async () => {
  const gateway = await startGateway({ ...config, maxOutputLength: 5 }, {
    provider: {
      async generate() {
        return (async function* () {
          yield { type: "text-delta" as const, text: "hello" };
          yield { type: "text-delta" as const, text: " world" };
        })();
      }
    },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 200);
    const stream = await response.text();
    assert.match(stream, /"type":"error"/);
    assert.match(stream, /configured output limit/);
    assert.match(stream, /data: \[DONE\]/);
  } finally {
    await gateway.close();
  }
});

test("rejects oversized MCP tool results before adding them to model context", async () => {
  let round = 0;
  const gateway = await startGateway({
    ...config,
    maxToolResultBytes: 32,
    toolAllowlist: ["resume"]
  }, {
    provider: {
      async generate() {
        round += 1;
        return round === 1
          ? {
              text: "",
              toolCalls: [{ id: "call-1", name: "resume", arguments: {} }]
            }
          : { text: "unexpected" };
      }
    },
    mcp: {
      async listTools() {
        return [{ name: "resume", inputSchema: { type: "object" } }];
      },
      async callTool() {
        return { content: "x".repeat(100) };
      }
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 502);
    assert.equal((await response.json() as { code: string }).code, "mcp_unavailable");
    assert.equal(round, 1);
  } finally {
    await gateway.close();
  }
});

test("enforces secure binding invariants at the exported server boundary", async () => {
  await assert.rejects(
    () => startGateway(
      { ...config, host: "0.0.0.0", securityMode: "local" },
      {
        provider: { async generate() { return { text: "unexpected" }; } },
        mcp: {
          async listTools() { return []; },
          async callTool() { throw new Error("unexpected"); }
        }
      },
    ),
    /requires remote security mode/,
  );
});

test("disables all MCP tools when the allowlist is empty", async () => {
  let observedToolCount = -1;
  const gateway = await startGateway({ ...config, toolAllowlist: [] }, {
    provider: {
      async generate({ tools }) {
        observedToolCount = tools.length;
        return { text: "No tools" };
      }
    },
    mcp: {
      async listTools() {
        return [{ name: "resume", inputSchema: { type: "object" } }];
      },
      async callTool() {
        throw new Error("unexpected");
      }
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 200);
    assert.equal(observedToolCount, 0);
  } finally {
    await gateway.close();
  }
});

test("rejects untrusted origins before invoking dependencies", async () => {
  const gateway = await startGateway(config, {
    provider: { async generate() { throw new Error("unexpected"); } },
    mcp: {
      async listTools() { throw new Error("unexpected"); },
      async callTool() { throw new Error("unexpected"); }
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://attacker.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 403);
  } finally {
    await gateway.close();
  }
});

test("answers cross-origin preflight for widget headers and credentials", async () => {
  const gateway = await startGateway({ ...config, allowCredentials: true }, {
    provider: { async generate() { throw new Error("unexpected"); } },
    mcp: {
      async listTools() { throw new Error("unexpected"); },
      async callTool() { throw new Error("unexpected"); }
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "OPTIONS",
      headers: {
        origin: "https://example.test",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-vercel-ai-ui-message-stream,authorization"
      }
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://example.test");
    assert.match(response.headers.get("access-control-allow-headers") ?? "", /x-vercel-ai-ui-message-stream/);
    assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  } finally {
    await gateway.close();
  }
});

test("enforces remote bearer admission and the deploy-target admission hook", async () => {
  let admissions = 0;
  const gateway = await startGateway({
    ...config,
    securityMode: "remote",
    accessToken: "test-access-token"
  }, {
    provider: { async generate() { return { text: "ok" }; } },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    },
    admit() {
      admissions += 1;
      return false;
    }
  });
  try {
    const unauthorized = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(unauthorized.status, 401);
    const rateLimited = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: {
        authorization: "Bearer test-access-token",
        origin: "https://example.test",
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
    assert.equal(rateLimited.status, 429);
    assert.equal(admissions, 1);
  } finally {
    await gateway.close();
  }
});

test("fails closed when the deploy-target admission hook is unavailable", async () => {
  const gateway = await startGateway(config, {
    provider: { async generate() { throw new Error("unexpected"); } },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    },
    async admit() {
      throw new Error("rate limit store unavailable");
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json() as { code: string }).code, "internal_error");
  } finally {
    await gateway.close();
  }
});

test("returns a 400 response for every contract validation failure", async () => {
  const gateway = await startGateway(config, {
    provider: { async generate() { throw new Error("unexpected"); } },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    }
  });
  try {
    const response = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify({
        ...body,
        messages: [{ role: "unsupported", parts: [] }]
      })
    });
    assert.equal(response.status, 400);
    const error = await response.json() as { code: string; message: string };
    assert.equal(error.code, "invalid_request");
    assert.match(error.message, /supported role/);
  } finally {
    await gateway.close();
  }
});

test("enforces body, history, and per-message limits", async () => {
  const dependencies = {
    provider: { async generate() { throw new Error("unexpected"); } },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    }
  };
  const gateway = await startGateway({ ...config, maxBodyBytes: 80 }, dependencies);
  try {
    const oversizedBody = await fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify({ ...body, padding: "x".repeat(200) })
    });
    assert.equal(oversizedBody.status, 413);
  } finally {
    await gateway.close();
  }

  const limited = await startGateway({
    ...config,
    maxMessages: 1,
    maxInputLength: 4,
    toolAllowlist: []
  }, dependencies);
  try {
    const tooMany = await fetch(`${limited.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify({
        ...body,
        messages: [...body.messages, ...body.messages]
      })
    });
    assert.equal(tooMany.status, 400);
    const tooLong = await fetch(`${limited.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(tooLong.status, 400);
  } finally {
    await limited.close();
  }
});

test("times out a slow provider and preserves the concurrency cap", async () => {
  const timed = await startGateway({
    ...config,
    requestTimeoutMs: 10,
    toolAllowlist: []
  }, {
    provider: {
      async generate({ signal }) {
        return await new Promise((_, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), { once: true });
        });
      }
    },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    }
  });
  try {
    const response = await fetch(`${timed.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 502);
    assert.equal((await response.json() as { code: string }).code, "provider_unavailable");
  } finally {
    await timed.close();
  }

  let release: (() => void) | undefined;
  let entered: (() => void) | undefined;
  const providerEntered = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const providerReleased = new Promise<void>((resolve) => {
    release = resolve;
  });
  const concurrent = await startGateway({
    ...config,
    maxConcurrentRequests: 1,
    toolAllowlist: []
  }, {
    provider: {
      async generate() {
        entered?.();
        await providerReleased;
        return { text: "done" };
      }
    },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    }
  });
  try {
    const first = fetch(`${concurrent.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    await providerEntered;
    const second = await fetch(`${concurrent.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(second.status, 429);
    release?.();
    assert.equal((await first).status, 200);
  } finally {
    release?.();
    await concurrent.close();
  }
});

test("propagates client cancellation to the provider", async () => {
  let entered: (() => void) | undefined;
  let observedAbort: (() => void) | undefined;
  const providerEntered = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const providerAborted = new Promise<void>((resolve) => {
    observedAbort = resolve;
  });
  const gateway = await startGateway({ ...config, toolAllowlist: [] }, {
    provider: {
      async generate({ signal }) {
        entered?.();
        return await new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            observedAbort?.();
            reject(signal.reason);
          }, { once: true });
        });
      }
    },
    mcp: {
      async listTools() { return []; },
      async callTool() { throw new Error("unexpected"); }
    }
  });
  try {
    const controller = new AbortController();
    const pending = fetch(`${gateway.url}/v1/chat`, {
      method: "POST",
      headers: { origin: "https://example.test", "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    await providerEntered;
    controller.abort();
    await assert.rejects(pending, /abort/i);
    await providerAborted;
  } finally {
    await gateway.close();
  }
});
