import type {
  ChatMessage,
  WidgetConfig,
  WidgetTheme,
} from "@resume-agent/contracts";
import {
  createChatHeaders,
  createChatRequest,
  createChatUrl,
  readChatResponse,
} from "./protocol.js";

export const RESUME_AGENT_TAG = "resume-agent-chat" as const;

export type ResumeAgentEventName =
  | "resume-agent:ready"
  | "resume-agent:request"
  | "resume-agent:response"
  | "resume-agent:error";

export interface ResumeAgentRequestDetail {
  message: string;
  conversationId: string;
}

export interface ResumeAgentResponseDetail {
  message: string;
  conversationId: string;
}

export interface ResumeAgentErrorDetail {
  error: Error;
  conversationId: string;
}

const HTMLElementBase: typeof HTMLElement =
  globalThis.HTMLElement ?? (class {} as typeof HTMLElement);

const styles = `
  :host {
    --ra-accent: #3157d5;
    --ra-background: #ffffff;
    --ra-foreground: #172033;
    --ra-muted: #637083;
    --ra-radius: 16px;
    color: var(--ra-foreground);
    display: block;
    font: 400 16px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    max-width: 440px;
  }
  * { box-sizing: border-box; }
  .shell {
    background: var(--ra-background);
    border: 1px solid color-mix(in srgb, var(--ra-foreground) 16%, transparent);
    border-radius: var(--ra-radius);
    box-shadow: 0 16px 44px color-mix(in srgb, var(--ra-foreground) 12%, transparent);
    overflow: hidden;
  }
  header {
    border-bottom: 1px solid color-mix(in srgb, var(--ra-foreground) 12%, transparent);
    font-weight: 700;
    padding: 14px 16px;
  }
  .messages {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 420px;
    min-height: 180px;
    overflow: auto;
    padding: 16px;
  }
  .message {
    border-radius: calc(var(--ra-radius) * .7);
    margin: 0;
    max-width: 88%;
    padding: 9px 12px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .user {
    align-self: flex-end;
    background: var(--ra-accent);
    color: #fff;
  }
  .assistant {
    align-self: flex-start;
    background: color-mix(in srgb, var(--ra-foreground) 7%, var(--ra-background));
  }
  .status {
    color: var(--ra-muted);
    font-size: 13px;
    margin: 0;
    min-height: 20px;
    padding: 0 16px;
  }
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    padding: 8px 16px 0;
  }
  .suggestions:empty { display: none; }
  button, textarea { font: inherit; }
  .suggestion {
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--ra-accent) 45%, transparent);
    border-radius: 999px;
    color: var(--ra-accent);
    cursor: pointer;
    font-size: 13px;
    padding: 5px 9px;
  }
  form {
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr auto;
    padding: 12px 16px 16px;
  }
  label {
    grid-column: 1 / -1;
    font-size: 13px;
    font-weight: 600;
  }
  textarea {
    background: var(--ra-background);
    border: 1px solid color-mix(in srgb, var(--ra-foreground) 25%, transparent);
    border-radius: calc(var(--ra-radius) * .6);
    color: var(--ra-foreground);
    min-height: 44px;
    padding: 9px 10px;
    resize: vertical;
  }
  .submit {
    align-self: end;
    background: var(--ra-accent);
    border: 0;
    border-radius: calc(var(--ra-radius) * .6);
    color: #fff;
    cursor: pointer;
    min-height: 44px;
    padding: 8px 13px;
  }
  button:disabled, textarea:disabled { cursor: not-allowed; opacity: .58; }
  button:focus-visible, textarea:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--ra-accent) 45%, transparent);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

function newConversationId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `resume-agent-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseSuggestions(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return value.split("|").map((item) => item.trim()).filter(Boolean);
  }
}

function parseTheme(value: string | null): WidgetTheme | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as WidgetTheme : undefined;
  } catch {
    return undefined;
  }
}

export class ResumeAgentElement extends HTMLElementBase {
  static observedAttributes = [
    "gateway-url",
    "title",
    "placeholder",
    "suggestions",
    "credentials",
    "theme",
  ];

  #config: Partial<WidgetConfig> = {};
  #messages: ChatMessage[] = [];
  #conversationId = newConversationId();
  #requestController?: AbortController;
  #listenersController?: AbortController;
  #initialized = false;

  get config(): Partial<WidgetConfig> {
    return { ...this.#config };
  }

  set config(value: Partial<WidgetConfig>) {
    this.#config = { ...value };
    this.#renderConfig();
  }

  get gatewayUrl(): string {
    return this.#config.gatewayUrl ?? this.getAttribute("gateway-url") ?? "";
  }

  set gatewayUrl(value: string) {
    this.#config.gatewayUrl = value;
    this.#renderConfig();
  }

  get suggestions(): string[] {
    return this.#config.suggestions ?? parseSuggestions(this.getAttribute("suggestions"));
  }

  set suggestions(value: string[]) {
    this.#config.suggestions = [...value];
    this.#renderConfig();
  }

  get theme(): WidgetTheme | undefined {
    return this.#config.theme ?? parseTheme(this.getAttribute("theme"));
  }

  set theme(value: WidgetTheme | undefined) {
    this.#config.theme = value;
    this.#renderConfig();
  }

  connectedCallback(): void {
    if (!this.shadowRoot) this.#createDom();
    this.#bind();
    this.#renderConfig();
    if (!this.#initialized) {
      this.#initialized = true;
      queueMicrotask(() => this.#emit("resume-agent:ready", undefined));
    }
  }

  disconnectedCallback(): void {
    this.#listenersController?.abort();
    this.#requestController?.abort();
  }

  attributeChangedCallback(): void {
    this.#renderConfig();
  }

  cancel(): void {
    this.#requestController?.abort();
  }

  reset(): void {
    this.cancel();
    this.#messages = [];
    this.#conversationId = newConversationId();
    this.#messagesElement?.replaceChildren();
    this.#setStatus("");
  }

  focusInput(): void {
    this.#inputElement?.focus();
  }

  get #titleElement(): HTMLElement | null {
    return this.shadowRoot?.querySelector("[data-title]") ?? null;
  }

  get #messagesElement(): HTMLElement | null {
    return this.shadowRoot?.querySelector("[data-messages]") ?? null;
  }

  get #statusElement(): HTMLElement | null {
    return this.shadowRoot?.querySelector("[data-status]") ?? null;
  }

  get #suggestionsElement(): HTMLElement | null {
    return this.shadowRoot?.querySelector("[data-suggestions]") ?? null;
  }

  get #formElement(): HTMLFormElement | null {
    return this.shadowRoot?.querySelector("form") ?? null;
  }

  get #inputElement(): HTMLTextAreaElement | null {
    return this.shadowRoot?.querySelector("textarea") ?? null;
  }

  get #submitElement(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector("[data-submit]") ?? null;
  }

  #createDom(): void {
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = styles;
    const shell = document.createElement("section");
    shell.className = "shell";
    shell.setAttribute("aria-label", "Resume assistant chat");
    shell.innerHTML = `
      <header data-title></header>
      <div class="messages" data-messages role="log" aria-live="polite" aria-relevant="additions"></div>
      <p class="status" data-status role="status" aria-live="polite"></p>
      <div class="suggestions" data-suggestions aria-label="Suggested questions"></div>
      <form>
        <label for="resume-agent-input">Message the resume assistant</label>
        <textarea id="resume-agent-input" rows="2"></textarea>
        <button class="submit" data-submit type="submit">Send</button>
      </form>
    `;
    root.append(style, shell);
  }

  #bind(): void {
    this.#listenersController?.abort();
    this.#listenersController = new AbortController();
    const signal = this.#listenersController.signal;
    this.#formElement?.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.#submit();
    }, { signal });
    this.#inputElement?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.#formElement?.requestSubmit();
      }
    }, { signal });
  }

  #renderConfig(): void {
    if (!this.shadowRoot) return;
    const title = this.#config.title ?? this.getAttribute("title") ?? "Ask about this resume";
    const placeholder =
      this.#config.placeholder ?? this.getAttribute("placeholder") ?? "Ask about experience, skills, or projects…";
    const credentials =
      this.#config.credentials ?? this.getAttribute("credentials") as RequestCredentials | null;
    if (credentials) this.#config.credentials = credentials;
    if (this.#titleElement) this.#titleElement.textContent = title;
    if (this.#inputElement) this.#inputElement.placeholder = placeholder;

    const theme = this.theme;
    const themeProperties: Array<[keyof WidgetTheme, string]> = [
      ["accent", "--ra-accent"],
      ["background", "--ra-background"],
      ["foreground", "--ra-foreground"],
      ["muted", "--ra-muted"],
      ["radius", "--ra-radius"],
    ];
    for (const [key, property] of themeProperties) {
      const value = theme?.[key];
      if (value) this.style.setProperty(property, value);
      else this.style.removeProperty(property);
    }

    const suggestions = this.#suggestionsElement;
    suggestions?.replaceChildren();
    for (const text of this.suggestions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion";
      button.textContent = text;
      button.addEventListener("click", () => {
        if (this.#inputElement) this.#inputElement.value = text;
        this.focusInput();
      }, { signal: this.#listenersController?.signal });
      suggestions?.append(button);
    }
  }

  async #submit(): Promise<void> {
    const input = this.#inputElement;
    const message = input?.value.trim() ?? "";
    if (!message || this.#requestController) return;
    if (!this.gatewayUrl) {
      this.#handleError(new Error("gatewayUrl is required."));
      return;
    }

    input!.value = "";
    this.#appendMessage("user", message);
    this.#messages.push({ role: "user", parts: [{ type: "text", text: message }] });
    const assistantElement = this.#appendMessage("assistant", "");
    this.#setBusy(true);
    this.#setStatus("Thinking…");
    this.#emit("resume-agent:request", {
      message,
      conversationId: this.#conversationId,
    } satisfies ResumeAgentRequestDetail);

    const controller = new AbortController();
    this.#requestController = controller;
    let responseText = "";
    try {
      const response = await fetch(createChatUrl(this.gatewayUrl), {
        method: "POST",
        credentials: this.#config.credentials ?? "same-origin",
        headers: createChatHeaders(this.#config.headers),
        body: JSON.stringify(createChatRequest(this.#conversationId, this.#messages)),
        signal: controller.signal,
      });
      responseText = await readChatResponse(response, (text) => {
        responseText += text;
        assistantElement.textContent = responseText;
        this.#messagesElement?.scrollTo({ top: this.#messagesElement.scrollHeight });
      });
      this.#messages.push({ role: "assistant", parts: [{ type: "text", text: responseText }] });
      this.#setStatus("");
      this.#emit("resume-agent:response", {
        message: responseText,
        conversationId: this.#conversationId,
      } satisfies ResumeAgentResponseDetail);
    } catch (error) {
      assistantElement.remove();
      if (controller.signal.aborted) {
        this.#setStatus("Request cancelled.");
      } else {
        this.#handleError(error instanceof Error ? error : new Error("Chat request failed."));
      }
    } finally {
      this.#requestController = undefined;
      this.#setBusy(false);
    }
  }

  #appendMessage(role: "user" | "assistant", text: string): HTMLParagraphElement {
    const element = document.createElement("p");
    element.className = `message ${role}`;
    element.setAttribute("aria-label", role === "user" ? "You" : "Resume assistant");
    element.textContent = text;
    this.#messagesElement?.append(element);
    this.#messagesElement?.scrollTo({ top: this.#messagesElement.scrollHeight });
    return element;
  }

  #setBusy(busy: boolean): void {
    if (this.#inputElement) this.#inputElement.disabled = busy;
    if (this.#submitElement) {
      this.#submitElement.disabled = busy;
      this.#submitElement.textContent = busy ? "Stop" : "Send";
      this.#submitElement.onclick = busy ? () => this.cancel() : null;
      this.#submitElement.type = busy ? "button" : "submit";
    }
  }

  #setStatus(message: string): void {
    if (this.#statusElement) this.#statusElement.textContent = message;
  }

  #handleError(error: Error): void {
    this.#setStatus(error.message);
    this.#emit("resume-agent:error", {
      error,
      conversationId: this.#conversationId,
    } satisfies ResumeAgentErrorDetail);
  }

  #emit(name: ResumeAgentEventName, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail,
    }));
  }
}

export function defineResumeAgentElement(
  registry: CustomElementRegistry | undefined = globalThis.customElements,
): void {
  if (registry && !registry.get(RESUME_AGENT_TAG)) {
    registry.define(RESUME_AGENT_TAG, ResumeAgentElement);
  }
}
