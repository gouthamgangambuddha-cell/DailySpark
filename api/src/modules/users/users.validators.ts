import { z } from "zod";
import { CATEGORIES, LANGUAGES } from "@dailyspark/types";

const languageCodes = LANGUAGES.map((l) => l.code) as [string, ...string[]];

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
      bio: z.string().trim().max(280, "Bio must be 280 characters or fewer").optional(),
      interests: z
        .array(z.enum(CATEGORIES as unknown as [string, ...string[]]))
        .max(CATEGORIES.length)
        .optional(),
      preferredLanguage: z.enum(languageCodes).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const deleteAccountSchema = z.object({
  body: z.object({
    // Requiring the password again on delete prevents a hijacked/idle session
    // (e.g. an unlocked laptop) from silently destroying the account.
    // OAuth-only accounts (no password) skip this via the service layer.
    password: z.string().optional(),
    confirmation: z
      .string()
      .refine((v) => v === "DELETE", { message: 'You must type "DELETE" to confirm' }),
  }),
});
