import {
  CHAT_API_VERSION,
  CHAT_ENDPOINT,
  CHAT_STREAM_HEADER,
  CHAT_STREAM_VERSION,
  type ChatError,
  type ChatMessage,
  type ChatRequest,
} from "@resume-agent/contracts";

export function createChatUrl(gatewayUrl: string): string {
  const url = new URL(gatewayUrl, globalThis.location?.href);
  const normalizedPath = url.pathname.replace(/\/+$/, "");
  if (!normalizedPath.endsWith(CHAT_ENDPOINT)) {
    url.pathname = `${normalizedPath}${CHAT_ENDPOINT}`;
  }
  return url.toString();
}

export function createChatRequest(
  conversationId: string,
  messages: ChatMessage[],
): ChatRequest {
  return {
    version: CHAT_API_VERSION,
    conversationId,
    messages,
    trigger: "submit-message",
  };
}

export function createChatHeaders(headers: Record<string, string> = {}): Headers {
  return new Headers({
    "content-type": "application/json",
    [CHAT_STREAM_HEADER]: CHAT_STREAM_VERSION,
    ...headers,
  });
}

function textFromChunk(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const chunk = value as Record<string, unknown>;

  if (chunk.type === "error") {
    throw new Error(
      typeof chunk.errorText === "string"
        ? chunk.errorText
        : typeof chunk.message === "string"
          ? chunk.message
          : "The chat stream failed.",
    );
  }

  if (
    (chunk.type === "text-delta" || chunk.type === "text") &&
    typeof chunk.delta === "string"
  ) {
    return chunk.delta;
  }
  if (
    (chunk.type === "text-delta" || chunk.type === "text") &&
    typeof chunk.text === "string"
  ) {
    return chunk.text;
  }
  return "";
}

export async function readChatResponse(
  response: Response,
  onText: (text: string) => void,
): Promise<string> {
  if (!response.ok) {
    let detail: ChatError | undefined;
    try {
      detail = (await response.json()) as ChatError;
    } catch {
      // The status text below is the safe fallback for non-JSON failures.
    }
    throw new Error(detail?.message || response.statusText || `Chat request failed (${response.status}).`);
  }

  if (!response.body) {
    throw new Error("The chat response did not contain a body.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const value = (await response.json()) as Record<string, unknown>;
    const text =
      typeof value.text === "string"
        ? value.text
        : typeof value.message === "string"
          ? value.message
          : "";
    if (!text) throw new Error("The chat response did not contain any text.");
    onText(text);
    return text;
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let completeText = "";

  const processLine = (rawLine: string): void => {
    const line = rawLine.trim();
    if (!line || line.startsWith(":")) return;
    const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
    if (!payload || payload === "[DONE]") return;

    try {
      const text = textFromChunk(JSON.parse(payload));
      if (text) {
        completeText += text;
        onText(text);
      }
    } catch (error) {
      if (error instanceof SyntaxError) return;
      throw error;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += value ?? "";
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) processLine(line);
    if (done) break;
  }
  if (buffer) processLine(buffer);

  if (!completeText) {
    throw new Error("The chat response did not contain any text.");
  }
  return completeText;
}
