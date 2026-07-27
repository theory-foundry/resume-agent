"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export function ChatLoadingMessage() {
  return (
    <Message from="assistant">
      <MessageContent className="max-w-none space-y-3">
        <div className={`text-[11px] font-medium uppercase tracking-[0.22em] ${tw.TEXT_SECONDARY}`}>Assistant</div>
        <div
          aria-live="polite"
          aria-label="Assistant is responding"
          className={`relative inline-flex min-w-[12rem] overflow-hidden rounded-2xl rounded-bl-md border border-slate-900/10 px-4 py-3 text-sm shadow-sm dark:border-white/10 ${tw.BG_SECONDARY} ${tw.TEXT_PRIMARY}`}
          role="status"
        >
          <span className="sr-only">Assistant is responding</span>
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(15,23,42,0.02)_35%,rgba(15,23,42,0.10)_50%,rgba(15,23,42,0.02)_65%,transparent_100%)] motion-reduce:hidden loading-shimmer dark:bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.04)_35%,rgba(255,255,255,0.16)_50%,rgba(255,255,255,0.04)_65%,transparent_100%)]" />
          <span className="relative font-medium tracking-[0.01em]">Thinking...</span>
        </div>
        <style jsx>{`
          .loading-shimmer {
            transform: translateX(-160%);
            animation: loading-shimmer 2.2s ease-in-out infinite;
          }

          @keyframes loading-shimmer {
            from {
              transform: translateX(-160%);
            }

            to {
              transform: translateX(160%);
            }
          }
        `}</style>
      </MessageContent>
    </Message>
  );
}
