import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Articles from "@/example-data/Articles";

export const getBlogPostByIdTool = tool(
  async ({ id }) => {
    const article = Articles.find((item) => item.id === id);

    if (!article) {
      const validIds = Articles.map((item) => item.id).join(", ");
      throw new Error(`Blog post not found for id "${id}". Valid ids: ${validIds}`);
    }

    return JSON.stringify(
      {
        ...article,
        articleText: decodeURIComponent(article.articleText),
      },
      null,
      2,
    );
  },
  {
    name: "get_blog_post_by_id",
    description:
      "Returns a single full blog post by id, including the complete article text and metadata. " +
      "Use when the user asks for details, a summary, or the full content of one specific blog post after identifying its id.",
    schema: z.object({
      id: z.string().describe("The blog post id, such as 'sync-dotfiles-article'."),
    }),
  },
);
