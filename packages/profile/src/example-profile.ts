import type { Profile } from "./types.js";

export const exampleProfile: Profile = {
  name: "Alex Morgan",
  headline: "Product-minded software engineer",
  summary:
    "Software engineer focused on building reliable web products, useful developer tools, and thoughtful user experiences.",
  location: "Remote",
  contact: {
    email: "alex@example.com",
    website: "https://example.com",
    github: "https://github.com/example",
    linkedin: "https://www.linkedin.com/in/example",
  },
  experience: [
    {
      company: "Example Studio",
      title: "Senior Software Engineer",
      period: "2022 — Present",
      highlights: [
        "Led delivery of customer-facing workflows used by distributed teams.",
        "Improved reliability through contract tests, observability, and incremental migrations.",
      ],
    },
    {
      company: "Sample Labs",
      title: "Software Engineer",
      period: "2019 — 2022",
      highlights: [
        "Built accessible web interfaces and maintainable service APIs.",
        "Partnered with product and design to turn ambiguous needs into measurable outcomes.",
      ],
    },
  ],
  skills: ["TypeScript", "React", "Node.js", "Product engineering", "Accessibility", "Testing"],
  projects: [
    {
      id: "team-workspace",
      title: "Team Workspace",
      shortDescription: "A collaborative workspace that helps teams organize and ship projects.",
      description:
        "Designed the application architecture, implemented the core collaboration flows, and established automated quality gates.",
      skills: ["TypeScript", "React", "Node.js"],
      links: [{ label: "Case study", url: "https://example.com/projects/team-workspace" }],
    },
  ],
  articles: [
    {
      id: "building-reliable-products",
      title: "Building reliable products through small feedback loops",
      description: "Practical lessons for reducing delivery risk.",
      body: "Reliable delivery comes from making changes observable, reversible, and easy to validate.",
      publishedAt: "2025-01-15",
    },
  ],
};
