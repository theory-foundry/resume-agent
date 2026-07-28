# Architecture

```text
Reference site or existing website
             |
      <resume-agent-chat>
             |
       POST /v1/chat + SSE
             |
       Chat gateway (LLM host)
             |
    Streamable HTTP MCP client
             |
        Resume MCP server
             |
     Canonical validated profile
```

The browser never holds an LLM or MCP service credential. The widget speaks the versioned chat contract from `@resume-agent/contracts`. The gateway owns provider calls, admission controls, the MCP client, and streamed responses. The MCP package exposes profile-backed capabilities using the official TypeScript SDK. The reference Next.js application uses the same gateway contract as the plain-HTML example.

The combined runtime starts gateway and MCP together but does not merge their interfaces. Independent deployments remain supported.
