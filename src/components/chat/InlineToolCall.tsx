"use client";

import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolPart } from "@/components/ai-elements/tool";
import { getToolName } from "ai";
import { useState } from "react";

import { formatToolTitle } from "./chat-utils";

type InlineToolCallProps = {
  part: ToolPart;
};

export function InlineToolCall({ part }: InlineToolCallProps) {
  const title = formatToolTitle(getToolName(part));
  const [open, setOpen] = useState(false);

  return (
    <Tool onOpenChange={setOpen} open={open}>
      {part.type === "dynamic-tool" ? (
        <ToolHeader state={part.state} title={title} toolName={part.toolName} type={part.type} />
      ) : (
        <ToolHeader state={part.state} title={title} type={part.type} />
      )}
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput errorText={part.errorText} output={part.output} />
      </ToolContent>
    </Tool>
  );
}
