import { z } from "zod";

export const updateUserAdminSchema = z.object({
  body: z
    .object({
      role: z.enum(["USER", "ADMIN"]).optional(),
      isActive: z.boolean().optional(),
      isPremium: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const updateReportStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "REVIEWED", "DISMISSED"]),
  }),
});
