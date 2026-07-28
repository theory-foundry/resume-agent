export interface ProfileLink {
  label: string;
  url: string;
}

export interface Experience {
  company: string;
  title: string;
  period: string;
  highlights: string[];
}

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  description?: string;
  skills: string[];
  links?: ProfileLink[];
}

export interface Article {
  id: string;
  title: string;
  description: string;
  body: string;
  publishedAt?: string;
}

export interface Profile {
  name: string;
  headline: string;
  summary: string;
  location?: string;
  contact: {
    email?: string;
    website?: string;
    github?: string;
    linkedin?: string;
  };
  experience: Experience[];
  skills: string[];
  projects: Project[];
  articles: Article[];
}

export interface ProfileValidationIssue {
  path: string;
  message: string;
}
