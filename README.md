# Resume Agent

Resume Agent is a reusable template for building a personal resume website with an AI chat experience. It can be used in two ways:

- Customize the included Next.js reference site.
- Install only the framework-neutral chat widget and deploy the gateway plus MCP server alongside an existing website.

The project keeps four important concerns separate:

- `@resume-agent/profile` — validated factual resume content.
- `@resume-agent/widget` — a Shadow DOM custom element that works without Next.js.
- `@resume-agent/gateway` — the server-side LLM host and MCP client.
- `@resume-agent/mcp` — a standards-compliant Streamable HTTP MCP server.

See [the architecture guide](docs/architecture.md) for the request flow and trust boundaries.

## Requirements

- Node.js 22.9 or newer
- npm 10 or newer
- An OpenAI API key for live chat

The current MCP implementation pins the production v1 SDK line. SDK use is isolated in the MCP package so a future v2 migration does not leak into the resume domain.

## Full-site quick start

```bash
npm install
npm run build:packages
cp .env.example .env
npm run dev:runtime
```

In another terminal:

```bash
npm run dev:site
```

Open `http://localhost:3000`. The site proxies browser chat to the gateway, so the browser never receives `OPENAI_API_KEY` or `MCP_SERVICE_TOKEN`.

Personalize the template by following [`skills/full-template-setup/SKILL.md`](skills/full-template-setup/SKILL.md). The canonical example content is in `packages/profile/src/example-profile.ts`.

## Widget-only quick start

Build the public packages:

```bash
npm install
npm run build
```

Serve the plain-HTML host on a different Origin from the gateway:

```bash
npm run dev:widget-example
```

Then configure the element:

```html
<script type="module" src="../../packages/widget/dist/resume-agent.js"></script>
<resume-agent-chat gateway-url="http://localhost:8788"></resume-agent-chat>
```

Start the backend:

```bash
npm run dev:runtime
```

Open `http://127.0.0.1:4173/examples/plain-html/`. For a real existing site, follow [`skills/widget-only-integration/SKILL.md`](skills/widget-only-integration/SKILL.md) and configure `GATEWAY_ALLOWED_ORIGINS` to the site's exact Origin.

## Independent services

Start MCP:

```bash
npm run dev:mcp
```

Start the gateway separately:

```bash
npm run dev:gateway
```

The gateway endpoint is `POST /v1/chat`. The MCP endpoint is `/mcp`. They are intentionally different protocols: the widget consumes a UI message stream, while the gateway invokes resume capabilities through MCP.

## Configuration

Copy `.env.example` and replace every `replace-with-*` value.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Gateway | Server-only model credential |
| `OPENAI_MODEL` | Gateway | Built-in OpenAI model |
| `GATEWAY_HOST`, `GATEWAY_PORT` | Gateway/runtime | Gateway bind address |
| `GATEWAY_SECURITY_MODE` | Gateway/runtime | `local` for loopback or `remote` for external binding |
| `GATEWAY_ACCESS_TOKEN` | Gateway/reference-site proxy | Required bearer admission token in remote mode |
| `GATEWAY_ALLOWED_ORIGINS` | Gateway | Exact browser Origins |
| `GATEWAY_ALLOW_MISSING_ORIGIN` | Gateway | Allow non-browser requests; defaults true only in local mode |
| `GATEWAY_ALLOW_CREDENTIALS` | Gateway | Enables credentialed CORS for explicit Origins |
| `GATEWAY_MAX_TOOL_RESULT_BYTES` | Gateway | Maximum serialized MCP result accepted into model context |
| `MCP_SERVER_URL` | Gateway | Streamable HTTP MCP endpoint |
| `MCP_CLIENT_ORIGIN` | Gateway | Canonical gateway Origin sent to remote MCP |
| `MCP_SERVICE_TOKEN` | Gateway/MCP | Service-to-service credential |
| `MCP_HOST`, `MCP_PORT` | MCP/runtime | MCP bind address |
| `MCP_SECURITY_MODE` | MCP/runtime | `local` for loopback or `remote` for separate deployment |
| `MCP_ALLOWED_ORIGINS` | MCP | Exact gateway Origins |
| `RESUME_AGENT_GATEWAY_URL` | Reference site | Server-side proxy target |
| `RESUME_AGENT_GATEWAY_TOKEN` | Reference site | Server-only bearer forwarded to a remote gateway |
| `RESUME_AGENT_SITE_ORIGIN` | Reference site | Exact site Origin sent by the server-side proxy |
| `RESUME_AGENT_PROXY_MAX_BODY_BYTES` | Reference site | Request cap enforced before proxy JSON parsing |

Local defaults bind to `127.0.0.1`. In combined mode the MCP server remains loopback-private. A separately deployed MCP server requires the configured service token and exact canonical gateway Origin.

For an externally bound combined runtime, set `GATEWAY_HOST=0.0.0.0`, `GATEWAY_SECURITY_MODE=remote`, `GATEWAY_ALLOW_MISSING_ORIGIN=false`, an exact `GATEWAY_ALLOWED_ORIGINS`, and a long random `GATEWAY_ACCESS_TOKEN`. The reference-site proxy holds that token in `RESUME_AGENT_GATEWAY_TOKEN` and sends its exact configured `RESUME_AGENT_SITE_ORIGIN`, which must appear in the gateway allowlist. Do not embed a long-lived gateway token in public widget JavaScript; direct public widgets should obtain short-lived credentials from their host or use the exported gateway admission hook with deployment-edge authentication and rate limiting.

For a separately deployed MCP server, set `MCP_SECURITY_MODE=remote`, an exact `MCP_ALLOWED_ORIGINS` matching `MCP_CLIENT_ORIGIN`, and the same long random `MCP_SERVICE_TOKEN` on MCP and gateway.

## Repository workflows

- Full personalization: `skills/full-template-setup/SKILL.md`
- Resume updates: `skills/resume-content-maintenance/SKILL.md`
- MCP changes: `skills/mcp-capability-maintenance/SKILL.md`
- Existing-site widget integration: `skills/widget-only-integration/SKILL.md`

These Markdown workflows are public-safe and can be read by Codex, Claude, Copilot, and other coding assistants. They require confirmation before adding unsupported career claims.

## Verification

```bash
npm run verify
```

This runs identity-leak detection, typechecking, package tests, and production builds. Protocol, credential-boundary, and plain-HTML widget tests are required release gates.

## Package boundaries

The browser-safe packages must not import Next.js, Node built-ins, provider SDKs, or server packages. Consumers should import package exports, never another workspace's `src` directory. The reference site is intentionally a consumer of the same profile and chat contracts available to adopters.

## Security notes

- Never expose provider or MCP service credentials in browser code.
- Keep allowed Origins explicit; do not use `*` with credentials.
- Use a long random `MCP_SERVICE_TOKEN` for separate deployments.
- Remote gateway mode fails closed without bearer admission. For public anonymous deployments, provide deployment-edge authentication/rate limiting through the gateway admission hook.
- Treat profile and tool output as untrusted display content; the widget renders text without injecting HTML.

## License

Add the license that matches how you want others to use your customized repository before publishing it.
