import { pathToFileURL } from "node:url";

import { exampleProfile } from "@resume-agent/profile";

import { parseMcpHttpConfig } from "./config.js";
import { startMcpServer } from "./http.js";

export async function runMcpCli(): Promise<void> {
  const config = parseMcpHttpConfig();
  const running = await startMcpServer({ ...config, profile: exampleProfile });
  process.stdout.write(`resume-agent MCP server listening at ${running.url}\n`);

  const shutdown = async () => {
    await running.close();
    process.exitCode = 0;
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMcpCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown startup error.";
    process.stderr.write(`Failed to start resume-agent MCP server: ${message}\n`);
    process.exitCode = 1;
  });
}
