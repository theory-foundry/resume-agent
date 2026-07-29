# Runtime and deployment

Load this reference only when runtime, hosting, integration, or public exposure
decisions are needed. Ask one focused question at a time and skip only decisions
the adopter has already supplied and confirmed.

## 1. Intended use

Ask: “Will you use the site locally only, deploy the full site, or integrate the
widget into an existing site?”

- **Local only** — keep the reference site and services on loopback for private
  development or review.
- **Deploy the full site** — plan the reference site, gateway, and MCP runtime
  needed for public hosting.
- **Integrate the widget into an existing site** — preserve the host site and plan
  only the widget plus its gateway/MCP dependencies.
- **Other** — record a different intended use before continuing.

For widget integration, inspect the host framework and existing integration
surface rather than copying or replacing the reference site.

## 2. Service topology

Ask: “Should the gateway and MCP server run together or as separate services?”

- **Together** — use the combined runtime; the gateway is the browser-facing
  service and MCP remains loopback-private.
- **Separate services** — deploy or run gateway and MCP independently; this
  requires an exact canonical gateway Origin and a matching server-side MCP
  service credential.
- **Recommend one** — label the recommendation and base it on the confirmed
  hosting constraints; the adopter still decides.
- **Other** — record a different topology for explicit review.

Recommend the combined runtime for the simplest local setup unless confirmed
constraints require independent services. Do not represent a separate MCP service
as browser-facing.

## 3. Hosts and Origins

Ask: “Which public site and service origins or deployment hosts are planned?”

Explain that an Origin is the exact scheme, host, and optional port, without a
path. Then collect only the values needed by the selected topology, one follow-up
at a time:

- “What exact browser Origin will load the site or widget?”
- “What gateway host or URL will that browser-facing site use?”
- For a separate MCP service: “What MCP service URL is planned, and what exact
  gateway Origin should it accept?”
- For the reference-site proxy: “What exact public site Origin should the proxy
  send to the gateway?”

Do not guess production domains. Record unknown hosts as unresolved rather than
using permissive wildcards. The browser Origin must be explicitly allowed by the
gateway. A remote MCP service must accept only the configured canonical gateway
Origin.

## 4. Provider configuration and credential availability

Ask: “Will you use the repository's built-in OpenAI provider configuration, and
do you already have the required credential available?”

- **Use built-in OpenAI; credential available** — record availability only.
- **Use built-in OpenAI; credential not yet available** — retain the
  `OPENAI_API_KEY` placeholder and record a setup blocker.
- **Do not use the built-in OpenAI configuration** — record the provider decision
  as unresolved or future implementation work; do not invent configuration for
  an unsupported provider.
- **Not sure** — explain that the gateway requires a server-side model provider
  before the assistant can answer.

Never ask the adopter to paste, dictate, or confirm any secret value. Do not copy
credentials into the interview ledger, setup brief, source code, browser
configuration, logs, or tracked environment files.

## 5. Security posture

Ask: “Do you want local-safe defaults or production-facing security
configuration?”

- **Local-safe defaults** — bind gateway and MCP to `127.0.0.1`, use local
  security modes, and keep the setup non-public.
- **Production-facing security configuration** — plan remote gateway admission,
  explicit allowed Origins, missing-Origin rejection, server-side credentials,
  and remote MCP protection when MCP is separate.
- **Recommendation** — explain which posture matches the intended use, then ask
  the adopter to choose.
- **Other** — record the requirement for explicit security review.

Production-facing configuration is a plan, not deployment authorization.

## Credential and browser boundaries

- `OPENAI_API_KEY`, `MCP_SERVICE_TOKEN`, and any long-lived gateway access token
  remain server-side.
- `RESUME_AGENT_GATEWAY_TOKEN` belongs only in the reference site's server-side
  proxy configuration.
- Browser code may receive a gateway URL and non-secret presentation settings; it
  must not contain provider keys, MCP service tokens, or long-lived bearer tokens.
- A directly embedded public widget needs short-lived host-issued credentials or
  deployment-edge admission and rate limiting; do not place a long-lived token in
  its markup or JavaScript.
- Write only variable names and safe placeholders to tracked files. Use
  `.env.example` as the configuration inventory.

## Remote-mode rules

- Keep allowed Origins exact; never use `*` with credentials.
- A remote gateway must reject missing Origins, require admission, and allow only
  confirmed browser or proxy Origins.
- In combined mode, keep MCP loopback-private.
- A separately deployed MCP server requires remote security mode, the exact
  canonical gateway Origin, and the same server-side service credential on
  gateway and MCP.
- Explain every change from loopback-local defaults before editing exposure.

## Approval and completion gates

Record intended use, topology, exact known Origins or unresolved hosts, provider
choice, credential availability, security posture, and actions not authorized in
the final setup brief.

Approval of the setup brief authorizes only the configuration edits described in
that brief. If real credentials or production deployment are requested after
approval, ask: “Do you explicitly authorize using the available server-side
credentials and performing the production deployment described in the approved
setup brief?”

Proceed only after an explicit yes to that separate question. Before completion,
verify exact-Origin behavior, server/browser credential separation, selected
topology, and local versus remote security mode. Report deployment actions
separately from configuration changes.
