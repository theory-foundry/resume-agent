import type { ChatStatus, DynamicToolUIPart, ReasoningUIPart, TextUIPart, UIMessage } from "ai";

export type ChatHarnessScenarioId = "recruiter-brief" | "tool-error" | "approval" | "markdown-stream";

export type ChatHarnessFrame = {
  delayMs: number;
  parts: UIMessage["parts"];
  status: ChatStatus;
};

export type ChatHarnessScenario = {
  description: string;
  frames: ChatHarnessFrame[];
  id: ChatHarnessScenarioId;
  label: string;
  prompt: string;
};

const textPart = (text: string, state: TextUIPart["state"] = "done"): TextUIPart => ({
  state,
  text,
  type: "text",
});

const reasoningPart = (text: string, state: ReasoningUIPart["state"] = "done"): ReasoningUIPart => ({
  state,
  text,
  type: "reasoning",
});

const dynamicToolPart = ({
  errorText,
  input,
  output,
  state,
  toolCallId,
  toolName,
}: {
  errorText?: string;
  input: unknown;
  output?: unknown;
  state: DynamicToolUIPart["state"];
  toolCallId: string;
  toolName: string;
}): DynamicToolUIPart => {
  const base = { input, toolCallId, toolName, type: "dynamic-tool" as const };

  switch (state) {
    case "input-streaming":
    case "input-available":
      return { ...base, state };
    case "approval-requested":
      return {
        ...base,
        approval: { id: `${toolCallId}-approval` },
        state,
      };
    case "approval-responded":
      return {
        ...base,
        approval: { approved: false, id: `${toolCallId}-approval`, reason: "Harness mode blocks external systems." },
        state,
      };
    case "output-available":
      return { ...base, output, state };
    case "output-denied":
      return {
        ...base,
        approval: { approved: false, id: `${toolCallId}-approval`, reason: "Harness mode blocks external systems." },
        state,
      };
    case "output-error":
      return { ...base, errorText: errorText ?? "The harness forced an error for UI testing.", state };
  }
};

const recruiterReasoning =
  "Checking the resume and project data first so the answer lands on seniority, shipped work, and recent AI-specific experience.";

const recruiterToolInput = { sections: ["summary", "experience", "projects"], tone: "recruiter-friendly" };

const recruiterToolOutput = {
  focus: ["10+ years of full stack delivery", "recent AI assistant work", "architecture and mentorship"],
  strongestSignals: [
    "Built production web apps across React, Next.js, Node.js, and cloud tooling.",
    "Led architecture and mentored engineering teams.",
    "Spent the last year driving AI integration work for DIGIDECK.",
  ],
};

const projectToolInput = { projectArea: "recent work", request: "strongest differentiator" };

const markdownText = `Here is a markdown-heavy response for spacing and typography work:

1. Highlights
- Strong React and Next.js depth
- Product-minded AI integration work
- Experience across frontend, backend, and cloud delivery

2. Sample code
\`\`\`ts
const stack = ["React", "Next.js", "TypeScript", "LangGraph", "AWS"];
const strongestAngle = stack.join(" / ");
\`\`\`

3. Final note
This transcript is fully scripted so you can iterate on layout without spending AI tokens.`;

export const CHAT_HARNESS_SCENARIOS: ChatHarnessScenario[] = [
  {
    description: "Streams reasoning, a successful tool call, and a recruiter-ready answer.",
    frames: [
      {
        delayMs: 400,
        parts: [
          reasoningPart("Reviewing Lukas's background and recent AI work...", "streaming"),
          textPart("Pulling together the strongest recruiter-facing highlights...", "streaming"),
        ],
        status: "streaming",
      },
      {
        delayMs: 900,
        parts: [
          reasoningPart(recruiterReasoning),
          dynamicToolPart({
            input: recruiterToolInput,
            state: "input-available",
            toolCallId: "resume-lookup",
            toolName: "get_resume",
          }),
          textPart("I checked the resume first so the summary stays concrete and evidence-based.", "streaming"),
        ],
        status: "streaming",
      },
      {
        delayMs: 850,
        parts: [
          reasoningPart(recruiterReasoning),
          dynamicToolPart({
            input: recruiterToolInput,
            output: recruiterToolOutput,
            state: "output-available",
            toolCallId: "resume-lookup",
            toolName: "get_resume",
          }),
          textPart(
            "Lukas is a senior full stack engineer with 10+ years of experience shipping production web applications, leading architecture, and mentoring teams. His recent standout work is AI-focused: he has spent the last year building AI capabilities for DIGIDECK while still bringing strong depth in React, Next.js, TypeScript, Node.js, and cloud delivery.",
            "streaming",
          ),
        ],
        status: "streaming",
      },
      {
        delayMs: 700,
        parts: [
          reasoningPart(recruiterReasoning),
          dynamicToolPart({
            input: recruiterToolInput,
            output: recruiterToolOutput,
            state: "output-available",
            toolCallId: "resume-lookup",
            toolName: "get_resume",
          }),
          textPart(
            "Lukas is a senior full stack engineer with 10+ years of experience shipping production web applications, leading architecture, and mentoring teams. His recent standout work is AI-focused: he has spent the last year building AI capabilities for DIGIDECK while still bringing strong depth in React, Next.js, TypeScript, Node.js, and cloud delivery.\n\nFor a hiring manager, the signal is that he combines hands-on implementation with product thinking, technical leadership, and modern AI integration experience.",
          ),
        ],
        status: "ready",
      },
    ],
    id: "recruiter-brief",
    label: "Recruiter brief",
    prompt: "Give me a recruiter-ready summary of Lukas and mention the recent AI work.",
  },
  {
    description: "Shows a failed tool invocation and the assistant's fallback copy.",
    frames: [
      {
        delayMs: 350,
        parts: [
          reasoningPart("Looking for the strongest recent project signal and how to frame it clearly...", "streaming"),
          textPart("Checking project data before I answer...", "streaming"),
        ],
        status: "streaming",
      },
      {
        delayMs: 800,
        parts: [
          reasoningPart("Looking for the strongest recent project signal and how to frame it clearly..."),
          dynamicToolPart({
            input: projectToolInput,
            state: "input-available",
            toolCallId: "projects-lookup",
            toolName: "get_blog_and_projects",
          }),
          textPart("The project lookup is running now.", "streaming"),
        ],
        status: "streaming",
      },
      {
        delayMs: 850,
        parts: [
          reasoningPart("Looking for the strongest recent project signal and how to frame it clearly..."),
          dynamicToolPart({
            errorText: "Portfolio service timed out after 8 seconds in harness mode.",
            input: projectToolInput,
            state: "output-error",
            toolCallId: "projects-lookup",
            toolName: "get_blog_and_projects",
          }),
          textPart(
            "The project lookup failed, so I would fall back to the strongest known signal: Lukas's DIGIDECK AI Assistant work. It shows applied AI delivery, systems thinking, and real product impact rather than a toy demo.",
          ),
        ],
        status: "ready",
      },
    ],
    id: "tool-error",
    label: "Tool error",
    prompt: "What is the strongest recent project and why does it matter?",
  },
  {
    description: "Exercises approval-related tool states without calling any external system.",
    frames: [
      {
        delayMs: 350,
        parts: [
          reasoningPart("Showing what a blocked tool flow looks like in the transcript UI...", "streaming"),
          textPart("Preparing an approval-state example.", "streaming"),
        ],
        status: "streaming",
      },
      {
        delayMs: 800,
        parts: [
          reasoningPart("Showing what a blocked tool flow looks like in the transcript UI..."),
          dynamicToolPart({
            input: { destination: "crm", reason: "Need access to private recruiter notes" },
            state: "approval-requested",
            toolCallId: "crm-access",
            toolName: "open_recruiter_crm",
          }),
          textPart("The assistant is waiting for approval before it can continue.", "streaming"),
        ],
        status: "streaming",
      },
      {
        delayMs: 800,
        parts: [
          reasoningPart("Showing what a blocked tool flow looks like in the transcript UI..."),
          dynamicToolPart({
            input: { destination: "crm", reason: "Need access to private recruiter notes" },
            state: "approval-responded",
            toolCallId: "crm-access",
            toolName: "open_recruiter_crm",
          }),
          textPart(
            "Approval was denied, so the assistant stays on the safe path and explains what happened.",
            "streaming",
          ),
        ],
        status: "streaming",
      },
      {
        delayMs: 700,
        parts: [
          reasoningPart("Showing what a blocked tool flow looks like in the transcript UI..."),
          dynamicToolPart({
            input: { destination: "crm", reason: "Need access to private recruiter notes" },
            state: "output-denied",
            toolCallId: "crm-access",
            toolName: "open_recruiter_crm",
          }),
          textPart(
            "That action was blocked because the requested system needs explicit approval. In a real flow, the assistant would ask the user to approve access or choose a safer alternative.",
          ),
        ],
        status: "ready",
      },
    ],
    id: "approval",
    label: "Approval flow",
    prompt: "Show me how an approval or blocked tool call looks in the transcript.",
  },
  {
    description: "Streams a markdown-heavy answer for typography and spacing tweaks.",
    frames: [
      {
        delayMs: 300,
        parts: [
          textPart("Here is a markdown-heavy response for spacing and typography work:\n\n1. Highlights", "streaming"),
        ],
        status: "streaming",
      },
      {
        delayMs: 600,
        parts: [
          textPart(
            "Here is a markdown-heavy response for spacing and typography work:\n\n1. Highlights\n- Strong React and Next.js depth\n- Product-minded AI integration work",
            "streaming",
          ),
        ],
        status: "streaming",
      },
      {
        delayMs: 700,
        parts: [textPart(markdownText)],
        status: "ready",
      },
    ],
    id: "markdown-stream",
    label: "Markdown stream",
    prompt: "Stream a markdown-heavy answer with bullets and code.",
  },
];

export const DEFAULT_CHAT_HARNESS_SCENARIO_ID = CHAT_HARNESS_SCENARIOS[0].id;

export const CHAT_HARNESS_SUGGESTIONS = CHAT_HARNESS_SCENARIOS.map((scenario) => scenario.prompt);

export const getChatHarnessScenario = (scenarioId: ChatHarnessScenarioId) =>
  CHAT_HARNESS_SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? CHAT_HARNESS_SCENARIOS[0];
