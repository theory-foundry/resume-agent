"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";
import { CopyIcon, RefreshCwIcon } from "lucide-react";
import { Fragment } from "react";
import { isReasoningUIPart, isTextUIPart, isToolUIPart, type UIMessage } from "ai";

import { InlineToolCall } from "./InlineToolCall";
import { hasRenderableMessageContent } from "./chat-utils";

type ChatMessageProps = {
  copyError: string | null;
  isLatestAssistantMessage: boolean;
  message: UIMessage;
  onCopyResponse: (text: string) => void | Promise<void>;
  onRegenerate: () => void | Promise<void>;
};

export function ChatMessage({
  copyError,
  isLatestAssistantMessage,
  message,
  onCopyResponse,
  onRegenerate,
}: ChatMessageProps) {
  const isRenderablePart = (part: UIMessage["parts"][number]) =>
    isTextUIPart(part) || isReasoningUIPart(part) || isToolUIPart(part);

  const textParts = message.parts.filter(isTextUIPart);

  if (!hasRenderableMessageContent(message)) {
    return null;
  }

  const textContent = textParts.map((part) => part.text).join("\n\n");
  const firstTextPartIndex = message.parts.findIndex(isTextUIPart);
  const showActions = isLatestAssistantMessage && textParts.length > 0;

  return (
    <Fragment>
      <Message from={message.role}>
        <MessageContent className={message.role === "assistant" ? "max-w-none space-y-4" : undefined}>
          {message.role === "assistant" ? (
            <div className="space-y-4">
              {message.parts.map((part, index) => {
                if (!isRenderablePart(part)) {
                  return null;
                }

                const showAssistantLabel = isTextUIPart(part) && index === firstTextPartIndex;

                if (isReasoningUIPart(part) && part.text.trim()) {
                  return (
                    <div className="w-full" key={`${message.id}-reasoning-${index}`}>
                      <Reasoning isStreaming={part.state === "streaming"}>
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    </div>
                  );
                }

                if (isTextUIPart(part)) {
                  return (
                    <div className="w-full" key={`${message.id}-text-${index}`}>
                      {showAssistantLabel && (
                        <div
                          className={`bold mt-2 text-[11px] font-medium uppercase tracking-[0.22em] ${tw.TEXT_SECONDARY}`}
                        >
                          Assistant
                        </div>
                      )}
                      <MessageResponse>{part.text}</MessageResponse>
                    </div>
                  );
                }

                if (isToolUIPart(part)) {
                  return (
                    <div className="w-full" key={`${message.id}-tool-${index}`}>
                      <InlineToolCall part={part} />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          ) : (
            textParts.map((part, index) => (
              <MessageResponse key={`${message.id}-${index}`}>{part.text}</MessageResponse>
            ))
          )}
        </MessageContent>
      </Message>
      {message.role === "assistant" && showActions && (
        <MessageToolbar className="mt-0">
          <MessageActions>
            <MessageAction label="Retry response" onClick={() => void onRegenerate()} tooltip="Retry">
              <RefreshCwIcon className="size-3.5" />
            </MessageAction>
            <MessageAction label="Copy response" onClick={() => void onCopyResponse(textContent)} tooltip="Copy">
              <CopyIcon className="size-3.5" />
            </MessageAction>
          </MessageActions>
        </MessageToolbar>
      )}
      {message.role === "assistant" && showActions && copyError && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400">{copyError}</p>
      )}
    </Fragment>
  );
}
