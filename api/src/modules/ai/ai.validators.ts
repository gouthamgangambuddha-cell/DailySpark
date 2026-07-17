import { z } from "zod";
import { LANGUAGES } from "@dailyspark/types";

const languageCodes = LANGUAGES.map((l) => l.code) as [string, ...string[]];

export const explainSchema = z.object({
  body: z.object({
    lessonId: z.string().uuid(),
    question: z.string().trim().min(3).max(500),
  }),
});

export const lessonIdBodySchema = z.object({
  body: z.object({
    lessonId: z.string().uuid(),
  }),
});

export const translateSchema = z.object({
  body: z.object({
    lessonId: z.string().uuid(),
    targetLanguage: z.enum(languageCodes),
  }),
});
