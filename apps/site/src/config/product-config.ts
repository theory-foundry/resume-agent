import { exampleProfile } from "@resume-agent/profile";
import type { WidgetTheme } from "@resume-agent/contracts";

export interface SiteConfig {
  metadataTitle: string;
  metadataDescription: string;
  profileImage: string;
  resumeFileName: string;
  navigation: Array<{ href: string; label: string }>;
  contactHeading: string;
  contactDescription: string;
  theme: {
    accentBorderClass: string;
    accentButtonClass: string;
  };
}

export interface AssistantConfig {
  title: string;
  placeholder: string;
  suggestions: string[];
  gatewayUrl: string;
  theme: WidgetTheme;
}

function requireText(path: string, value: unknown): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${path} must be a non-empty string.`);
  }
}

export function assertValidSiteConfig(value: SiteConfig): void {
  requireText("site.metadataTitle", value.metadataTitle);
  requireText("site.metadataDescription", value.metadataDescription);
  requireText("site.profileImage", value.profileImage);
  requireText("site.resumeFileName", value.resumeFileName);
  requireText("site.contactHeading", value.contactHeading);
  requireText("site.contactDescription", value.contactDescription);
  requireText("site.theme.accentBorderClass", value.theme.accentBorderClass);
  requireText("site.theme.accentButtonClass", value.theme.accentButtonClass);
  if (!Array.isArray(value.navigation) || value.navigation.length === 0) {
    throw new Error("site.navigation must contain at least one link.");
  }
  value.navigation.forEach((link, index) => {
    requireText(`site.navigation.${index}.href`, link.href);
    requireText(`site.navigation.${index}.label`, link.label);
    if (!link.href.startsWith("/")) {
      throw new Error(`site.navigation.${index}.href must be an application-relative path.`);
    }
  });
}

export function assertValidAssistantConfig(value: AssistantConfig): void {
  requireText("assistant.title", value.title);
  requireText("assistant.placeholder", value.placeholder);
  requireText("assistant.gatewayUrl", value.gatewayUrl);
  if (!Array.isArray(value.suggestions) || value.suggestions.length === 0) {
    throw new Error("assistant.suggestions must contain at least one prompt.");
  }
  value.suggestions.forEach((suggestion, index) =>
    requireText(`assistant.suggestions.${index}`, suggestion),
  );
}

export const siteConfig: SiteConfig = {
  metadataTitle: exampleProfile.name,
  metadataDescription: `${exampleProfile.name} | ${exampleProfile.headline}`,
  profileImage: "/images/profile-placeholder.svg",
  resumeFileName: "resume.pdf",
  navigation: [
    { href: "/resume", label: "Resume" },
    { href: "/projects", label: "Projects" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ],
  contactHeading: "Want to connect?",
  contactDescription: "Reach out to discuss roles, projects, or collaboration.",
  theme: {
    accentBorderClass: "border-violet-600",
    accentButtonClass: "bg-violet-600 hover:bg-violet-700",
  },
};

export const assistantConfig: AssistantConfig = {
  title: `Ask about ${exampleProfile.name}`,
  placeholder: "Ask about experience, skills, or projects",
  suggestions: [
    "Summarize this candidate's experience.",
    "Which project best demonstrates product impact?",
    "How can I contact this candidate?",
  ],
  gatewayUrl: "/",
  theme: {
    accent: "#6d28d9",
    radius: "16px",
  },
};

assertValidSiteConfig(siteConfig);
assertValidAssistantConfig(assistantConfig);
