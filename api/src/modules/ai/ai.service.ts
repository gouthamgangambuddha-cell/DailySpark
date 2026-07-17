import { prisma } from "@dailyspark/db";
import type { FlashcardDTO, PracticeQuestionDTO, LessonSummaryDTO } from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { askClaude, askClaudeForJSON } from "../../lib/anthropic";
import { aiQuota } from "./aiQuota";

async function getLessonOrThrow(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || !lesson.isPublished) throw AppError.notFound("Lesson not found");
  return lesson;
}

export const aiService = {
  async explain(userId: string, lessonId: string, question: string) {
    const lesson = await getLessonOrThrow(lessonId);
    const remainingToday = await aiQuota.checkAndConsume(userId);

    const answer = await askClaude(
      "You are a patient, friendly tutor for DailySpark, a micro-learning app. " +
        "Explain concepts simply and concretely, in 3-5 short sentences. Avoid jargon unless you define it. " +
        "Stay grounded in the lesson content provided — don't introduce unrelated tangents.",
      `Lesson: "${lesson.title}"\n\nLesson content:\n${lesson.content}\n\nThe learner asks: "${question}"\n\nAnswer their question.`
    );

    return { answer, remainingToday };
  },

  async generateFlashcards(userId: string, lessonId: string) {
    const lesson = await getLessonOrThrow(lessonId);
    const remainingToday = await aiQuota.checkAndConsume(userId);

    const result = await askClaudeForJSON<{ flashcards: FlashcardDTO[] }>(
      "You create concise study flashcards from lesson content for a micro-learning app.",
      `Lesson: "${lesson.title}"\n\nContent:\n${lesson.content}\n\n` +
        `Generate exactly 5 flashcards as JSON: { "flashcards": [{ "front": "...", "back": "..." }] }. ` +
        `Fronts should be short questions or terms; backs should be 1-2 sentence answers.`
    );

    return { flashcards: result.flashcards.slice(0, 5), remainingToday };
  },

  async generatePracticeQuestions(userId: string, lessonId: string) {
    const lesson = await getLessonOrThrow(lessonId);
    const remainingToday = await aiQuota.checkAndConsume(userId);

    const result = await askClaudeForJSON<{ questions: PracticeQuestionDTO[] }>(
      "You create short-answer practice questions from lesson content to help learners self-test.",
      `Lesson: "${lesson.title}"\n\nContent:\n${lesson.content}\n\n` +
        `Generate exactly 4 practice questions as JSON: { "questions": [{ "question": "...", "answer": "..." }] }. ` +
        `Questions should require a sentence or two to answer well, not a single word.`
    );

    return { questions: result.questions.slice(0, 4), remainingToday };
  },

  async translateLesson(userId: string, lessonId: string, targetLanguage: string) {
    const lesson = await getLessonOrThrow(lessonId);
    const remainingToday = await aiQuota.checkAndConsume(userId);

    const result = await askClaudeForJSON<{ title: string; summary: string; content: string }>(
      "You are a professional translator. Preserve meaning, tone, and factual accuracy exactly — do not summarize or add commentary.",
      `Translate the following lesson into the language with code "${targetLanguage}". ` +
        `Return JSON: { "title": "...", "summary": "...", "content": "..." }.\n\n` +
        `Title: ${lesson.title}\nSummary: ${lesson.summary}\nContent:\n${lesson.content}`
    );

    return { ...result, remainingToday };
  },

  /**
   * Lesson recommendations are heuristic, not LLM-generated — matching by the
   * user's stated interests and previously-liked categories keeps this fast,
   * free, and deterministic. An LLM-ranked version could layer on top later
   * if heuristic matching proves insufficient.
   */
  async recommendLessons(userId: string, limit = 6): Promise<LessonSummaryDTO[]> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const likedLessons = await prisma.like.findMany({ where: { userId }, include: { lesson: true } });
    const likedCategories = likedLessons.map((l) => l.lesson.category);
    const candidateCategories = [...new Set([...user.interests, ...likedCategories])];

    const bookmarked = await prisma.bookmark.findMany({ where: { userId }, select: { lessonId: true } });
    const alreadyInteracted = new Set([
      ...likedLessons.map((l) => l.lessonId),
      ...bookmarked.map((b) => b.lessonId),
    ]);

    const where =
      candidateCategories.length > 0
        ? {
            isPublished: true,
            category: { in: candidateCategories },
            id: { notIn: [...alreadyInteracted] },
          }
        : { isPublished: true, id: { notIn: [...alreadyInteracted] } };

    const lessons = await prisma.lesson.findMany({
      where,
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { likesCount: "desc" },
      take: limit,
    });

    let finalLessons = lessons;
    if (finalLessons.length < limit) {
      const fallback = await prisma.lesson.findMany({
        where: {
          isPublished: true,
          id: { notIn: [...alreadyInteracted, ...lessons.map((l) => l.id)] },
        },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { likesCount: "desc" },
        take: limit - finalLessons.length,
      });
      finalLessons = [...finalLessons, ...fallback];
    }

    return finalLessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      imageUrl: lesson.imageUrl,
      category: lesson.category,
      tags: lesson.tags,
      difficulty: lesson.difficulty,
      estimatedReadingMinutes: lesson.estimatedReadingMinutes,
      author: {
        id: lesson.author?.id ?? null,
        name: lesson.author?.name ?? lesson.authorName ?? "DailySpark Team",
        avatarUrl: lesson.author?.avatarUrl ?? null,
      },
      likesCount: lesson.likesCount,
      isBookmarked: false,
      isLiked: false,
      publishedAt: lesson.publishedAt?.toISOString() ?? null,
    }));
  },
};
