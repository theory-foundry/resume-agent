---
name: widget-only-integration
description: Add the resume-agent widget, gateway, and MCP server to an existing website without replacing it.
---

# Widget-only integration

1. Interview the adopter for host framework, deployment hosts, browser Origin, content source, theme, provider, and whether gateway/MCP run together or separately.
2. Install the built `@resume-agent/widget` browser entry and define the `<resume-agent-chat>` element. Do not copy the reference Next.js site.
3. Configure `gateway-url`, labels, suggestions, credentials policy, and CSS custom properties. Keep provider and MCP service credentials server-side.
4. Configure gateway CORS for the exact host Origin. For separate remote MCP, configure the gateway's canonical MCP Origin and matching service credential.
5. Load adopter profile content through `@resume-agent/profile`; never embed personal claims in the widget.
6. Verify preflight, streaming, cancellation, errors, keyboard/focus behavior, reduced motion, and host/widget style isolation.
7. Run the plain-HTML fixture first, then a host-site smoke test, and report the exact environment/deployment boundaries.
