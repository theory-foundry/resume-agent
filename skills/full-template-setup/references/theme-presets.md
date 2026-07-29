# Theme presets

Load this reference when the adopter reaches visual direction. The agent may
recommend a preset based on confirmed profession, audience, and site goal, but the
adopter chooses the final direction.

## Recommendation boundary

A recommendation may use only the adopter's confirmed profession, primary
audience, site goal, tone, and content needs. Label it as a recommendation and
explain why it supports those choices. Do not stereotype a profession, treat the
recommendation as a personal fact, or select a preset for the adopter.

Always ask: “Which visual direction best fits how you want to present yourself?”

## Curated presets

- **Minimal** — restrained, spacious, neutral, and content-first. It favors a
  simple hierarchy, clean sans-serif typography, limited accents, low visual
  noise, and little or no motion. It works well when fast scanning and broad
  professional flexibility matter most.
- **Editorial** — typography-led, narrative, and suited to writing or thought
  leadership. It favors expressive headings, serif-led or mixed typography,
  generous reading space, selective imagery, and subtle transitions that support
  long-form content.
- **Corporate** — polished, structured, credible, and conventional. It favors
  predictable hierarchy, restrained professional color, balanced density,
  consistent component treatment, and minimal motion for audiences expecting
  clarity and trust.
- **Creative** — expressive color, imagery, and personality while remaining
  professional. It favors a distinctive accent direction, bolder composition,
  more prominent approved imagery, and optional expressive motion that remains
  accessible.
- **Technical** — precise, systems-oriented, and suitable for engineering or
  technical work. It favors structured information, compact or balanced density,
  cool or monochrome color, clean sans-serif type with optional monospace
  accents, and restrained motion.

Present all five options with these descriptions even when recommending one.
Record both the recommendation and the adopter's selection.

## Refinement questions

Ask these one at a time after preset selection.

### Color

“Which color direction should refine the selected preset?”

- **Neutral with one accent** — keep most surfaces restrained and use one color
  for emphasis.
- **Cool** — favor blues, cyans, violets, or related cool hues.
- **Warm** — favor reds, oranges, ambers, or related warm hues.
- **Monochrome** — rely primarily on neutral contrast and hierarchy.
- **Existing personal/brand color** — ask for the public color reference or
  value, not access to a private brand system.
- **Other** — accept a freeform direction.

### Mode

“Which light and dark mode behavior do you prefer?”

- **Light** — make light mode the intended presentation.
- **Dark** — make dark mode the intended presentation.
- **Follow system** — use the visitor's operating-system preference when
  supported.
- **Allow visitor switching** — expose a light/dark choice and remember it when
  supported.
- **Other** — accept a freeform mode requirement.

### Typography

“Which typography direction should the site use?”

- **Clean sans-serif** — prioritize familiar, highly legible text.
- **Serif-led editorial** — use serif typography as the primary expressive voice.
- **Mixed serif and sans-serif** — distinguish display and body roles.
- **Technical/monospace accents** — use monospace selectively, not for all
  body copy.
- **Use a supplied brand font** — require a legally usable font asset or public
  font source.
- **Other** — accept a freeform direction.

### Information density

“How dense should the site feel?”

- **Compact** — show more information per screen with tighter spacing.
- **Balanced** — preserve scanning comfort while limiting excess space.
- **Airy** — use more space and a slower visual rhythm.
- **Other** — accept a freeform density direction.

### Imagery

“What profile imagery should guide the design?”

- **Professional headshot** — foreground a formal adopter-supplied portrait.
- **Candid/work-context portrait** — use an adopter-supplied contextual image.
- **Illustration or avatar** — use adopter-supplied or explicitly approved art.
- **No profile portrait** — rely on typography and content instead.
- **Other** — accept a freeform, adopter-approved image direction.

Do not generate, select, or publish a likeness without explicit approval.

### Motion

“How much motion should the site use?”

- **None** — avoid nonessential animation.
- **Subtle** — use restrained transitions that do not distract.
- **Expressive but accessible** — allow more visible motion while preserving
  reduced-motion behavior and usability.
- **Other** — accept a freeform direction subject to accessibility invariants.

## Accessibility invariants

Every preset and refinement must preserve readable contrast, legible type,
responsive layouts, keyboard usability, visible focus, meaningful alternative
text, and reduced-motion support. Do not offer accessibility as an optional
tradeoff or accept a refinement that removes these protections.

## Current capability and scope

Before promising implementation, inspect the current theme surfaces. The current
reference site supports light/dark switching and configured accent classes; the
widget supports accent, background, foreground, muted color, and radius tokens.
Typography systems, layout density, broader imagery treatment, system-following
mode, and expressive motion may require changes beyond those existing controls.

For every requested outcome:

1. Mark it **supported now** when the current configuration can express it.
2. Mark it **requires approved site work** when it needs a bounded implementation
   change within the current setup.
3. Mark it **possible future site extension** when it would materially expand the
   template.

Explain the consequence and obtain approval in the final setup brief. Never
silently broaden scope or imply that selecting a preset automatically authorizes
all possible design work.
