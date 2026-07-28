import type {
  ChatProvider,
  GatewayTool,
  GatewayToolCall,
  ProviderChunk,
  ProviderMessage,
} from "./types.js";

interface OpenAiProviderOptions {
  apiKey: string;
  model: string;
  fetch?: typeof globalThis.fetch;
  baseUrl?: string;
}

function toOpenAiMessage(message: ProviderMessage): Record<string, unknown> {
  if (message.role === "tool") {
    return {
      role: "tool",
      tool_call_id: message.toolCallId,
      content: JSON.stringify(message.content)
    };
  }
  if ("toolCalls" in message) {
    return {
      role: "assistant",
      content: null,
      tool_calls: message.toolCalls.map((call: GatewayToolCall) => ({
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: JSON.stringify(call.arguments) }
      }))
    };
  }
  return {
    role: message.role,
    content: message.parts.map((part: { text: string }) => part.text).join("\n")
  };
}

function toOpenAiTool(tool: GatewayTool): Record<string, unknown> {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  };
}

function parseToolCall(value: unknown): GatewayToolCall {
  const call = value as {
    id?: unknown;
    function?: { name?: unknown; arguments?: unknown };
  };
  if (
    typeof call.id !== "string"
    || typeof call.function?.name !== "string"
    || typeof call.function.arguments !== "string"
  ) {
    throw new Error("OpenAI returned a malformed tool call.");
  }
  const parsed = JSON.parse(call.function.arguments) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("OpenAI tool arguments must be a JSON object.");
  }
  return { id: call.id, name: call.function.name, arguments: parsed as Record<string, unknown> };
}

export function createOpenAiProvider(options: OpenAiProviderOptions): ChatProvider {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const baseUrl = options.baseUrl ?? "https://api.openai.com/v1";

  return {
    async generate({ messages, tools, signal }): Promise<AsyncIterable<ProviderChunk>> {
      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: options.model,
          messages: messages.map(toOpenAiMessage),
          stream: true,
          tools: tools.length > 0 ? tools.map(toOpenAiTool) : undefined,
        }),
        signal
      });
      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}.`);
      }
      if (!response.body) throw new Error("OpenAI returned no response body.");

      return (async function* streamCompletion(): AsyncIterable<ProviderChunk> {
        const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
        const toolCalls = new Map<number, { id: string; name: string; arguments: string }>();
        let buffer = "";

        const parseLine = (rawLine: string): ProviderChunk[] => {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) return [];
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") return [];
          const value = JSON.parse(data) as {
            error?: { message?: string };
            choices?: Array<{
              delta?: {
                content?: string | null;
                tool_calls?: Array<{
                  index?: number;
                  id?: string;
                  function?: { name?: string; arguments?: string };
                }>;
              };
            }>;
          };
          if (value.error) throw new Error(value.error.message ?? "OpenAI stream failed.");
          const delta = value.choices?.[0]?.delta;
          const chunks: ProviderChunk[] = [];
          if (typeof delta?.content === "string" && delta.content) {
            chunks.push({ type: "text-delta", text: delta.content });
          }
          for (const partial of delta?.tool_calls ?? []) {
            if (!Number.isInteger(partial.index)) {
              throw new Error("OpenAI returned a malformed tool call.");
            }
            const index = partial.index!;
            const current = toolCalls.get(index) ?? { id: "", name: "", arguments: "" };
            if (partial.id) current.id += partial.id;
            if (partial.function?.name) current.name += partial.function.name;
            if (partial.function?.arguments) current.arguments += partial.function.arguments;
            toolCalls.set(index, current);
          }
          return chunks;
        };

        while (true) {
          const { done, value } = await reader.read();
          buffer += value ?? "";
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            for (const chunk of parseLine(line)) yield chunk;
          }
          if (done) break;
        }
        if (buffer) {
          for (const chunk of parseLine(buffer)) yield chunk;
        }
        for (const [, call] of [...toolCalls.entries()].sort(([a], [b]) => a - b)) {
          yield {
            type: "tool-call",
            call: parseToolCall({
              id: call.id,
              function: { name: call.name, arguments: call.arguments },
            }),
          };
        }
      })();
    }
  };
}
