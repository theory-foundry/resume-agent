"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { BotMessageSquareIcon, CopyPlusIcon, FlaskConicalIcon, RotateCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";
import type { ChatStatus, UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatConversationView } from "./ChatConversationView";
import { ChatEmptyState } from "./ChatEmptyState";
import {
  CHAT_HARNESS_SCENARIOS,
  CHAT_HARNESS_SUGGESTIONS,
  DEFAULT_CHAT_HARNESS_SCENARIO_ID,
  type ChatHarnessScenarioId,
  getChatHarnessScenario,
} from "./chat-harness-data";
import { hasRenderableMessageContent } from "./chat-utils";

const finalizeStreamingParts = (parts: UIMessage["parts"]): UIMessage["parts"] =>
  parts.map((part) => {
    if (part.type === "text" || part.type === "reasoning") {
      return part.state === "streaming" ? { ...part, state: "done" } : part;
    }

    return part;
  });

const removeTrailingAssistantMessage = (messages: UIMessage[]) => {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.role === "assistant" ? messages.slice(0, -1) : messages;
};

const cloneParts = (parts: UIMessage["parts"]): UIMessage["parts"] => parts.map((part) => ({ ...part }));

export default function ChatHarness() {
  const [activeScenarioId, setActiveScenarioId] = useState<ChatHarnessScenarioId>(DEFAULT_CHAT_HARNESS_SCENARIO_ID);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastRunRef = useRef<{ prompt: string; scenarioId: ChatHarnessScenarioId } | null>(null);
  const runIdRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);

  const hasMessages = messages.length > 0;
  const isLoading = status === "submitted" || status === "streaming";
  const activeScenario = getChatHarnessScenario(activeScenarioId);
  const lastMessage = messages[messages.length - 1];
  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );
  const showLoadingMessage =
    hasMessages && isLoading && (lastMessage?.role !== "assistant" || !hasRenderableMessageContent(lastMessage));

  const clearPlayback = () => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hasMessages, messages, status]);

  useEffect(() => {
    return () => {
      clearPlayback();
    };
  }, []);

  async function handleCopyResponse(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(null);
    } catch (clipboardError) {
      console.error("Failed to copy response:", clipboardError);
      setCopyError("Could not copy response. Please copy it manually.");
    }
  }

  function playScenario(nextMessages: UIMessage[], scenarioId: ChatHarnessScenarioId, prompt: string) {
    const scenario = getChatHarnessScenario(scenarioId);
    const assistantId = nanoid();
    const currentRunId = runIdRef.current + 1;

    runIdRef.current = currentRunId;
    clearPlayback();
    setActiveScenarioId(scenarioId);
    setCopyError(null);
    setMessages(nextMessages);
    setStatus("submitted");
    lastRunRef.current = { prompt, scenarioId };

    let elapsedMs = 0;

    scenario.frames.forEach((frame) => {
      elapsedMs += frame.delayMs;

      const timeoutId = window.setTimeout(() => {
        if (runIdRef.current !== currentRunId) {
          return;
        }

        setMessages((currentMessages) => {
          const nextAssistantMessage: UIMessage = {
            id: assistantId,
            parts: cloneParts(frame.parts),
            role: "assistant",
          };
          const assistantIndex = currentMessages.findIndex((message) => message.id === assistantId);

          if (assistantIndex === -1) {
            return [...currentMessages, nextAssistantMessage];
          }

          const updatedMessages = [...currentMessages];
          updatedMessages[assistantIndex] = nextAssistantMessage;
          return updatedMessages;
        });

        setStatus(frame.status);
      }, elapsedMs);

      timeoutsRef.current.push(timeoutId);
    });
  }

  function handleStop() {
    runIdRef.current += 1;
    clearPlayback();
    setStatus("ready");
    setMessages((currentMessages) => {
      const lastAssistantIndex = [...currentMessages].reverse().findIndex((message) => message.role === "assistant");

      if (lastAssistantIndex === -1) {
        return currentMessages;
      }

      const targetIndex = currentMessages.length - 1 - lastAssistantIndex;
      const updatedMessages = [...currentMessages];
      const assistantMessage = updatedMessages[targetIndex];

      updatedMessages[targetIndex] = {
        ...assistantMessage,
        parts: finalizeStreamingParts(assistantMessage.parts),
      };

      return updatedMessages;
    });
  }

  function handleNewChat() {
    runIdRef.current += 1;
    clearPlayback();
    setMessages([]);
    setInput("");
    setCopyError(null);
    setStatus("ready");
  }

  function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim();

    if (!text || isLoading) {
      return;
    }

    setInput("");
    playScenario(
      [
        ...messages,
        {
          id: nanoid(),
          parts: [{ text, type: "text" }],
          role: "user",
        },
      ],
      activeScenarioId,
      text,
    );
  }

  function handleRegenerate() {
    const lastRun = lastRunRef.current;

    if (!lastRun || isLoading) {
      return;
    }

    playScenario(removeTrailingAssistantMessage(messages), lastRun.scenarioId, lastRun.prompt);
  }

  function handleLoadScenario(scenarioId: ChatHarnessScenarioId) {
    const scenario = getChatHarnessScenario(scenarioId);
    setInput("");
    playScenario(
      [
        {
          id: nanoid(),
          parts: [{ text: scenario.prompt, type: "text" }],
          role: "user",
        },
      ],
      scenarioId,
      scenario.prompt,
    );
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-4">
      <div className="bg-background/80 rounded-3xl border p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <FlaskConicalIcon data-icon="inline-start" />
              No tokens
            </Badge>
            <Badge variant="outline">
              <BotMessageSquareIcon data-icon="inline-start" />
              {activeScenario.label}
            </Badge>
            <p className="text-muted-foreground text-sm">{activeScenario.description}</p>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <ButtonGroup aria-label="Harness scenarios">
              {CHAT_HARNESS_SCENARIOS.map((scenario) => (
                <Button
                  key={scenario.id}
                  onClick={() => handleLoadScenario(scenario.id)}
                  size="sm"
                  type="button"
                  variant={activeScenarioId === scenario.id ? "default" : "outline"}
                >
                  {scenario.label}
                </Button>
              ))}
            </ButtonGroup>

            <ButtonGroup aria-label="Harness actions">
              <Button onClick={() => handleLoadScenario(activeScenarioId)} size="sm" type="button" variant="outline">
                <RotateCcwIcon data-icon="inline-start" />
                Replay
              </Button>
              <Button onClick={handleNewChat} size="sm" type="button" variant="outline">
                <CopyPlusIcon data-icon="inline-start" />
                Clear
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>

      <div className="flex h-full min-h-[70vh] w-full flex-1">
        {hasMessages ? (
          <ChatConversationView
            bottomRef={bottomRef}
            copyError={copyError}
            eyebrow="UI Harness"
            hasError={false}
            input={input}
            inputPlaceholder={`Type any prompt and replay the "${activeScenario.label}" script...`}
            isLoading={isLoading}
            lastAssistantMessageId={lastAssistantMessage?.id}
            messages={messages}
            showLoadingMessage={showLoadingMessage}
            status={status}
            title="Scripted assistant playback"
            onCopyResponse={handleCopyResponse}
            onInputChange={setInput}
            onNewChat={handleNewChat}
            onRegenerate={handleRegenerate}
            onStop={handleStop}
            onSubmit={handleSubmit}
          />
        ) : (
          <ChatEmptyState
            hasError={false}
            input={input}
            isLoading={isLoading}
            placeholder={`Type a prompt or load the "${activeScenario.label}" scenario...`}
            status={status}
            suggestions={CHAT_HARNESS_SUGGESTIONS}
            title={
              <>
                <FlaskConicalIcon className="text-primary size-10" />
                Replay scripted AI chats
              </>
            }
            onInputChange={setInput}
            onStop={handleStop}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
