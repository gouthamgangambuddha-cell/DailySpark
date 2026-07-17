import { z } from "zod";

const optionSchema = z.object({
  text: z.string().trim().min(1).max(200),
  isCorrect: z.boolean(),
});

const questionSchema = z
  .object({
    type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "IMAGE"]),
    prompt: z.string().trim().min(3).max(500),
    imageUrl: z.string().url().optional(),
    explanation: z.string().trim().min(3).max(500),
    options: z.array(optionSchema).max(8).optional(),
    correctFillAnswers: z.array(z.string().trim().min(1)).max(10).optional(),
  })
  .superRefine((question, ctx) => {
    if (question.type === "FILL_BLANK") {
      if (!question.correctFillAnswers || question.correctFillAnswers.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "FILL_BLANK questions require at least one accepted answer",
          path: ["correctFillAnswers"],
        });
      }
      return;
    }

    if (question.type === "IMAGE" && !question.imageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IMAGE questions require an imageUrl",
        path: ["imageUrl"],
      });
    }

    // MULTIPLE_CHOICE, TRUE_FALSE, IMAGE all answer via options.
    if (!question.options || question.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "This question type requires at least 2 options",
        path: ["options"],
      });
      return;
    }
    if (question.type === "TRUE_FALSE" && question.options.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TRUE_FALSE questions must have exactly 2 options",
        path: ["options"],
      });
    }
    const correctCount = question.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one option must be marked correct",
        path: ["options"],
      });
    }
  });

export const createQuizSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(160),
    timeLimitSeconds: z.number().int().min(10).max(3600).optional(),
    xpReward: z.number().int().min(1).max(500).optional(),
    questions: z.array(questionSchema).min(1).max(30),
  }),
});

export const submitQuizSchema = z.object({
  body: z.object({
    answers: z
      .array(
        z.object({
          questionId: z.string().uuid(),
          selectedOptionId: z.string().uuid().optional(),
          fillAnswer: z.string().trim().max(200).optional(),
        })
      )
      .min(1),
    timeTakenSeconds: z.number().int().min(0).max(24 * 3600).optional(),
  }),
});
