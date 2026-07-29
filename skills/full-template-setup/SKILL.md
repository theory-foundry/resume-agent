---
name: full-template-setup
description: Personalize the resume-agent reference site, profile, chat, theme, and runtime safely.
---

# Full template setup

Use this skill to turn an adopter's existing resume and confirmed choices into a
personalized reference site. Keep the conversation about their resume and desired
site; use implementation terminology only when it helps the coding agent.

## Prerequisites and safety

- Require an accessible existing resume. This workflow does not create one from
  scratch.
- Always ask the adopter which profession they want the site to present. Do not
  infer the final answer from the resume.
- Inspect the resume and relevant repository surfaces before asking for facts
  already available there.
- Treat extracted facts as provisional until confirmed. Never invent, strengthen,
  or silently rewrite employers, titles, dates, metrics, credentials,
  qualifications, accomplishments, or other personal claims.
- Keep confirmed facts in `packages/profile/src/example-profile.ts`. Keep theme,
  navigation, assets, contact presentation, and assistant settings in site or
  widget configuration.
- Ask whether credentials are available, never for secret values. Keep provider
  and service credentials out of browser code, tracked files, and interview
  artifacts.
- Do not remove material resume content, publish private contact details, extend
  the default site, or deploy to production without explicit adopter approval.

## Load references only when needed

- At interview start or resume, read
  [Interview flow](references/interview-flow.md).
- For the active stage only, read
  [Question bank](references/question-bank.md). Do not present the entire bank at
  once.
- After the resume and current site have been inspected, read
  [Resume compatibility](references/resume-compatibility.md).
- When visual direction is active, read
  [Theme presets](references/theme-presets.md).
- When runtime, hosting, or public exposure is active, read
  [Runtime and deployment](references/runtime-and-deployment.md).
- Skip a reference when the adopter has already supplied and confirmed everything
  governed by it.

## Orchestrate the setup

1. Maintain an interview ledger of completed stages, confirmed facts, adopter
   choices, recommendations, pending decisions, and future-site-extension notes.
2. Ask one focused question at a time. Prefer bounded choices plus a freeform
   alternative when the decision space is known, and explain practical
   consequences in plain language.
3. Intake and fully inspect the existing resume, then ask directly about
   profession, primary site goal, target roles or services, audience, and tone.
4. Review how the resume fits the current site. Confirm the factual summary, fill
   material gaps, and ask the adopter whether unsupported content should be
   omitted from initial setup or recorded as a possible future site extension.
5. Confirm the factual profile before moving to presentation choices. Then cover
   theme, content visibility, public contact, assets, resume download, assistant
   presentation, runtime, and deployment.
6. Produce a final setup brief separating confirmed resume facts, adopter choices,
   agent recommendations, omissions, unresolved or unconfirmed information,
   future site extensions, and runtime/deployment decisions.
7. Ask the adopter to approve the final setup brief. **Do not edit the repository
   before explicit approval.**

## Implement after approval

Apply only the approved brief. Update the canonical factual profile, then the
separate presentation and runtime surfaces. Replace placeholders only with
adopter-supplied or explicitly approved content and assets, keep alternative text
meaningful, and ground assistant suggestions in confirmed profile content.

Configure environment variable names and safe placeholders rather than secret
values. Treat production deployment as a separate authorization boundary even
when the brief describes the intended topology.

Run `npm run verify`. Fix profile validation errors, unresolved placeholders,
identity leakage, build or protocol failures, and widget smoke failures before
declaring completion. Report factual edits separately from presentation choices
and recommendations, and list unconfirmed claims, omitted content, deferred site
extensions, deployment actions not taken, and verification evidence.
