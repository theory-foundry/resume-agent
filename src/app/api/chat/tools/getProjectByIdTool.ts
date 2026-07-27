import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Projects from "@/example-data/Projects";

export const getProjectByIdTool = tool(
  async ({ id }) => {
    const project = Projects.find((item) => item.id === id);

    if (!project) {
      const validIds = Projects.map((item) => item.id).join(", ");
      throw new Error(`Project not found for id "${id}". Valid ids: ${validIds}`);
    }

    return JSON.stringify(project, null, 2);
  },
  {
    name: "get_project_by_id",
    description:
      "Returns a single full portfolio project by id, including its detailed description and metadata. " +
      "Use when the user asks for deeper detail about one specific project after identifying its id.",
    schema: z.object({
      id: z.string().describe("The project id, such as 'digideck-ai-assistant'."),
    }),
  },
);
