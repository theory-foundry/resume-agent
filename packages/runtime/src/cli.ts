#!/usr/bin/env node
import {
  createMcpClient,
  createOpenAiProvider,
  loadGatewayConfig,
  startGateway
} from "@resume-agent/gateway";
import { startMcpServer } from "@resume-agent/mcp";
import { startRuntime } from "./index.js";

const gatewayConfig = loadGatewayConfig();
if (!gatewayConfig.openAiApiKey) throw new Error("OPENAI_API_KEY is required.");
const mcpPort = Number.parseInt(process.env.MCP_PORT ?? "8789", 10);
const mcpSecurityMode = process.env.MCP_SECURITY_MODE === "remote" ? "remote" : "local";

const runtime = await startRuntime(
  {
    gatewayHost: gatewayConfig.host,
    mcpHost: process.env.MCP_HOST ?? "127.0.0.1",
    mcpPort,
    gatewayPort: gatewayConfig.port,
    canonicalOrigin: gatewayConfig.canonicalOrigin,
    mcpServiceToken: gatewayConfig.mcpServiceToken,
    mcpSecurityMode
  },
  {
    startMcp: startMcpServer,
    async startGateway({ host, port, mcpUrl }) {
      const config = { ...gatewayConfig, host, port, mcpUrl };
      const mcp = await createMcpClient({
        url: mcpUrl,
        canonicalOrigin: config.canonicalOrigin,
        serviceToken: config.mcpServiceToken
      });
      try {
        const gateway = await startGateway(config, {
          provider: createOpenAiProvider({
            apiKey: config.openAiApiKey!,
            model: config.openAiModel
          }),
          mcp,
          logger: console
        });
        return {
          ...gateway,
          async close() {
            await gateway.close();
            await mcp.close?.();
          }
        };
      } catch (error) {
        await mcp.close?.();
        throw error;
      }
    }
  }
);
console.log(`MCP listening on ${runtime.mcp.url}`);
console.log(`Gateway listening on ${runtime.gateway.url}`);

void runtime.done.catch((error) => {
  console.error("Combined runtime stopped unexpectedly.", error);
  process.exitCode = 1;
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await runtime.close();
    process.exitCode = 0;
  } catch (error) {
    console.error(`Runtime shutdown after ${signal} failed.`, error);
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
