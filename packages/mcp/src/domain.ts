import {
  assertValidProfile,
  profileAsPlainText,
  type Article,
  type Experience,
  type Profile,
  type Project,
} from "@resume-agent/profile";

export interface ProfileSearchMatch {
  type: "profile" | "experience" | "skill" | "project" | "article";
  id: string;
  title: string;
  text: string;
}

export interface ResumeDomain {
  readonly profile: Profile;
  profileText(): string;
  search(query: string, limit?: number): ProfileSearchMatch[];
  getExperience(company?: string): Experience[];
  getProject(id: string): Project | undefined;
  getArticle(id: string): Article | undefined;
  getContact(): Profile["contact"];
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function includesQuery(values: readonly string[], query: string): boolean {
  return values.some((value) => normalized(value).includes(query));
}

export function createResumeDomain(value: unknown): ResumeDomain {
  assertValidProfile(value);
  const profile = value;

  return {
    profile,
    profileText: () => profileAsPlainText(profile),
    search(query, limit = 10) {
      const needle = normalized(query);
      if (!needle) return [];

      const matches: ProfileSearchMatch[] = [];
      const add = (match: ProfileSearchMatch, fields: readonly string[]) => {
        if (matches.length < limit && includesQuery(fields, needle)) matches.push(match);
      };

      add(
        {
          type: "profile",
          id: "profile",
          title: profile.name,
          text: `${profile.headline}\n${profile.summary}`,
        },
        [profile.name, profile.headline, profile.summary, profile.location ?? ""],
      );

      profile.experience.forEach((experience, index) =>
        add(
          {
            type: "experience",
            id: String(index),
            title: `${experience.title} at ${experience.company}`,
            text: `${experience.period}\n${experience.highlights.join("\n")}`,
          },
          [experience.company, experience.title, experience.period, ...experience.highlights],
        ),
      );

      profile.skills.forEach((skill) =>
        add({ type: "skill", id: skill, title: skill, text: skill }, [skill]),
      );

      profile.projects.forEach((project) =>
        add(
          {
            type: "project",
            id: project.id,
            title: project.title,
            text: project.description ?? project.shortDescription,
          },
          [
            project.id,
            project.title,
            project.shortDescription,
            project.description ?? "",
            ...project.skills,
          ],
        ),
      );

      profile.articles.forEach((article) =>
        add(
          {
            type: "article",
            id: article.id,
            title: article.title,
            text: article.description,
          },
          [article.id, article.title, article.description, article.body],
        ),
      );

      return matches;
    },
    getExperience(company) {
      if (!company?.trim()) return profile.experience;
      const needle = normalized(company);
      return profile.experience.filter((experience) =>
        includesQuery([experience.company, experience.title], needle),
      );
    },
    getProject(id) {
      const needle = normalized(id);
      return profile.projects.find((project) => normalized(project.id) === needle);
    },
    getArticle(id) {
      const needle = normalized(id);
      return profile.articles.find((article) => normalized(article.id) === needle);
    },
    getContact: () => profile.contact,
  };
}
