import { assertValidProfile, exampleProfile } from "@resume-agent/profile";

assertValidProfile(exampleProfile);

export const RESUME = {
  name: exampleProfile.name,
  title: exampleProfile.headline,
  summary: exampleProfile.summary,
  contact: exampleProfile.contact,
  experience: exampleProfile.experience,
  skills: exampleProfile.skills,
  projects: exampleProfile.projects.map((project) => ({
    title: project.title,
    description: project.description ?? project.shortDescription,
    company: "Independent project",
    skills: project.skills,
    link: project.links?.[0]?.url ?? "",
  })),
};
