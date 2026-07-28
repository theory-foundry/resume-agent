---
name: mcp-capability-maintenance
description: Add or change resume MCP capabilities while preserving schemas, security, and gateway compatibility.
---

# MCP capability maintenance

1. Clarify the user scenario, exact capability name, input/output data, and whether the behavior is a tool, resource, or prompt.
2. Reuse the transport-independent domain core and canonical profile. Do not read site components or browser state from MCP code.
3. Update implementation, JSON schemas, descriptions, URI conventions, fixtures, and protocol tests together.
4. Keep Streamable HTTP, Origin validation, loopback defaults, remote service credentials, bounded errors, and secret redaction intact.
5. Update the gateway allowlist only when the capability should be available to browser chat.
6. Run MCP unit/integration tests, gateway integration tests, typecheck, and build.
7. Document any public contract change and whether it is backward compatible.
