export const CHAT_API_VERSION = "1" as const;
export const CHAT_ENDPOINT = "/v1/chat" as const;
export const CHAT_STREAM_HEADER = "x-vercel-ai-ui-message-stream" as const;
export const CHAT_STREAM_VERSION = "v1" as const;

export type ChatRole = "user" | "assistant" | "system";

export interface ChatTextPart {
  type: "text";
  text: string;
}

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  parts: ChatTextPart[];
}

export interface ChatRequest {
  version: typeof CHAT_API_VERSION;
  conversationId: string;
  messages: ChatMessage[];
  trigger: "submit-message" | "regenerate-message";
  messageId?: string;
}

export interface ChatError {
  code:
    | "invalid_request"
    | "message_too_long"
    | "rate_limited"
    | "provider_unavailable"
    | "mcp_unavailable"
    | "internal_error";
  message: string;
  requestId?: string;
}

export interface WidgetTheme {
  accent?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  radius?: string;
}

export interface WidgetConfig {
  gatewayUrl: string;
  title?: string;
  placeholder?: string;
  suggestions?: string[];
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
  theme?: WidgetTheme;
}

export class ChatRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatRequestValidationError";
  }
}

export function parseChatRequest(value: unknown, limits = { maxMessages: 20, maxInputLength: 2_000 }): ChatRequest {
  if (!value || typeof value !== "object") {
    throw new ChatRequestValidationError("Request body must be an object.");
  }

  const request = value as Partial<ChatRequest>;
  if (request.version !== CHAT_API_VERSION) {
    throw new ChatRequestValidationError(`Unsupported chat API version. Expected ${CHAT_API_VERSION}.`);
  }
  if (typeof request.conversationId !== "string" || request.conversationId.trim() === "") {
    throw new ChatRequestValidationError("conversationId is required.");
  }
  if (request.trigger !== "submit-message" && request.trigger !== "regenerate-message") {
    throw new ChatRequestValidationError("trigger must be submit-message or regenerate-message.");
  }
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new ChatRequestValidationError("messages must contain at least one message.");
  }
  if (request.messages.length > limits.maxMessages) {
    throw new ChatRequestValidationError(`messages cannot contain more than ${limits.maxMessages} entries.`);
  }

  for (const message of request.messages) {
    if (!message || !["user", "assistant", "system"].includes(message.role) || !Array.isArray(message.parts)) {
      throw new ChatRequestValidationError("Every message must have a supported role and parts array.");
    }
    for (const part of message.parts) {
      if (!part || part.type !== "text" || typeof part.text !== "string") {
        throw new ChatRequestValidationError("V1 only supports text message parts.");
      }
      if (part.text.length > limits.maxInputLength) {
        throw new ChatRequestValidationError(`Message parts cannot exceed ${limits.maxInputLength} characters.`);
      }
    }
  }

  return request as ChatRequest;
}

export function isAllowedOrigin(origin: string | null, allowedOrigins: readonly string[], allowMissing = false): boolean {
  if (!origin) return allowMissing;
  return allowedOrigins.includes(origin);
}
