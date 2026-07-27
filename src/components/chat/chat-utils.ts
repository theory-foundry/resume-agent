import { isReasoningUIPart, isTextUIPart, isToolUIPart, type UIMessage } from "ai";

export const formatToolTitle = (toolName: string) =>
  toolName.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const hasRenderableMessageContent = (message: UIMessage) =>
  message.parts.some((part) => isTextUIPart(part) || isReasoningUIPart(part) || isToolUIPart(part));
