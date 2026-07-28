import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Profile } from "@resume-agent/profile";
import * as z from "zod/v4";

import { createResumeDomain } from "./domain.js";

const searchMatchSchema = z.object({
  type: z.enum(["profile", "experience", "skill", "project", "article"]),
  id: z.string(),
  title: z.string(),
  text: z.string(),
});

const experienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  period: z.string(),
  highlights: z.array(z.string()),
});

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  shortDescription: z.string(),
  description: z.string().optional(),
  skills: z.array(z.string()),
  links: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
});

const contactSchema = z.object({
  email: z.string().optional(),
  website: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
});

function toolResult(value: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function missingResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function createResumeMcpServer(profile: Profile): McpServer {
  const domain = createResumeDomain(profile);
  const server = new McpServer(
    { name: "resume-agent", version: "0.1.0" },
    {
      instructions:
        "Use these read-only capabilities to answer questions about the resume profile. Do not invent facts that are absent from the returned content.",
    },
  );

  server.registerTool(
    "search_profile",
    {
      title: "Search resume profile",
      description:
        "Search the candidate's summary, experience, skills, projects, and articles for relevant text.",
      inputSchema: {
        query: z.string().trim().min(1).max(200).describe("Case-insensitive search text"),
        limit: z.number().int().min(1).max(20).default(10),
      },
      outputSchema: {
        matches: z.array(searchMatchSchema),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query, limit }) => toolResult({ matches: domain.search(query, limit) }),
  );

  server.registerTool(
    "get_experience",
    {
      title: "Get work experience",
      description:
        "Return all work experience, or filter it by a case-insensitive company or job-title query.",
      inputSchema: {
        company: z.string().trim().min(1).max(200).optional(),
      },
      outputSchema: {
        experience: z.array(experienceSchema),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ company }) => toolResult({ experience: domain.getExperience(company) }),
  );

  server.registerTool(
    "get_project",
    {
      title: "Get project",
      description: "Return one project by its stable profile project ID.",
      inputSchema: {
        id: z.string().trim().min(1).max(200),
      },
      outputSchema: {
        project: projectSchema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const project = domain.getProject(id);
      return project ? toolResult({ project }) : missingResult(`Project not found: ${id}`);
    },
  );

  server.registerTool(
    "get_contact",
    {
      title: "Get contact information",
      description: "Return the public contact methods configured in the resume profile.",
      outputSchema: {
        contact: contactSchema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => toolResult({ contact: domain.getContact() }),
  );

  server.registerResource(
    "profile",
    "resume://profile",
    {
      title: "Complete resume profile",
      description: "The complete validated resume profile as JSON.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(domain.profile, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "project",
    new ResourceTemplate("resume://projects/{id}", {
      list: async () => ({
        resources: domain.profile.projects.map((project) => ({
          name: project.title,
          uri: `resume://projects/${encodeURIComponent(project.id)}`,
          description: project.shortDescription,
          mimeType: "application/json",
        })),
      }),
      complete: {
        id: (value) =>
          domain.profile.projects
            .map((project) => project.id)
            .filter((id) => id.startsWith(value)),
      },
    }),
    {
      title: "Resume project",
      description: "A resume project selected by stable project ID.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const id = String(variables.id);
      const project = domain.getProject(id);
      if (!project) throw new Error(`Project not found: ${id}`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    },
  );

  server.registerResource(
    "article",
    new ResourceTemplate("resume://articles/{id}", {
      list: async () => ({
        resources: domain.profile.articles.map((article) => ({
          name: article.title,
          uri: `resume://articles/${encodeURIComponent(article.id)}`,
          description: article.description,
          mimeType: "application/json",
        })),
      }),
      complete: {
        id: (value) =>
          domain.profile.articles
            .map((article) => article.id)
            .filter((id) => id.startsWith(value)),
      },
    }),
    {
      title: "Resume article",
      description: "A resume article selected by stable article ID.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const id = String(variables.id);
      const article = domain.getArticle(id);
      if (!article) throw new Error(`Article not found: ${id}`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(article, null, 2),
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "resume_assistant",
    {
      title: "Resume assistant",
      description:
        "Create a grounded instruction for discussing the candidate with a particular audience and goal.",
      argsSchema: {
        audience: z.string().trim().min(1).max(200).describe("Who will read the answer"),
        goal: z.string().trim().min(1).max(500).describe("What the answer should help accomplish"),
      },
    },
    async ({ audience, goal }) => ({
      description: `Grounded resume assistance for ${audience}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Help ${audience} accomplish this goal: ${goal}.`,
              "Use the resume-agent tools and resources for evidence.",
              "Only state facts supported by the profile, distinguish inference from evidence, and say when information is unavailable.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  return server;
}
