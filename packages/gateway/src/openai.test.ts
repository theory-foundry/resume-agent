import assert from "node:assert/strict";
import test from "node:test";

import { createOpenAiProvider } from "./openai.js";

test("streams OpenAI text deltas without buffering the completion", async () => {
  const encoder = new TextEncoder();
  let requestBody: Record<string, unknown> | undefined;
  const provider = createOpenAiProvider({
    apiKey: "test-key",
    model: "test-model",
    fetch: async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n'));
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"world"}}]}\n\n'));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      }), { status: 200 });
    }
  });

  const turn = await provider.generate({
    messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }],
    tools: [],
    signal: new AbortController().signal
  });
  assert.ok(Symbol.asyncIterator in Object(turn));
  const deltas: string[] = [];
  for await (const chunk of turn as AsyncIterable<{ type: string; text?: string }>) {
    if (chunk.type === "text-delta") deltas.push(chunk.text ?? "");
  }
  assert.deepEqual(deltas, ["Hello ", "world"]);
  assert.equal(requestBody?.stream, true);
});
