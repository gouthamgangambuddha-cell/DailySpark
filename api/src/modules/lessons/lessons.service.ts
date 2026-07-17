import { prisma } from "@dailyspark/db";
import type {
  CreateLessonRequestDTO,
  UpdateLessonRequestDTO,
  LessonSummaryDTO,
  LessonDetailDTO,
  PaginatedResponse,
  Difficulty,
} from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { slugify } from "../../lib/slugify";

type LessonWithAuthor = Awaited<ReturnType<typeof prisma.lesson.findFirstOrThrow>> & {
  author: { id: string; name: string; avatarUrl: string | null } | null;
};

function toSummaryDTO(
  lesson: LessonWithAuthor,
  viewerLikedIds: Set<string>,
  viewerBookmarkedIds: Set<string>
): LessonSummaryDTO {
  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    imageUrl: lesson.imageUrl,
    category: lesson.category,
    tags: lesson.tags,
    difficulty: lesson.difficulty as Difficulty,
    estimatedReadingMinutes: lesson.estimatedReadingMinutes,
    author: {
      id: lesson.author?.id ?? null,
      name: lesson.author?.name ?? lesson.authorName ?? "DailySpark Team",
      avatarUrl: lesson.author?.avatarUrl ?? null,
    },
    likesCount: lesson.likesCount,
    isBookmarked: viewerBookmarkedIds.has(lesson.id),
    isLiked: viewerLikedIds.has(lesson.id),
    publishedAt: lesson.publishedAt ? lesson.publishedAt.toISOString() : null,
  };
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  if (!base) throw AppError.badRequest("Title must contain at least one alphanumeric character");

  let candidate = base;
  let suffix = 1;
  // Small collision loop — lesson volume never makes this a real bottleneck.
  while (await prisma.lesson.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

const authorSelect = { select: { id: true, name: true, avatarUrl: true } };

export const lessonsService = {
  async createLesson(input: CreateLessonRequestDTO, authorId: string) {
    const slug = await generateUniqueSlug(input.title);

    const lesson = await prisma.lesson.create({
      data: {
        slug,
        title: input.title,
        summary: input.summary,
        content: input.content,
        category: input.category,
        tags: input.tags ?? [],
        difficulty: input.difficulty ?? "BEGINNER",
        estimatedReadingMinutes: input.estimatedReadingMinutes ?? 5,
        imageUrl: input.imageUrl,
        audioUrl: input.audioUrl,
        references: input.references ?? [],
        authorId,
        authorName: input.authorName,
        isPublished: input.isPublished ?? true,
        publishedAt: (input.isPublished ?? true) ? new Date() : null,
      },
      include: { author: authorSelect },
    });

    return toDetailDTO(lesson, new Set(), new Set());
  },

  async updateLesson(lessonId: string, input: UpdateLessonRequestDTO) {
    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!existing) throw AppError.notFound("Lesson not found");

    const willPublishNow = input.isPublished === true && !existing.isPublished;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.summary !== undefined && { summary: input.summary }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
        ...(input.estimatedReadingMinutes !== undefined && {
          estimatedReadingMinutes: input.estimatedReadingMinutes,
        }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.audioUrl !== undefined && { audioUrl: input.audioUrl }),
        ...(input.references !== undefined && { references: input.references }),
        ...(input.authorName !== undefined && { authorName: input.authorName }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        ...(willPublishNow && { publishedAt: new Date() }),
      },
      include: { author: authorSelect },
    });

    return toDetailDTO(lesson, new Set(), new Set());
  },

  async deleteLesson(lessonId: string) {
    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!existing) throw AppError.notFound("Lesson not found");
    await prisma.lesson.delete({ where: { id: lessonId } });
  },

  async getLessonBySlug(slug: string, viewerId: string | null): Promise<LessonDetailDTO> {
    const lesson = await prisma.lesson.findUnique({
      where: { slug },
      include: { author: authorSelect },
    });

    if (!lesson || !lesson.isPublished) {
      throw AppError.notFound("Lesson not found");
    }

    const [likedIds, bookmarkedIds] = await getViewerInteractionSets(viewerId, [lesson.id]);
    return toDetailDTO(lesson, likedIds, bookmarkedIds);
  },

  async listLessons(
    filters: {
      category?: string;
      difficulty?: Difficulty;
      tag?: string;
      q?: string;
      author?: string;
    },
    sort: "newest" | "popular" | "trending",
    page: number,
    limit: number,
    viewerId: string | null
  ): Promise<PaginatedResponse<LessonSummaryDTO>> {
    const where = {
      isPublished: true,
      ...(filters.category && { category: filters.category }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.tag && { tags: { has: filters.tag } }),
      ...(filters.q && {
        OR: [
          { title: { contains: filters.q, mode: "insensitive" as const } },
          { summary: { contains: filters.q, mode: "insensitive" as const } },
          { tags: { has: filters.q.toLowerCase() } },
        ],
      }),
      ...(filters.author && {
        OR: [
          { author: { name: { contains: filters.author, mode: "insensitive" as const } } },
          { authorName: { contains: filters.author, mode: "insensitive" as const } },
        ],
      }),
    };

    if (sort === "trending") {
      return listTrendingLessons(where, page, limit, viewerId);
    }

    const [totalItems, lessons] = await prisma.$transaction([
      prisma.lesson.count({ where }),
      prisma.lesson.findMany({
        where,
        include: { author: authorSelect },
        orderBy: sort === "popular" ? { likesCount: "desc" } : { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const [likedIds, bookmarkedIds] = await getViewerInteractionSets(
      viewerId,
      lessons.map((l) => l.id)
    );

    return {
      items: lessons.map((lesson) => toSummaryDTO(lesson, likedIds, bookmarkedIds)),
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
  },

  async listBookmarkedLessons(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<LessonSummaryDTO>> {
    const where = { userId };

    const [totalItems, bookmarks] = await prisma.$transaction([
      prisma.bookmark.count({ where }),
      prisma.bookmark.findMany({
        where,
        include: { lesson: { include: { author: authorSelect } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const lessonIds = bookmarks.map((b) => b.lessonId);
    const [likedIds] = await getViewerInteractionSets(userId, lessonIds);
    const bookmarkedIds = new Set(lessonIds);

    return {
      items: bookmarks.map((b) => toSummaryDTO(b.lesson, likedIds, bookmarkedIds)),
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
  },

  async toggleLike(userId: string, lessonId: string): Promise<{ liked: boolean; likesCount: number }> {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw AppError.notFound("Lesson not found");

    const existing = await prisma.like.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      const [, updated] = await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.lesson.update({
          where: { id: lessonId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false, likesCount: updated.likesCount };
    }

    const [, updated] = await prisma.$transaction([
      prisma.like.create({ data: { userId, lessonId } }),
      prisma.lesson.update({
        where: { id: lessonId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);
    return { liked: true, likesCount: updated.likesCount };
  },

  async toggleBookmark(userId: string, lessonId: string): Promise<{ bookmarked: boolean }> {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw AppError.notFound("Lesson not found");

    const existing = await prisma.bookmark.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await prisma.bookmark.create({ data: { userId, lessonId } });
    return { bookmarked: true };
  },
};

async function listTrendingLessons(
  where: Record<string, unknown>,
  page: number,
  limit: number,
  viewerId: string | null
): Promise<PaginatedResponse<LessonSummaryDTO>> {
  const matching = await prisma.lesson.findMany({
    where,
    select: { id: true, publishedAt: true },
  });
  const totalItems = matching.length;
  if (totalItems === 0) {
    return { items: [], page, limit, totalItems: 0, totalPages: 1 };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentLikes = await prisma.like.groupBy({
    by: ["lessonId"],
    where: { lessonId: { in: matching.map((m) => m.id) }, createdAt: { gte: sevenDaysAgo } },
    _count: { lessonId: true },
  });
  const recentLikeCounts = new Map(recentLikes.map((r) => [r.lessonId, r._count.lessonId]));

  // Trending = most recent-liked first; lessons with zero recent likes fall
  // back to newest-first, so a quiet category still returns a full page.
  const sortedIds = matching
    .slice()
    .sort((a, b) => {
      const diff = (recentLikeCounts.get(b.id) ?? 0) - (recentLikeCounts.get(a.id) ?? 0);
      if (diff !== 0) return diff;
      return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
    })
    .map((m) => m.id);

  const pageIds = sortedIds.slice((page - 1) * limit, (page - 1) * limit + limit);

  const lessons = await prisma.lesson.findMany({
    where: { id: { in: pageIds } },
    include: { author: authorSelect },
  });
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const orderedLessons = pageIds.map((id) => lessonById.get(id)!).filter(Boolean);

  const [likedIds, bookmarkedIds] = await getViewerInteractionSets(viewerId, pageIds);

  return {
    items: orderedLessons.map((lesson) => toSummaryDTO(lesson, likedIds, bookmarkedIds)),
    page,
    limit,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
  };
}

function toDetailDTO(
  lesson: LessonWithAuthor & { content: string; audioUrl: string | null; references: string[] },
  likedIds: Set<string>,
  bookmarkedIds: Set<string>
): LessonDetailDTO {
  return {
    ...toSummaryDTO(lesson, likedIds, bookmarkedIds),
    content: lesson.content,
    audioUrl: lesson.audioUrl,
    references: lesson.references,
  };
}

async function getViewerInteractionSets(
  viewerId: string | null,
  lessonIds: string[]
): Promise<[Set<string>, Set<string>]> {
  if (!viewerId || lessonIds.length === 0) return [new Set(), new Set()];

  const [likes, bookmarks] = await prisma.$transaction([
    prisma.like.findMany({ where: { userId: viewerId, lessonId: { in: lessonIds } } }),
    prisma.bookmark.findMany({ where: { userId: viewerId, lessonId: { in: lessonIds } } }),
  ]);

  return [new Set(likes.map((l) => l.lessonId)), new Set(bookmarks.map((b) => b.lessonId))];
}
