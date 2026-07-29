# Question bank

Load only the section for the active interview stage. Ask one question at a time,
using adopter-facing language and a freeform alternative wherever bounded options
are offered. Do not paste multiple numbered questions into one adopter message.

## Stage 1 — Existing resume intake

Ask in order:

1. “Please provide the existing resume you want this site to use. You can attach
   it, paste it, or give me its repository path.”
2. After it is accessible: “Is this resume the current source of truth, or are
   there known corrections I should account for before reviewing it?”

If no resume is accessible, explain that this workflow requires an existing
resume and stop. After the second answer, inspect the resume completely before
asking about any facts it may contain.

## Stage 2 — Profession and positioning

Ask in order:

1. “What profession do you identify with and want this site to present you as?”
   This is freeform and must always be asked; do not offer an inferred answer as
   the default.
2. “What is the primary goal of this site?”
   - **Find a job** — prioritize fit, experience, skills, and clear recruiter
     scanning.
   - **Attract clients or consulting work** — prioritize services, credibility,
     outcomes, and contact conversion.
   - **Showcase a portfolio** — prioritize selected work, process, and project
     evidence.
   - **Support networking, speaking, or writing** — prioritize ideas,
     publications, topics, and ways to connect.
   - **Maintain a general professional presence** — balance the available content
     without optimizing for one transaction.
   - **Other** — let the adopter state a different primary goal.
3. “Which roles, specialties, services, or opportunities should the site
   emphasize?”
   This is freeform. Use resume evidence only to clarify, not to choose for the
   adopter.
4. “Who is the primary audience?”
   - **Recruiters and hiring managers** — emphasize role fit and evidence.
   - **Prospective clients** — emphasize services, outcomes, and trust.
   - **Collaborators or partners** — emphasize complementary strengths and ways to
     work together.
   - **Professional peers or community** — emphasize expertise, interests, and
     participation.
   - **Speaking, media, or event organizers** — emphasize topics, authority, and
     public-facing material.
   - **Mixed audience** — balance multiple audiences while still naming which one
     should receive first priority.
   - **Other** — let the adopter describe another audience.
5. “What tone should the site use?”
   - **Concise and direct** — use short, scan-friendly presentation.
   - **Polished and executive** — use formal, composed positioning.
   - **Warm and conversational** — use approachable, human language.
   - **Bold and creative** — use expressive presentation without changing factual
     claims.
   - **Technical and detailed** — retain more implementation and domain detail.
   - **Other** — let the adopter specify a different tone.

When the adopter names secondary goals or audiences, ask: “Which one should be
primary when the site has to choose what to emphasize first?”

When profession, desired emphasis, and resume evidence conflict, summarize the
mismatch without judging it, then ask: “Which positioning should guide the site?”

## Stage 3 — Resume compatibility with the site

After presenting the four-part compatibility summary required by
[Resume compatibility](resume-compatibility.md), ask:

1. “I found the following content that fits the current site. Is this summary
   factually correct?”
2. For each material missing item, ask: “The site needs [item], but I could not
   confirm it from the resume. What should I use?”
3. For each conflict, ask: “The resume appears to say both [version A] and
   [version B] about [fact]. Which version is correct?”
4. For each privacy-sensitive item, ask: “Should [item] be public on the site,
   shown in a less specific form, or omitted?”
   - **Public as written** — retain the confirmed detail.
   - **Less specific** — ask the adopter for the exact public wording.
   - **Omit from the public site** — retain no public presentation of the item.
5. For each unsupported group of related content, ask: “The current site does not
   include a dedicated place for the following resume content: [items]. For the
   initial setup, would you like me to recommend omitting it, or record it as a
   possible future site extension?”
   - **Recommend omitting it initially** — keep the default site unchanged and
     record the rationale for approval.
   - **Record a possible future site extension** — preserve its importance as a
     later option without expanding the current setup.
   - **Propose a concise fit in an existing section** — offer this only when it
     preserves meaning; show the proposed representation and request confirmation.

Do not ask the adopter to combine unrelated sections merely to fit the current
site. Handle materially different unsupported content separately when the
decision or rationale may differ.

## Stage 4 — Missing information and factual confirmation

Ask only questions triggered by material gaps or ambiguity after resume
inspection. Use these exact templates when applicable:

- “What name should the public site display?”
- “What professional headline should appear beneath your name?”
- “The resume does not include a short site introduction. Would you like to
  provide one, or should I draft a recommendation for your approval?”
- “How specific should your public location be?”
  - **No location** — publish none.
  - **Country or broad region** — give general context.
  - **State, province, or similar region** — give regional context.
  - **City and region** — give local context.
  - **Custom wording** — use adopter-supplied public text.
- “Which of these resume contact details, if any, may be public: [confirmed
  details]?”
- “The resume is unclear about [fact]. What is the correct wording?”
- “Which confirmed experience highlights should the site emphasize for [primary
  goal or audience]?”
- “Which confirmed skills should receive the most emphasis?”
- “The resume mentions [project] but does not clearly provide [material detail or
  link]. What should the site use?”
- “Do you want the site to include [confirmed writing or article], and is this the
  correct public link or content?”

If drafting a headline, summary, or other wording, label it as a recommendation,
show it to the adopter, and ask: “Should I use this wording, revise it, or leave
this item unresolved?”

If an optional claim remains unresolved, it may be omitted from the current setup
only with the adopter's explicit agreement and must remain listed as unconfirmed
in the final brief. If the claim is required for a safe, valid implementation of
the approved setup, it remains a blocker and cannot be waived through final-brief
approval.

After all material follow-ups, present the complete factual profile and ask:
“Here is the factual profile I will use for the site. Which details, if any, need
correction before I proceed?”

If the adopter requests no correction, ask for explicit confirmation if their
answer is not already unambiguous. Do not treat silence as confirmation.

## Stage 5 — Visual direction

Load [Theme presets](theme-presets.md) and use its questions and bounded options
for this stage. Do not load the runtime/deployment reference here.

## Stage 6 — Site content, assets, navigation, and assistant

Ask in order, skipping only decisions already explicitly supplied and confirmed:

1. “Which public contact methods should appear on the site?”
   - **Email**
   - **Personal or professional website**
   - **GitHub**
   - **LinkedIn**
   - **Other adopter-supplied method**
   - **No public contact method**

   Present only confirmed methods as selectable. Explain that every selected
   method will be visible to site visitors.
2. “Do you want visitors to be able to download a resume PDF?”
   - **Yes** — publish only the adopter-approved resume file.
   - **No** — omit the download action.
3. “Which current sections should be visible?”
   - **Resume**
   - **Projects**
   - **Writing/blog**
   - **Contact**

   Allow multiple selections. Recommend hiding any section with no confirmed
   content; do not invent content to keep it visible.
4. “Please provide the profile image, project images, article images, favicon, or
   other assets you want to use. Should I retain accessible placeholders for
   anything not yet available?”
   - **Use supplied assets and retain accessible placeholders for missing items**
   - **Use supplied assets and hide optional missing imagery**
   - **Keep the current accessible placeholders**
   - **Other adopter-supplied direction**
5. “How should the AI assistant sound?”
   - **Match the selected site tone**
   - **More concise and factual**
   - **More conversational**
   - **More technical**
   - **Custom direction**
6. “Which visitor questions should the assistant suggest first?”
   - **Experience summary**
   - **Skills and specialization**
   - **Selected projects**
   - **Professional impact**
   - **Availability/contact**
   - **Custom suggestions**

   Allow multiple selections. Draft exact starter prompts from confirmed profile
   content and the primary site goal, present them, then ask: “Do you approve
   these starter prompts?”
7. “What should the main contact call to action invite visitors to do?”

If contact details are public but location visibility remains unresolved, return
to the location question in stage 4 before completing this stage.

## Stage 7 — Runtime and deployment

Load [Runtime and deployment](runtime-and-deployment.md) and use its questions and
security rules. Never request secret values. Detailed topology and exposure
choices belong to that specialist reference.

## Stage 8 — Final setup brief approval

Present the complete setup brief with every section required by
[Interview flow](interview-flow.md), then ask:

“Does this setup brief accurately reflect what you want me to implement?”

- An explicit yes approves the current brief for repository editing.
- A correction, question, partial approval, or unresolved blocker does not.
- Before accepting approval, confirm that every unresolved optional claim is
  explicitly omitted and recorded, and that no unresolved claim required for a
  safe, valid implementation remains.
- Apply corrections at the relevant stage, regenerate the complete brief, and ask
  the approval question again.
- Approval of the brief does not authorize production deployment or use of real
  credentials; those remain separate explicit boundaries.
