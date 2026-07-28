export interface ServiceHandle {
  url: string;
  closed: Promise<void>;
  close(): Promise<void>;
}

export interface RuntimeDependencies {
  startMcp(options: {
    host: string;
    port: number;
    allowedOrigins: string[];
    serviceToken?: string;
    securityMode: "local" | "remote";
  }): Promise<ServiceHandle>;
  startGateway(options: {
    host: string;
    port: number;
    mcpUrl: string;
  }): Promise<ServiceHandle>;
}

export interface RuntimeConfig {
  gatewayHost: string;
  mcpHost: string;
  mcpPort: number;
  gatewayPort: number;
  canonicalOrigin: string;
  mcpServiceToken?: string;
  mcpSecurityMode: "local" | "remote";
}

export interface RuntimeHandle {
  mcp: ServiceHandle;
  gateway: ServiceHandle;
  done: Promise<void>;
  close(): Promise<void>;
}

export async function startRuntime(
  config: RuntimeConfig,
  dependencies: RuntimeDependencies
): Promise<RuntimeHandle> {
  if (config.mcpPort !== 0 && config.mcpPort === config.gatewayPort) {
    throw new Error("MCP and gateway must use distinct ports.");
  }

  const mcp = await dependencies.startMcp({
    host: config.mcpHost,
    port: config.mcpPort,
    allowedOrigins: [config.canonicalOrigin],
    serviceToken: config.mcpServiceToken,
    securityMode: config.mcpSecurityMode
  });
  try {
    const gateway = await dependencies.startGateway({
      host: config.gatewayHost,
      port: config.gatewayPort,
      mcpUrl: mcp.url
    });
    let shuttingDown = false;
    let closing: Promise<void> | undefined;
    const handle: RuntimeHandle = {
      mcp,
      gateway,
      done: Promise.resolve(),
      close() {
        shuttingDown = true;
        closing ??= Promise.allSettled([gateway.close(), mcp.close()]).then((results) => {
          const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
          if (failure) throw failure.reason;
        });
        return closing;
      }
    };
    handle.done = Promise.race([
      mcp.closed.then(
        () => ({ service: "MCP", cause: undefined }),
        (cause: unknown) => ({ service: "MCP", cause }),
      ),
      gateway.closed.then(
        () => ({ service: "Gateway", cause: undefined }),
        (cause: unknown) => ({ service: "Gateway", cause }),
      ),
    ]).then(async ({ service, cause }) => {
      if (shuttingDown) return;
      await handle.close();
      throw new Error(
        `${service} stopped unexpectedly; the combined runtime shut down its sibling.`,
        { cause },
      );
    });
    return handle;
  } catch (error) {
    await mcp.close();
    throw error;
  }
}
