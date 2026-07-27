"use client";

import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { UIMessage } from "ai";
import type { ButtonHTMLAttributes, ComponentProps, HTMLAttributes } from "react";
import { memo } from "react";
import { Streamdown } from "streamdown";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full flex-col gap-2",
      from === "user" ? "is-user items-end" : "is-assistant items-start",
      className,
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({ children, className, ...props }: MessageContentProps) => (
  <div
    className={cn(
      "min-w-0 max-w-full text-sm leading-7",
      "group-[.is-user]:max-w-[80%] group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-violet-200 group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-white dark:group-[.is-user]:bg-violet-600",
      "group-[.is-assistant]:w-full group-[.is-assistant]:text-slate-950 dark:group-[.is-assistant]:text-white",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = HTMLAttributes<HTMLDivElement>;

export const MessageActions = ({ className, children, ...props }: MessageActionsProps) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  className,
  tooltip,
  label,
  children,
  type = "button",
  ...props
}: MessageActionProps) => (
  <button
    aria-label={label || tooltip}
    className={cn(
      `inline-flex items-center justify-center rounded-full border border-slate-900/10 p-2 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 ${tw.BG_SECONDARY} ${tw.TEXT_PRIMARY}`,
      className,
    )}
    title={tooltip}
    type={type}
    {...props}
  >
    {children}
  </button>
);

const streamdownPlugins = { cjk, code, math, mermaid };

export type MessageResponseProps = ComponentProps<typeof Streamdown>;

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "size-full break-words text-slate-950 dark:text-white [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-cyan-800 [&_a]:underline dark:[&_a]:text-cyan-600 [&_code]:rounded [&_code]:bg-slate-900/10 [&_code]:px-1.5 [&_code]:py-0.5 dark:[&_code]:bg-black/20 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900/10 [&_pre]:p-4 dark:[&_pre]:bg-black/30",
        className,
      )}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children && prevProps.isAnimating === nextProps.isAnimating,
);

MessageResponse.displayName = "MessageResponse";

export type MessageToolbarProps = HTMLAttributes<HTMLDivElement>;

export const MessageToolbar = ({ className, children, ...props }: MessageToolbarProps) => (
  <div className={cn("flex w-full items-center justify-between gap-4", className)} {...props}>
    {children}
  </div>
);
