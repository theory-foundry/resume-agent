"use client";

import { useChat } from "@ai-sdk/react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatConversationView } from "./ChatConversationView";
import { ChatEmptyState } from "./ChatEmptyState";
import { chatTransport } from "./chat-config";
import { hasRenderableMessageContent } from "./chat-utils";

export default function ChatUI() {
  const { messages, sendMessage, regenerate, setMessages, stop, status, error } = useChat({
    transport: chatTransport,
  });
  const [input, setInput] = useState("");
  const [copyError, setCopyError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const isLoading = status === "streaming" || status === "submitted";
  const lastMessage = messages[messages.length - 1];

  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );
  const showLoadingMessage =
    hasMessages && isLoading && (lastMessage?.role !== "assistant" || !hasRenderableMessageContent(lastMessage));

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (error) {
      console.error("ERROR CALLING AI: ", error);
    }
  }, [hasMessages, messages, status, error]);

  function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim();

    if (!text || isLoading) {
      return;
    }

    setCopyError(null);
    sendMessage({ text });
    setInput("");
  }

  async function handleCopyResponse(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(null);
    } catch (clipboardError) {
      console.error("Failed to copy response:", clipboardError);
      setCopyError("Could not copy response. Please copy it manually.");
    }
  }

  function handleNewChat() {
    stop();
    setMessages([]);
    setInput("");
    setCopyError(null);
  }

  return (
    <div className="flex h-full min-h-[70vh] w-full flex-1">
      {hasMessages ? (
        <ChatConversationView
          bottomRef={bottomRef}
          copyError={copyError}
          hasError={Boolean(error)}
          input={input}
          isLoading={isLoading}
          lastAssistantMessageId={lastAssistantMessage?.id}
          messages={messages}
          showLoadingMessage={showLoadingMessage}
          onCopyResponse={handleCopyResponse}
          onInputChange={setInput}
          onNewChat={handleNewChat}
          onRegenerate={regenerate}
          onStop={stop}
          onSubmit={handleSubmit}
          status={status}
        />
      ) : (
        <ChatEmptyState
          hasError={Boolean(error)}
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onStop={stop}
          onSubmit={handleSubmit}
          status={status}
        />
      )}
    </div>
  );
}
