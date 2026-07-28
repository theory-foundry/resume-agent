import assert from "node:assert/strict";
import test from "node:test";
import {
  createChatHeaders,
  createChatRequest,
  createChatUrl,
  readChatResponse,
} from "../dist/protocol.js";

test("creates the versioned gateway request", () => {
  const messages = [{ role: "user", parts: [{ type: "text", text: "Hello" }] }];
  assert.deepEqual(createChatRequest("conversation", messages), {
    version: "1",
    conversationId: "conversation",
    messages,
    trigger: "submit-message",
  });
  assert.equal(createChatUrl("https://example.com/"), "https://example.com/v1/chat");
  assert.equal(createChatUrl("https://example.com/v1/chat"), "https://example.com/v1/chat");
  assert.equal(createChatHeaders().get("x-vercel-ai-ui-message-stream"), "v1");
});

test("reads split SSE UI message chunks", async () => {
  const encoder = new TextEncoder();
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"text-delta","delta":"Hel'));
      controller.enqueue(encoder.encode('lo"}\n\ndata: {"type":"text-delta","delta":" world"}\n'));
      controller.enqueue(encoder.encode("data: [DONE]\n"));
      controller.close();
    },
  }), { headers: { "content-type": "text/event-stream" } });
  const pieces = [];
  assert.equal(await readChatResponse(response, (text) => pieces.push(text)), "Hello world");
  assert.deepEqual(pieces, ["Hello", " world"]);
});

test("surfaces structured gateway errors", async () => {
  const response = Response.json(
    { code: "rate_limited", message: "Try again later." },
    { status: 429 },
  );
  await assert.rejects(() => readChatResponse(response, () => {}), /Try again later/);
});
