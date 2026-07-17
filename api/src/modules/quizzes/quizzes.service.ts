import { prisma } from "@dailyspark/db";
import type {
  CreateQuizRequestDTO,
  QuizForAttemptDTO,
  SubmitQuizRequestDTO,
  QuizResultDTO,
  QuestionResultDTO,
} from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { gamificationService } from "../gamification/gamification.service";

export const quizzesService = {
  async createQuizForLesson(lessonId: string, input: CreateQuizRequestDTO) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw AppError.notFound("Lesson not found");

    const existing = await prisma.quiz.findUnique({ where: { lessonId } });
    if (existing) throw AppError.conflict("This lesson already has a quiz. Update it instead.");

    const quiz = await prisma.quiz.create({
      data: {
        lessonId,
        title: input.title,
        timeLimitSeconds: input.timeLimitSeconds,
        xpReward: input.xpReward ?? 20,
        questions: {
          create: input.questions.map((q, index) => ({
            type: q.type,
            prompt: q.prompt,
            imageUrl: q.imageUrl,
            explanation: q.explanation,
            order: index,
            correctFillAnswers: q.correctFillAnswers ?? [],
            options: q.options
              ? {
                  create: q.options.map((opt, optIndex) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    order: optIndex,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: { questions: { include: { options: true } } },
    });

    return quiz;
  },

  async getQuizForLesson(lessonId: string, viewerId: string | null): Promise<QuizForAttemptDTO> {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!quiz) throw AppError.notFound("This lesson doesn't have a quiz yet");

    return {
      id: quiz.id,
      lessonId: quiz.lessonId,
      title: quiz.title,
      timeLimitSeconds: quiz.timeLimitSeconds,
      xpReward: quiz.xpReward,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        imageUrl: q.imageUrl,
        order: q.order,
        // Never send isCorrect or correctFillAnswers to someone about to take the quiz.
        options: q.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
      })),
    };
  },

  async submitQuiz(
    quizId: string,
    userId: string,
    input: SubmitQuizRequestDTO
  ): Promise<QuizResultDTO> {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { options: true } } },
    });
    if (!quiz) throw AppError.notFound("Quiz not found");

    const answersByQuestionId = new Map(input.answers.map((a) => [a.questionId, a]));
    const results: QuestionResultDTO[] = [];
    let correctCount = 0;

    for (const question of quiz.questions) {
      const submitted = answersByQuestionId.get(question.id);
      let isCorrect = false;

      if (question.type === "FILL_BLANK") {
        const accepted = question.correctFillAnswers.map((a) => a.toLowerCase().trim());
        const given = submitted?.fillAnswer?.toLowerCase().trim() ?? "";
        isCorrect = given.length > 0 && accepted.includes(given);
      } else {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = !!submitted?.selectedOptionId && submitted.selectedOptionId === correctOption?.id;
      }

      if (isCorrect) correctCount += 1;

      const correctOption = question.options.find((o) => o.isCorrect);
      results.push({
        questionId: question.id,
        correct: isCorrect,
        explanation: question.explanation,
        correctOptionId: correctOption?.id ?? null,
        correctFillAnswers: question.correctFillAnswers,
      });
    }

    const totalQuestions = quiz.questions.length;
    const xpEarned = Math.round(quiz.xpReward * (correctCount / totalQuestions));

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score: correctCount,
        totalQuestions,
        xpEarned,
        timeTakenSeconds: input.timeTakenSeconds,
        answers: input.answers as unknown as object,
      },
    });

    const gamification = await gamificationService.recordQuizCompletion(
      userId,
      xpEarned,
      quizId,
      correctCount === totalQuestions && totalQuestions > 0
    );

    return {
      attemptId: attempt.id,
      score: correctCount,
      totalQuestions,
      xpEarned,
      timeTakenSeconds: attempt.timeTakenSeconds,
      results,
      gamification,
    };
  },

  async updateQuiz(lessonId: string, input: Partial<CreateQuizRequestDTO>) {
    const quiz = await prisma.quiz.findUnique({ where: { lessonId } });
    if (!quiz) throw AppError.notFound("Quiz not found for this lesson");

    // Simplification for this step: full question-set replacement rather than
    // per-question diffing. Fine at current content volume; can be refined
    // into granular question CRUD alongside the admin dashboard (Step 13).
    if (input.questions) {
      await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    }

    const updated = await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.timeLimitSeconds !== undefined && { timeLimitSeconds: input.timeLimitSeconds }),
        ...(input.xpReward !== undefined && { xpReward: input.xpReward }),
        ...(input.questions && {
          questions: {
            create: input.questions.map((q, index) => ({
              type: q.type,
              prompt: q.prompt,
              imageUrl: q.imageUrl,
              explanation: q.explanation,
              order: index,
              correctFillAnswers: q.correctFillAnswers ?? [],
              options: q.options
                ? {
                    create: q.options.map((opt, optIndex) => ({
                      text: opt.text,
                      isCorrect: opt.isCorrect,
                      order: optIndex,
                    })),
                  }
                : undefined,
            })),
          },
        }),
      },
      include: { questions: { include: { options: true } } },
    });

    return updated;
  },

  async deleteQuiz(lessonId: string) {
    const quiz = await prisma.quiz.findUnique({ where: { lessonId } });
    if (!quiz) throw AppError.notFound("Quiz not found for this lesson");
    await prisma.quiz.delete({ where: { id: quiz.id } });
  },

  async getUserAttempts(userId: string, quizId: string) {
    return prisma.quizAttempt.findMany({
      where: { userId, quizId },
      orderBy: { completedAt: "desc" },
    });
  },
};
