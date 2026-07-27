import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";
import { createAgent } from "langchain";
import { toBaseMessages } from "@ai-sdk/langchain";
import { createUIMessageStream, createUIMessageStreamResponse, isToolUIPart, UIMessage } from "ai";
import { MAIN_RESUME_AI_SYSTEM_PROMPT } from "@/constants/system-prompts/MainResumeAISystemPrompt";
import {
  getBlogAndProjectsTool,
  getBlogPostByIdTool,
  getContactInfoTool,
  getProjectByIdTool,
  getResumeTool,
} from "./tools";

const MAX_INPUT_LENGTH = 2000;
const MAX_MESSAGES = 20;
const REASONING_MODEL_PREFIXES = ["o1", "o3", "gpt-5"];

const SYSTEM_PROMPT = MAIN_RESUME_AI_SYSTEM_PROMPT;

type StreamEvent = {
  data?: Record<string, unknown>;
  event?: string;
  name?: string;
  run_id?: string;
};

const normalizeToolInputs = (messages: UIMessage[]): UIMessage[] =>
  messages.map((message) => {
    if (message.role !== "assistant") {
      return message;
    }

    return {
      ...message,
      parts: message.parts.map((part) => {
        if (!isToolUIPart(part) || part.input !== undefined) {
          return part;
        }

        return {
          ...part,
          input: "rawInput" in part ? part.rawInput : {},
        };
      }),
    };
  });

const extractReasoningFromChunk = (chunk: Record<string, unknown>) => {
  const kwargs =
    chunk.kwargs && typeof chunk.kwargs === "object" ? (chunk.kwargs as Record<string, unknown>) : chunk;
  const contentBlocks = kwargs.contentBlocks;

  if (Array.isArray(contentBlocks)) {
    const reasoning = contentBlocks
      .map((block) => {
        if (!block || typeof block !== "object") {
          return null;
        }

        if ("reasoning" in block && typeof block.reasoning === "string") {
          return block.reasoning;
        }

        if ("thinking" in block && typeof block.thinking === "string") {
          return block.thinking;
        }

        return null;
      })
      .filter((value): value is string => Boolean(value))
      .join("");

    if (reasoning) {
      return reasoning;
    }
  }

  const additionalKwargs =
    kwargs.additional_kwargs && typeof kwargs.additional_kwargs === "object"
      ? (kwargs.additional_kwargs as Record<string, unknown>)
      : undefined;
  const reasoningSummary =
    additionalKwargs?.reasoning &&
    typeof additionalKwargs.reasoning === "object" &&
    "summary" in additionalKwargs.reasoning &&
    Array.isArray(additionalKwargs.reasoning.summary)
      ? additionalKwargs.reasoning.summary
      : undefined;

  if (!reasoningSummary) {
    return undefined;
  }

  const reasoning = reasoningSummary
    .map((item) => (item && typeof item === "object" && "text" in item && typeof item.text === "string" ? item.text : null))
    .filter((value): value is string => Boolean(value))
    .join("");

  return reasoning || undefined;
};

const extractTextFromChunk = (chunk: Record<string, unknown>) => {
  const content = chunk.content;

  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (!part || typeof part !== "object" || !("type" in part) || part.type !== "text" || !("text" in part)) {
        return "";
      }

      return typeof part.text === "string" ? part.text : "";
    })
    .join("");
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uiMessages: UIMessage[] = body.messages ?? [];

    if (!Array.isArray(uiMessages) || uiMessages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    // Enforce history length limit
    const trimmedMessages = normalizeToolInputs(uiMessages.slice(-MAX_MESSAGES));

    // Validate last user message length
    const lastMessage = trimmedMessages[trimmedMessages.length - 1];
    const lastTextPart = lastMessage?.parts?.find((p: { type: string }) => p.type === "text") as
      | { type: "text"; text: string }
      | undefined;
    if (!lastTextPart?.text) {
      return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
    }
    if (lastTextPart.text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json({ error: "Message too long. Please keep it under 2000 characters." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "LLM API key is not configured." }, { status: 500 });
    }

    const modelName = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const supportsReasoning = REASONING_MODEL_PREFIXES.some((prefix) => modelName.startsWith(prefix));

    const model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName,
      streaming: true,
      ...(supportsReasoning
        ? {
            reasoning: {
              effort: "medium",
              summary: "auto",
            },
          }
        : {
            temperature: 0.7,
          }),
    });

    // Convert UIMessages to LangChain BaseMessages
    const baseMessages = await toBaseMessages(trimmedMessages);
    const agentMessages = [new SystemMessage(SYSTEM_PROMPT), ...baseMessages];

    // Create a ReAct agent with all recruiter-facing tools
    const agent = createAgent({
      model: model,
      tools: [getResumeTool, getContactInfoTool, getBlogAndProjectsTool, getBlogPostByIdTool, getProjectByIdTool],
    });

    const agentStream = await agent.streamEvents({ messages: agentMessages }, { version: "v2" });

    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: async ({ writer }) => {
          const streamState = {
            messageId: "langchain-msg-1",
            reasoningMessageId: null as string | null,
            reasoningStarted: false,
            started: false,
            textMessageId: null as string | null,
            textStarted: false,
          };

          writer.write({ type: "start" });

          for await (const rawEvent of agentStream as AsyncIterable<unknown>) {
            if (!rawEvent || typeof rawEvent !== "object") {
              continue;
            }

            const event = rawEvent as StreamEvent;
            const data = event.data && typeof event.data === "object" ? event.data : undefined;

            if (event.run_id && !streamState.started) {
              streamState.messageId = event.run_id;
            }

            switch (event.event) {
              case "on_chat_model_start": {
                const runId =
                  event.run_id ?? (typeof data?.run_id === "string" ? data.run_id : undefined);
                if (runId) {
                  streamState.messageId = runId;
                }
                break;
              }
              case "on_chat_model_stream": {
                const chunk = data?.chunk;
                if (!chunk || typeof chunk !== "object") {
                  break;
                }

                const chunkRecord = chunk as Record<string, unknown>;

                if (typeof chunkRecord.id === "string") {
                  streamState.messageId = chunkRecord.id;
                }

                const reasoning = extractReasoningFromChunk(chunkRecord);
                if (reasoning) {
                  if (!streamState.reasoningStarted) {
                    streamState.reasoningMessageId = streamState.messageId;
                    writer.write({ id: streamState.messageId, type: "reasoning-start" });
                    streamState.reasoningStarted = true;
                    streamState.started = true;
                  }

                  writer.write({
                    delta: reasoning,
                    id: streamState.reasoningMessageId ?? streamState.messageId,
                    type: "reasoning-delta",
                  });
                }

                const text = extractTextFromChunk(chunkRecord);
                if (!text) {
                  break;
                }

                if (streamState.reasoningStarted && !streamState.textStarted) {
                  writer.write({
                    id: streamState.reasoningMessageId ?? streamState.messageId,
                    type: "reasoning-end",
                  });
                  streamState.reasoningStarted = false;
                }

                if (!streamState.textStarted) {
                  streamState.textMessageId = streamState.messageId;
                  writer.write({ id: streamState.messageId, type: "text-start" });
                  streamState.textStarted = true;
                  streamState.started = true;
                }

                writer.write({
                  delta: text,
                  id: streamState.textMessageId ?? streamState.messageId,
                  type: "text-delta",
                });
                break;
              }
              case "on_tool_start": {
                const runId =
                  event.run_id ?? (typeof data?.run_id === "string" ? data.run_id : undefined);
                const toolName =
                  event.name ?? (typeof data?.name === "string" ? data.name : undefined);

                if (!runId || !toolName) {
                  break;
                }

                writer.write({
                  dynamic: true,
                  toolCallId: runId,
                  toolName,
                  type: "tool-input-start",
                });

                if (data && "input" in data) {
                  writer.write({
                    dynamic: true,
                    input: data.input,
                    toolCallId: runId,
                    toolName,
                    type: "tool-input-available",
                  });
                }

                break;
              }
              case "on_tool_end": {
                const runId =
                  event.run_id ?? (typeof data?.run_id === "string" ? data.run_id : undefined);

                if (!runId) {
                  break;
                }

                writer.write({
                  output: data?.output,
                  toolCallId: runId,
                  type: "tool-output-available",
                });
                break;
              }
            }
          }

          if (streamState.reasoningStarted) {
            writer.write({
              id: streamState.reasoningMessageId ?? streamState.messageId,
              type: "reasoning-end",
            });
          }

          if (streamState.textStarted) {
            writer.write({
              id: streamState.textMessageId ?? streamState.messageId,
              type: "text-end",
            });
          }

          writer.write({ type: "finish" });
        },
      }),
    });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
