import { z } from "zod";
import { CATEGORIES } from "@dailyspark/types";

const categoryEnum = z.enum(CATEGORIES as unknown as [string, ...string[]]);
const difficultyEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const createLessonSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(160),
    summary: z.string().trim().min(10).max(400),
    content: z.string().trim().min(50, "Lesson content should be a real 5-minute read"),
    category: categoryEnum,
    tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    difficulty: difficultyEnum.optional(),
    estimatedReadingMinutes: z.number().int().min(1).max(60).optional(),
    imageUrl: z.string().url().optional(),
    audioUrl: z.string().url().optional(),
    references: z.array(z.string().trim().min(1)).max(20).optional(),
    authorName: z.string().trim().max(80).optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const updateLessonSchema = z.object({
  body: createLessonSchema.shape.body.partial().refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  }),
});

export const listLessonsQuerySchema = z.object({
  query: z.object({
    category: categoryEnum.optional(),
    difficulty: difficultyEnum.optional(),
    tag: z.string().trim().optional(),
    q: z.string().trim().min(1).max(100).optional(),
    author: z.string().trim().min(1).max(80).optional(),
    sort: z.enum(["newest", "popular", "trending"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
});

export const slugParamSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1),
  }),
});
