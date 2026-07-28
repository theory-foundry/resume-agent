---
name: full-template-setup
description: Personalize the resume-agent reference site, profile, chat, theme, and runtime safely.
---

# Full template setup

1. Interview the adopter for their target audience, factual resume content, projects, writing, contact links, desired tone, assets, theme, LLM provider configuration, and deployment topology.
2. Separate supplied facts from recommendations. Never invent employers, dates, metrics, qualifications, or accomplishments.
3. Update `packages/profile/src/example-profile.ts` with adopter-approved facts. Keep presentation settings in the site/widget configuration rather than the factual profile.
4. Replace placeholder assets under `apps/site/public/images/` and update accessible alternative text.
5. Configure gateway and MCP origins, ports, service credential, provider key, and public site proxy using `.env.example`.
6. Update assistant guidance only to describe tool behavior and response policy; profile facts must continue to come from the canonical profile.
7. Run `npm run verify`. Fix schema errors, unresolved placeholders, identity leakage, build failures, protocol failures, and widget smoke failures before declaring completion.
8. Summarize factual edits separately from recommendations and list any claims still awaiting confirmation.
