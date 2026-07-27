import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Articles from "@/example-data/Articles";
import Projects from "@/example-data/Projects";

export const getBlogAndProjectsTool = tool(
  async () => {
    const projects = Projects.map(({ imageSrc: _imageSrc, detailImages: _detailImages, ...rest }) => rest);

    const articles = Articles.map(({ id, title, articleDescription, createdDate }) => ({
      id,
      title,
      description: articleDescription,
      createdDate,
    }));

    return JSON.stringify({ projects, articles }, null, 2);
  },
  {
    name: "get_blog_and_projects",
    description:
      "Returns Lukas A Sorensen's portfolio projects and blog articles. " +
      "Use whenever the user asks about his shipped work, portfolio, technical writing, side projects, or areas of technical interest.",
    schema: z.object({}),
  },
);
