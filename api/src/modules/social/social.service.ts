import { prisma } from "@dailyspark/db";
import type { PublicProfileDTO, ActivityFeedItemDTO, CreateReportRequestDTO } from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { notificationsService } from "../notifications/notifications.service";

export const socialService = {
  async toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
    if (followerId === followingId) throw AppError.badRequest("You can't follow yourself");

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw AppError.notFound("User not found");

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return { following: false };
    }

    await prisma.follow.create({ data: { followerId, followingId } });

    const follower = await prisma.user.findUnique({ where: { id: followerId } });
    await notificationsService.create({
      userId: followingId,
      type: "NEW_FOLLOWER",
      message: `${follower?.name ?? "Someone"} started following you`,
      actorId: followerId,
    });

    return { following: true };
  },

  async getPublicProfile(targetUserId: string, viewerId: string | null): Promise<PublicProfileDTO> {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw AppError.notFound("User not found");

    const [followersCount, followingCount, isFollowedByViewer] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUserId } }),
      prisma.follow.count({ where: { followerId: targetUserId } }),
      viewerId
        ? prisma.follow
            .findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: targetUserId } } })
            .then((f) => !!f)
        : Promise.resolve(false),
    ]);

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      level: user.level,
      totalXp: user.totalXp,
      currentStreak: user.currentStreak,
      followersCount,
      followingCount,
      isFollowedByViewer,
      isOwnProfile: viewerId === targetUserId,
      memberSince: user.createdAt.toISOString(),
    };
  },

  /**
   * Derived activity feed: recent quiz completions and lesson likes among
   * people the viewer follows. No separate event-log table — computed on
   * the fly from existing data, fine at this content volume.
   */
  async getActivityFeed(viewerId: string, limit = 20): Promise<ActivityFeedItemDTO[]> {
    const followingIds = (
      await prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } })
    ).map((f) => f.followingId);

    if (followingIds.length === 0) return [];

    const [quizAttempts, likes] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { userId: { in: followingIds } },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          quiz: { include: { lesson: true } },
        },
        orderBy: { completedAt: "desc" },
        take: limit,
      }),
      prisma.like.findMany({
        where: { userId: { in: followingIds } },
        include: { user: { select: { id: true, name: true, avatarUrl: true } }, lesson: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const items: ActivityFeedItemDTO[] = [
      ...quizAttempts.map((a) => ({
        id: `quiz-${a.id}`,
        type: "QUIZ_COMPLETED" as const,
        actor: a.user,
        message: `completed the quiz for "${a.quiz.lesson.title}" (${a.score}/${a.totalQuestions})`,
        lessonSlug: a.quiz.lesson.slug,
        lessonTitle: a.quiz.lesson.title,
        createdAt: a.completedAt.toISOString(),
      })),
      ...likes.map((l) => ({
        id: `like-${l.id}`,
        type: "LESSON_LIKED" as const,
        actor: l.user,
        message: `liked "${l.lesson.title}"`,
        lessonSlug: l.lesson.slug,
        lessonTitle: l.lesson.title,
        createdAt: l.createdAt.toISOString(),
      })),
    ];

    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  async createReport(reporterId: string, input: CreateReportRequestDTO) {
    await prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
      },
    });
  },
};
