# Interview flow

Load this reference when starting or resuming setup. Use the adopter's existing
answers and the interview ledger to enter at the earliest incomplete stage.

## Interaction contract

- Ask one focused question at a time.
- Inspect available resume and repository evidence before asking for discoverable
  facts.
- Use freeform input for the resume, profession, positioning, and factual
  corrections. Use bounded options plus a freeform alternative for decisions with
  a known choice set.
- Explain the practical consequence of each bounded option when presenting it.
- Label recommendations, explain their basis, and keep them distinct from personal
  claims and adopter choices.
- Ask follow-ups only for missing, conflicting, ambiguous, privacy-sensitive, or
  decision-bearing information.
- Summarize facts already clear in the resume instead of asking the adopter to
  repeat them.
- Never treat silence as confirmation of a new or materially rewritten claim.
- After every answer, update the interview ledger before asking the next question.

## Stage sequence

### 1. Existing resume intake

Load the resume-intake section of [Question bank](question-bank.md). Obtain an
accessible resume and any known corrections, then read the resume completely.
Record extracted facts as provisional and flag conflicts, unclear dates, missing
links, unsupported claims, and obvious placeholders without repairing them.

Exit only when the resume is accessible, fully inspected, and its source-of-truth
status is recorded. If no existing resume is available, stop this workflow.

### 2. Profession and positioning

Load the profession-and-positioning questions. Ask for profession directly even
when the resume suggests an answer. Then establish one primary site goal, target
roles or services, one primary audience, and tone.

Secondary goals and audiences are allowed, but require a primary choice to guide
content hierarchy and recommendations. If profession, target emphasis, and resume
evidence materially conflict, explain the mismatch and ask which positioning
should govern.

Exit when all five decisions are recorded and any material positioning conflict
is resolved or listed as an unresolved blocker.

### 3. Resume compatibility with the site

Inspect the current factual-profile and site-presentation surfaces, then load
[Resume compatibility](resume-compatibility.md) and the matching question-bank
section. Present what fits the current site, what is missing for it, what would
require extending it, and any privacy concerns.

Handle unsupported content item by item. Do not automatically combine unrelated
sections or expand the site. Exit only after the adopter confirms the material
compatibility summary and approves a disposition for every unsupported item:
initial omission, a future-extension note, or a confirmed concise representation
in an existing site surface.

### 4. Fill missing information and confirm facts

Ask only the focused questions needed to resolve material gaps, conflicts, or
privacy decisions discovered in stages 1–3. Do not ask for facts already clear in
the resume. A newly written headline, summary, or impact statement remains
unconfirmed until the adopter explicitly accepts it.

Exit only after presenting the complete factual-profile checkpoint and receiving
explicit confirmation. An unresolved optional claim may be explicitly omitted
from the current setup and recorded as unconfirmed in the final brief. An
unresolved claim required for a safe, valid implementation of the approved setup
remains a blocker.

### 5. Visual direction

Load [Theme presets](theme-presets.md) and its active question-bank route. Record
the adopter's selected preset and refinements. Theme options and implementation
constraints are owned by that specialist reference.

### 6. Site content, assets, navigation, and assistant

Load the matching question-bank section. Decide public contact methods, location
presentation, resume download, visible current sections, supplied or placeholder
assets, assistant tone, grounded starter prompts, and contact call to action.

Recommend hiding empty navigation sections. Never invent projects or writing to
populate them. Generate starter-prompt wording only from confirmed content and
the primary site goal, then ask for approval.

Exit when every public-content and assistant decision is confirmed or explicitly
unresolved.

### 7. Runtime and deployment

Load [Runtime and deployment](runtime-and-deployment.md) and its active
question-bank route. Record only the decisions required for the adopter's intended
setup. Never request credential values, and do not treat intended production
topology as authorization to deploy.

### 8. Final setup brief and approval

Build the brief from the interview ledger using these sections:

1. Stated profession; primary site goal; target roles, specialties, or services;
   primary audience; and tone.
2. Confirmed resume facts.
3. Adopter choices for presentation, public content, assets, assistant, runtime,
   and deployment.
4. Agent recommendations awaiting approval, each labeled with its rationale.
5. Missing or unconfirmed information, including optional claims explicitly
   omitted from the current setup, and any implementation blockers.
6. Content omitted from initial setup and the adopter-approved rationale.
7. Optional future site extensions.
8. Runtime/deployment decisions, credential availability, and production actions
   not authorized.

Present the complete brief, then ask the exact approval question from
[Question bank](question-bank.md). Corrections return to the relevant stage and
require a revised full brief. Repository edits remain prohibited until the
adopter explicitly approves the current brief.

## Resume or answer updates

If the adopter replaces the resume or corrects a material fact, invalidate
downstream compatibility, factual-profile, assistant-grounding, and final-brief
confirmations affected by that change. Resume at the earliest affected stage
rather than restarting unaffected decisions.

## Interview ledger fields

Track the current and completed stages, source resume and corrections, provisional
and confirmed facts, adopter choices, recommendations, pending decisions,
privacy concerns, omissions and rationale, future-extension notes, unresolved
claims, runtime/deployment decisions, and final-brief approval status. A stage is
complete only when its exit conditions are met.
