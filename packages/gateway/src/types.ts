import type { ChatMessage } from "@resume-agent/contracts";
import type { IncomingMessage } from "node:http";

export interface GatewayTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface GatewayToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface GatewayToolResult {
  content: unknown;
  isError?: boolean;
}

export type ProviderMessage =
  | ChatMessage
  | {
      role: "assistant";
      parts: [];
      toolCalls: GatewayToolCall[];
    }
  | {
      role: "tool";
      toolCallId: string;
      content: unknown;
    };

export interface ProviderResult {
  text: string;
  toolCalls?: GatewayToolCall[];
}

export type ProviderChunk =
  | { type: "text-delta"; text: string }
  | { type: "tool-call"; call: GatewayToolCall };

export type ProviderTurn = ProviderResult | AsyncIterable<ProviderChunk>;

export interface ChatProvider {
  generate(input: {
    messages: ProviderMessage[];
    tools: GatewayTool[];
    signal: AbortSignal;
  }): Promise<ProviderTurn>;
}

export interface McpClient {
  listTools(signal: AbortSignal): Promise<GatewayTool[]>;
  callTool(call: GatewayToolCall, signal: AbortSignal): Promise<GatewayToolResult>;
  close?(): Promise<void>;
}

export interface GatewayLogger {
  info(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

export interface GatewayAdmissionContext {
  request: IncomingMessage;
  requestId: string;
  origin: string | null;
}

export type GatewayAdmission = (
  context: GatewayAdmissionContext,
) => boolean | Promise<boolean>;
