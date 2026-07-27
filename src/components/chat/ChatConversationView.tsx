"use client";

import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import type { ChatStatus, UIMessage } from "ai";
import type { Ref } from "react";

import { ChatMessageList } from "./ChatMessageList";
import { ChatPromptInput } from "./ChatPromptInput";

type ChatConversationViewProps = {
  bottomRef: Ref<HTMLDivElement>;
  copyError: string | null;
  eyebrow?: string;
  hasError: boolean;
  input: string;
  inputPlaceholder?: string;
  isLoading: boolean;
  lastAssistantMessageId?: string;
  messages: UIMessage[];
  showLoadingMessage: boolean;
  status: ChatStatus;
  title?: string;
  onCopyResponse: (text: string) => void | Promise<void>;
  onInputChange: (value: string) => void;
  onNewChat: () => void;
  onRegenerate: () => void | Promise<void>;
  onStop: () => void;
  onSubmit: (message: PromptInputMessage) => void;
};

export function ChatConversationView({
  bottomRef,
  copyError,
  eyebrow = "AI Chat",
  hasError,
  input,
  inputPlaceholder = "Ask a follow-up...",
  isLoading,
  lastAssistantMessageId,
  messages,
  showLoadingMessage,
  status,
  title = "Ask about Lukas",
  onCopyResponse,
  onInputChange,
  onNewChat,
  onRegenerate,
  onStop,
  onSubmit,
}: ChatConversationViewProps) {
  return (
    <div
      className={`flex h-full min-h-[70vh] w-full flex-col overflow-hidden rounded-3xl border border-slate-900/10 ${tw.BG_SECONDARY} shadow-2xl dark:border-white/10`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-900/10 px-6 py-5 dark:border-white/10">
        <div>
          <p className={`text-xs font-medium uppercase tracking-[0.24em] ${tw.TEXT_SECONDARY}`}>{eyebrow}</p>
          <h1 className={`mt-2 text-2xl font-semibold ${tw.TEXT_PRIMARY}`}>{title}</h1>
        </div>
        <button
          className={`rounded-full border border-slate-900/10 px-4 py-2 text-sm transition hover:bg-slate-900/5 dark:border-white/10 dark:hover:bg-white/5 ${tw.BTN_NONE}`}
          onClick={onNewChat}
          type="button"
        >
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-6">
        <ChatMessageList
          bottomRef={bottomRef}
          copyError={copyError}
          lastAssistantMessageId={lastAssistantMessageId}
          messages={messages}
          showLoadingMessage={showLoadingMessage}
          onCopyResponse={onCopyResponse}
          onRegenerate={onRegenerate}
        />
      </div>

      <div className={`border-t border-slate-900/10 p-4 dark:border-white/10 ${tw.BG_PRIMARY}`}>
        <ChatPromptInput
          className="mx-auto w-full max-w-3xl"
          input={input}
          isLoading={isLoading}
          onInputChange={onInputChange}
          onStop={onStop}
          onSubmit={onSubmit}
          placeholder={inputPlaceholder}
          status={status}
          textareaClassName="max-h-40 min-h-[3.25rem]"
        />
        {hasError && (
          <p className="mt-3 text-center text-sm text-red-500 dark:text-red-400">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
