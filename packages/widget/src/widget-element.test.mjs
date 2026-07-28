import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

test("mounts the actual custom element with isolated safe rendering and remount lifecycle", async () => {
  const window = new Window({ url: "http://widget-host.test/" });
  for (const name of [
    "window",
    "document",
    "customElements",
    "HTMLElement",
    "CustomEvent",
    "Event",
    "KeyboardEvent",
    "HTMLFormElement",
    "HTMLTextAreaElement",
    "HTMLButtonElement",
    "location",
  ]) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: window[name],
      writable: true,
    });
  }
  globalThis.fetch = async () => new Response(
    [
      'data: {"type":"start","messageId":"assistant-1"}',
      'data: {"type":"text-delta","id":"text-1","delta":"<script>unsafe()</script>"}',
      'data: {"type":"finish"}',
      "data: [DONE]",
      "",
    ].join("\n\n"),
    {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "x-vercel-ai-ui-message-stream": "v1",
      },
    },
  );

  await import(`../dist/index.js?widget-element-test=${Date.now()}`);
  const element = document.createElement("resume-agent-chat");
  element.setAttribute("gateway-url", "http://gateway.test");
  document.body.append(element);
  await Promise.resolve();

  assert.ok(element.shadowRoot);
  assert.match(element.shadowRoot.querySelector("style")?.textContent ?? "", /prefers-reduced-motion/);
  assert.equal(document.querySelector(".shell"), null);

  const response = new Promise((resolve) => {
    element.addEventListener("resume-agent:response", resolve, { once: true });
  });
  const input = element.shadowRoot.querySelector("textarea");
  input.value = "Tell me about this resume";
  element.shadowRoot.querySelector("form").requestSubmit();
  await response;

  const assistant = element.shadowRoot.querySelector(".message.assistant");
  assert.equal(assistant?.textContent, "<script>unsafe()</script>");
  assert.equal(assistant?.querySelector("script"), null);
  element.focusInput();
  assert.equal(element.shadowRoot.activeElement, input);

  element.remove();
  document.body.append(element);
  await Promise.resolve();
  assert.ok(element.shadowRoot.querySelector("form"));
  element.remove();
  await window.happyDOM.abort();
});
