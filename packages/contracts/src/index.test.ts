import assert from "node:assert/strict";
import test from "node:test";
import {
  CHAT_API_VERSION,
  ChatRequestValidationError,
  isAllowedOrigin,
  parseChatRequest,
} from "./index.js";

test("parses the versioned chat request", () => {
  const request = parseChatRequest({
    version: CHAT_API_VERSION,
    conversationId: "demo",
    trigger: "submit-message",
    messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }],
  });
  assert.equal(request.messages[0]?.parts[0]?.text, "Hello");
});

test("rejects oversized messages and disallowed origins", () => {
  assert.throws(
    () =>
      parseChatRequest(
        {
          version: CHAT_API_VERSION,
          conversationId: "demo",
          trigger: "submit-message",
          messages: [{ role: "user", parts: [{ type: "text", text: "too long" }] }],
        },
        { maxMessages: 20, maxInputLength: 4 },
      ),
    ChatRequestValidationError,
  );
  assert.equal(isAllowedOrigin("https://example.com", ["https://resume.example"]), false);
});
