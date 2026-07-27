import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { RESUME } from "@/example-data/Resume";

export const getContactInfoTool = tool(async () => JSON.stringify(RESUME.contact, null, 2), {
  name: "get_contact_info",
  description:
    "Returns Lukas A Sorensen's contact information including email, website, GitHub, and LinkedIn. " +
    "Use whenever the user asks how to reach Lukas or requests his contact details.",
  schema: z.object({}),
});
