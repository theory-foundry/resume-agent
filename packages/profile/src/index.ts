export { exampleProfile } from "./example-profile.js";
export type {
  Article,
  Experience,
  Profile,
  ProfileLink,
  ProfileValidationIssue,
  Project,
} from "./types.js";

import type { Profile, ProfileValidationIssue } from "./types.js";

const safeUrlProtocols = new Set(["http:", "https:", "mailto:"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function checkString(path: string, value: unknown, issues: ProfileValidationIssue[]): void {
  if (!isNonEmptyString(value)) issues.push({ path, message: "Required non-empty string." });
}

function checkOptionalString(path: string, value: unknown, issues: ProfileValidationIssue[]): void {
  if (value !== undefined && !isNonEmptyString(value)) {
    issues.push({ path, message: "Must be a non-empty string when provided." });
  }
}

function checkStringArray(path: string, value: unknown, issues: ProfileValidationIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Must be an array." });
    return;
  }
  value.forEach((item, index) => checkString(`${path}.${index}`, item, issues));
}

function checkUrl(path: string, value: unknown, issues: ProfileValidationIssue[]): void {
  if (value === undefined || value === "") return;
  if (!isNonEmptyString(value)) {
    issues.push({ path, message: "Must be a non-empty URL string." });
    return;
  }
  try {
    const url = new URL(value.includes("://") || value.startsWith("mailto:") ? value : `https://${value}`);
    if (!safeUrlProtocols.has(url.protocol)) {
      issues.push({ path, message: "Only http, https, and mailto URLs are allowed." });
    }
  } catch {
    issues.push({ path, message: "Must be a valid URL." });
  }
}

export function validateProfile(value: unknown): ProfileValidationIssue[] {
  const issues: ProfileValidationIssue[] = [];
  if (!value || typeof value !== "object") return [{ path: "$", message: "Profile must be an object." }];
  const profile = value as Partial<Profile>;

  for (const key of ["name", "headline", "summary"] as const) checkString(key, profile[key], issues);
  checkOptionalString("location", profile.location, issues);
  if (!profile.contact || typeof profile.contact !== "object") {
    issues.push({ path: "contact", message: "Contact must be an object." });
  } else {
    checkUrl("contact.website", profile.contact.website, issues);
    checkUrl("contact.github", profile.contact.github, issues);
    checkUrl("contact.linkedin", profile.contact.linkedin, issues);
    if (profile.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contact.email)) {
      issues.push({ path: "contact.email", message: "Must be a valid email address." });
    }
  }

  if (!Array.isArray(profile.experience)) {
    issues.push({ path: "experience", message: "Must be an array." });
  } else {
    profile.experience.forEach((experience, index) => {
      const path = `experience.${index}`;
      if (!experience || typeof experience !== "object") {
        issues.push({ path, message: "Must be an object." });
        return;
      }
      checkString(`${path}.company`, experience.company, issues);
      checkString(`${path}.title`, experience.title, issues);
      checkString(`${path}.period`, experience.period, issues);
      checkStringArray(`${path}.highlights`, experience.highlights, issues);
    });
  }

  checkStringArray("skills", profile.skills, issues);

  if (!Array.isArray(profile.projects)) {
    issues.push({ path: "projects", message: "Must be an array." });
  } else {
    const ids = new Set<string>();
    profile.projects.forEach((project, index) => {
      const path = `projects.${index}`;
      if (!project || typeof project !== "object") {
        issues.push({ path, message: "Must be an object." });
        return;
      }
      checkString(`${path}.id`, project.id, issues);
      if (isNonEmptyString(project.id)) {
        if (ids.has(project.id)) issues.push({ path: `${path}.id`, message: "Must be unique." });
        ids.add(project.id);
      }
      checkString(`${path}.title`, project.title, issues);
      checkString(`${path}.shortDescription`, project.shortDescription, issues);
      checkOptionalString(`${path}.description`, project.description, issues);
      checkStringArray(`${path}.skills`, project.skills, issues);
      if (project.links !== undefined) {
        if (!Array.isArray(project.links)) {
          issues.push({ path: `${path}.links`, message: "Must be an array." });
        } else {
          project.links.forEach((link, linkIndex) => {
            const linkPath = `${path}.links.${linkIndex}`;
            if (!link || typeof link !== "object") {
              issues.push({ path: linkPath, message: "Must be an object." });
              return;
            }
            checkString(`${linkPath}.label`, link.label, issues);
            checkUrl(`${linkPath}.url`, link.url, issues);
          });
        }
      }
    });
  }

  if (!Array.isArray(profile.articles)) {
    issues.push({ path: "articles", message: "Must be an array." });
  } else {
    const ids = new Set<string>();
    profile.articles.forEach((article, index) => {
      const path = `articles.${index}`;
      if (!article || typeof article !== "object") {
        issues.push({ path, message: "Must be an object." });
        return;
      }
      checkString(`${path}.id`, article.id, issues);
      if (isNonEmptyString(article.id)) {
        if (ids.has(article.id)) issues.push({ path: `${path}.id`, message: "Must be unique." });
        ids.add(article.id);
      }
      checkString(`${path}.title`, article.title, issues);
      checkString(`${path}.description`, article.description, issues);
      checkString(`${path}.body`, article.body, issues);
      if (article.publishedAt !== undefined) {
        if (
          typeof article.publishedAt !== "string"
          || !/^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt)
          || Number.isNaN(Date.parse(`${article.publishedAt}T00:00:00Z`))
        ) {
          issues.push({ path: `${path}.publishedAt`, message: "Must be a valid YYYY-MM-DD date." });
        }
      }
    });
  }

  return issues;
}

export function assertValidProfile(value: unknown): asserts value is Profile {
  const issues = validateProfile(value);
  if (issues.length > 0) {
    throw new Error(`Invalid resume profile:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`);
  }
}

export function profileAsPlainText(profile: Profile): string {
  return [
    `${profile.name} — ${profile.headline}`,
    profile.summary,
    profile.location ? `Location: ${profile.location}` : "",
    ...profile.experience.flatMap((experience) => [
      `${experience.title} at ${experience.company} (${experience.period})`,
      ...experience.highlights.map((highlight) => `- ${highlight}`),
    ]),
    `Skills: ${profile.skills.join(", ")}`,
    ...profile.projects.map((project) => `${project.title}: ${project.shortDescription}`),
  ]
    .filter(Boolean)
    .join("\n");
}
