import { createMcpClient, createOpenAiProvider, loadGatewayConfig, startGateway } from "./index.js";

const config = loadGatewayConfig();
if (!config.openAiApiKey) {
  throw new Error("OPENAI_API_KEY is required.");
}

const mcp = await createMcpClient({
  url: config.mcpUrl,
  canonicalOrigin: config.canonicalOrigin,
  serviceToken: config.mcpServiceToken
});
const gateway = await startGateway(config, {
  provider: createOpenAiProvider({ apiKey: config.openAiApiKey, model: config.openAiModel }),
  mcp,
  logger: console
});
console.log(`Gateway listening on ${gateway.url}`);

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await gateway.close();
    await mcp.close?.();
    process.exitCode = 0;
  } catch (error) {
    console.error("Gateway shutdown failed.", error);
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
