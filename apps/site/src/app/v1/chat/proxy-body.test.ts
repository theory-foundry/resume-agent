import assert from "node:assert/strict";
import test from "node:test";

import { ProxyBodyTooLargeError, readJsonBody } from "./proxy-body.js";

test("parses bounded proxy JSON bodies", async () => {
  const value = await readJsonBody(
    new Request("http://site.test/v1/chat", {
      method: "POST",
      body: JSON.stringify({ message: "hello" }),
    }),
    64,
  );
  assert.deepEqual(value, { message: "hello" });
});

test("rejects declared and streamed bodies above the proxy limit", async () => {
  await assert.rejects(
    readJsonBody(
      new Request("http://site.test/v1/chat", {
        method: "POST",
        body: "oversized",
        headers: { "content-length": "100" },
      }),
      8,
    ),
    ProxyBodyTooLargeError,
  );
  await assert.rejects(
    readJsonBody(
      new Request("http://site.test/v1/chat", {
        method: "POST",
        body: "streamed oversized body",
      }),
      8,
    ),
    ProxyBodyTooLargeError,
  );
});
