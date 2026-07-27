import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { RESUME } from "@/example-data/Resume";

export const getResumeTool = tool(async () => JSON.stringify(RESUME, null, 2), {
  name: "get_resume",
  description:
    "Fetches Lukas A Sorensen's full resume including work experience, skills, education, and accomplishments. " +
    "Use whenever the user asks about his background, career history, qualifications, technical skills, or anything professional.",
  schema: z.object({}),
});
