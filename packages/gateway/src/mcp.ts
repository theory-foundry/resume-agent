import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { GatewayTool, GatewayToolCall, McpClient } from "./types.js";

interface McpClientOptions {
  url: string;
  canonicalOrigin: string;
  serviceToken?: string;
}

export async function createMcpClient(options: McpClientOptions): Promise<McpClient> {
  const headers: Record<string, string> = { origin: options.canonicalOrigin };
  if (options.serviceToken) headers.authorization = `Bearer ${options.serviceToken}`;

  const transport = new StreamableHTTPClientTransport(new URL(options.url), {
    requestInit: { headers }
  });
  const client = new Client({ name: "resume-agent-gateway", version: "0.1.0" });
  await client.connect(transport);

  return {
    async listTools(signal): Promise<GatewayTool[]> {
      const result = await client.listTools(undefined, { signal });
      return result.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as Record<string, unknown>
      }));
    },
    async callTool(call: GatewayToolCall, signal) {
      const result = await client.callTool(
        { name: call.name, arguments: call.arguments },
        undefined,
        { signal }
      );
      return { content: result.content, isError: result.isError === true };
    },
    async close() {
      await client.close();
    }
  };
}
