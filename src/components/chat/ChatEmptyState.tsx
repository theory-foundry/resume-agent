"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";
import type { ChatStatus } from "ai";
import Image from "next/image";
import type { ReactNode } from "react";

import { ChatPromptInput } from "./ChatPromptInput";
import { CHAT_SUGGESTIONS } from "./chat-config";

type ChatEmptyStateProps = {
  hasError: boolean;
  input: string;
  isLoading: boolean;
  placeholder?: string;
  suggestions?: string[];
  status: ChatStatus;
  title?: ReactNode;
  onInputChange: (value: string) => void;
  onStop: () => void;
  onSubmit: (message: PromptInputMessage) => void;
};

export function ChatEmptyState({
  hasError,
  input,
  isLoading,
  placeholder = "Ask about projects, experience, or technical skills...",
  suggestions = CHAT_SUGGESTIONS,
  status,
  title = (
    <>
      <Image alt="ai logo" className="h-10 w-auto" height={20} src="/ai.svg" width={20} /> Ask AI anything about me!
    </>
  ),
  onInputChange,
  onStop,
  onSubmit,
}: ChatEmptyStateProps) {
  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center">
        <h2 className={`flex items-center gap-3 text-xl font-semibold tracking-tight sm:text-5xl ${tw.TEXT_PRIMARY}`}>
          {title}
        </h2>

        <ChatPromptInput
          className="mt-10 w-full max-w-2xl"
          input={input}
          isLoading={isLoading}
          onInputChange={onInputChange}
          onStop={onStop}
          onSubmit={onSubmit}
          placeholder={placeholder}
          status={status}
          textareaClassName="max-h-40 min-h-[4rem] text-base"
        />

        {suggestions.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {suggestions.map((suggestion) => (
              <button
                className={`rounded-full border border-slate-900/10 px-4 py-2 text-sm transition hover:border-cyan-700/40 hover:bg-slate-900/5 dark:border-white/10 dark:hover:border-cyan-400/40 dark:hover:bg-white/5 ${tw.BG_SECONDARY} ${tw.TEXT_PRIMARY}`}
                key={suggestion}
                onClick={() => onInputChange(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {hasError && (
          <p className="mt-6 text-center text-sm text-red-500 dark:text-red-400">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
