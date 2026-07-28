import { exampleProfile } from "@resume-agent/profile";

export interface ICarouselImage {
  alt?: string;
  src: string;
}

export interface IProject {
  id: string;
  title: string;
  description?: string;
  shortDescription: string;
  imageSrc: string;
  detailImages?: ICarouselImage[];
  skillsUsed?: string[];
  linkUrl?: string;
  company?: string;
  createdDate?: Date;
}

const Projects: IProject[] = exampleProfile.projects.map((project) => ({
  id: project.id,
  title: project.title,
  shortDescription: project.shortDescription,
  description: project.description,
  imageSrc: "/images/project-placeholder.svg",
  detailImages: [{ src: "/images/project-placeholder.svg", alt: `${project.title} placeholder` }],
  skillsUsed: project.skills,
  linkUrl: project.links?.[0]?.url,
  company: "Independent project",
}));

export default Projects;
