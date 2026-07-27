"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { BotIcon, FlaskConicalIcon } from "lucide-react";
import { useState } from "react";

import ChatHarness from "./ChatHarness";
import ChatUI from "./ChatUI";

type ChatMode = "harness" | "live";

const defaultMode: ChatMode = process.env.NODE_ENV === "production" ? "live" : "harness";

export default function ChatPlayground() {
  const [mode, setMode] = useState<ChatMode>(defaultMode);

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-4">
      <div className="bg-background/80 rounded-3xl border p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Chat sandbox</Badge>
            <Badge variant="outline">{mode === "harness" ? "Hardcoded responses" : "Live /api/chat"}</Badge>
            <p className="text-muted-foreground text-sm">
              Harness mode replays scripted reasoning, tool calls, and streamed answers locally. Live mode keeps the
              existing AI integration available.
            </p>
          </div>

          <ButtonGroup aria-label="Chat mode">
            <Button
              onClick={() => setMode("harness")}
              size="sm"
              type="button"
              variant={mode === "harness" ? "default" : "outline"}
            >
              <FlaskConicalIcon data-icon="inline-start" />
              UI harness
            </Button>
            <Button
              onClick={() => setMode("live")}
              size="sm"
              type="button"
              variant={mode === "live" ? "default" : "outline"}
            >
              <BotIcon data-icon="inline-start" />
              Live AI
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {mode === "harness" ? <ChatHarness /> : <ChatUI />}
    </div>
  );
}
