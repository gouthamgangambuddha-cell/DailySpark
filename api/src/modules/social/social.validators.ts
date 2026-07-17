import { z } from "zod";

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(["LESSON", "COMMENT"]),
    targetId: z.string().uuid(),
    reason: z.string().trim().min(5).max(500),
  }),
});
