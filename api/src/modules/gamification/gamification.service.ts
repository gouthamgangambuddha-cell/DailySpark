import { prisma } from "@dailyspark/db";
import type {
  GamificationSummaryDTO,
  GamificationDeltaDTO,
  BadgeDTO,
  LeaderboardResponseDTO,
  LeaderboardScope,
  LeaderboardEntryDTO,
} from "@dailyspark/types";
import { levelForXp, xpIntoCurrentLevel, xpToNextLevel } from "../../lib/leveling";
import { toDateOnlyUTC, daysBetweenUTC } from "../../lib/dateOnly";
import { BADGE_DEFINITIONS, BADGE_CODES } from "./badgeDefinitions";

async function countDistinctLessonsCompleted(userId: string): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    select: { quiz: { select: { lessonId: true } } },
  });
  return new Set(attempts.map((a) => a.quiz.lessonId)).size;
}

async function countQuizzesCompleted(userId: string): Promise<number> {
  return prisma.quizAttempt.count({ where: { userId } });
}

/** Applies streak logic for "today's" activity. Returns the updated streak + whether it grew. */
function computeStreakUpdate(
  lastActivityDate: Date | null,
  currentStreak: number,
  longestStreak: number
): { currentStreak: number; longestStreak: number; streakExtended: boolean; today: Date } {
  const today = toDateOnlyUTC(new Date());

  if (!lastActivityDate) {
    return { currentStreak: 1, longestStreak: Math.max(1, longestStreak), streakExtended: true, today };
  }

  const gap = daysBetweenUTC(lastActivityDate, today);

  if (gap === 0) {
    return { currentStreak, longestStreak, streakExtended: false, today };
  }
  if (gap === 1) {
    const next = currentStreak + 1;
    return { currentStreak: next, longestStreak: Math.max(longestStreak, next), streakExtended: true, today };
  }
  return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1), streakExtended: true, today };
}

async function evaluateNewBadges(
  userId: string,
  context: { totalXp: number; currentStreak: number; isPerfectScore: boolean }
): Promise<BadgeDTO[]> {
  const alreadyEarned = await prisma.userBadge.findMany({
    where: { userId },
    select: { badge: { select: { code: true } } },
  });
  const earnedCodes = new Set(alreadyEarned.map((b) => b.badge.code));

  const toAward: string[] = [];

  if (!earnedCodes.has(BADGE_CODES.FIRST_SPARK)) {
    const quizCount = await countQuizzesCompleted(userId);
    if (quizCount >= 1) toAward.push(BADGE_CODES.FIRST_SPARK);
  }
  if (!earnedCodes.has(BADGE_CODES.WEEK_STREAK) && context.currentStreak >= 7) {
    toAward.push(BADGE_CODES.WEEK_STREAK);
  }
  if (!earnedCodes.has(BADGE_CODES.MONTH_STREAK) && context.currentStreak >= 30) {
    toAward.push(BADGE_CODES.MONTH_STREAK);
  }
  if (!earnedCodes.has(BADGE_CODES.CENTURY_CLUB) && context.totalXp >= 100) {
    toAward.push(BADGE_CODES.CENTURY_CLUB);
  }
  if (!earnedCodes.has(BADGE_CODES.XP_1000) && context.totalXp >= 1000) {
    toAward.push(BADGE_CODES.XP_1000);
  }
  if (!earnedCodes.has(BADGE_CODES.PERFECT_SCORE) && context.isPerfectScore) {
    toAward.push(BADGE_CODES.PERFECT_SCORE);
  }
  if (!earnedCodes.has(BADGE_CODES.TEN_LESSONS)) {
    const lessonsCompleted = await countDistinctLessonsCompleted(userId);
    if (lessonsCompleted >= 10) toAward.push(BADGE_CODES.TEN_LESSONS);
  }

  if (toAward.length === 0) return [];

  const badgeRows = await prisma.badge.findMany({ where: { code: { in: toAward } } });
  await prisma.userBadge.createMany({
    data: badgeRows.map((b) => ({ userId, badgeId: b.id })),
    skipDuplicates: true,
  });

  return badgeRows.map((b) => ({
    code: b.code,
    name: b.name,
    description: b.description,
    icon: b.icon,
    earned: true,
    earnedAt: new Date().toISOString(),
  }));
}

export const gamificationService = {
  /** Idempotently ensures every badge definition exists as a row. Safe to call repeatedly. */
  async ensureBadgesSeeded(): Promise<void> {
    for (const def of BADGE_DEFINITIONS) {
      await prisma.badge.upsert({
        where: { code: def.code },
        update: { name: def.name, description: def.description, icon: def.icon },
        create: def,
      });
    }
  },

  /**
   * Called after a quiz submission. Records the XP event, updates streak/level,
   * evaluates newly-earned badges, and returns everything the UI needs to
   * show a celebratory result (level-up banner, new badge toasts, etc.).
   */
  async recordQuizCompletion(
    userId: string,
    xpEarned: number,
    quizId: string,
    isPerfectScore: boolean
  ): Promise<GamificationDeltaDTO> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const { currentStreak, longestStreak, streakExtended, today } = computeStreakUpdate(
      user.lastActivityDate,
      user.currentStreak,
      user.longestStreak
    );

    const previousLevel = levelForXp(user.totalXp);
    const newTotalXp = user.totalXp + xpEarned;
    const newLevel = levelForXp(newTotalXp);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: newTotalXp,
          level: newLevel,
          currentStreak,
          longestStreak,
          lastActivityDate: today,
        },
      }),
      prisma.xpEvent.create({
        data: { userId, amount: xpEarned, reason: "QUIZ_COMPLETED", referenceId: quizId },
      }),
    ]);

    const newBadges = await evaluateNewBadges(userId, {
      totalXp: newTotalXp,
      currentStreak,
      isPerfectScore,
    });

    return {
      xpEarned,
      totalXp: newTotalXp,
      level: newLevel,
      leveledUp: newLevel > previousLevel,
      currentStreak,
      streakExtended,
      newBadges,
    };
  },

  async getSummary(userId: string): Promise<GamificationSummaryDTO> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const [lessonsCompleted, quizzesCompleted, earnedBadges, allBadgeDefs] = await Promise.all([
      countDistinctLessonsCompleted(userId),
      countQuizzesCompleted(userId),
      prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
      prisma.badge.findMany(),
    ]);

    const earnedByCode = new Map(earnedBadges.map((ub) => [ub.badge.code, ub.earnedAt]));

    const badges: BadgeDTO[] = allBadgeDefs.map((b) => ({
      code: b.code,
      name: b.name,
      description: b.description,
      icon: b.icon,
      earned: earnedByCode.has(b.code),
      earnedAt: earnedByCode.get(b.code)?.toISOString() ?? null,
    }));

    return {
      totalXp: user.totalXp,
      level: user.level,
      xpIntoCurrentLevel: xpIntoCurrentLevel(user.totalXp),
      xpToNextLevel: xpToNextLevel(user.totalXp),
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lessonsCompleted,
      quizzesCompleted,
      badges,
    };
  },

  async getLeaderboard(
    scope: LeaderboardScope,
    viewerId: string | null,
    limit = 20
  ): Promise<LeaderboardResponseDTO> {
    if (scope === "allTime") {
      const topUsers = await prisma.user.findMany({
        orderBy: { totalXp: "desc" },
        take: limit,
        select: { id: true, name: true, avatarUrl: true, level: true, totalXp: true },
      });

      const entries: LeaderboardEntryDTO[] = topUsers.map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        level: u.level,
        xp: u.totalXp,
        isCurrentUser: u.id === viewerId,
      }));

      const currentUserRank = await getCurrentUserAllTimeRank(viewerId, entries);
      return { scope, entries, currentUserRank };
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const grouped = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true, level: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const entries: LeaderboardEntryDTO[] = grouped
      .map((g, i) => {
        const u = userMap.get(g.userId);
        if (!u) return null;
        return {
          rank: i + 1,
          userId: u.id,
          name: u.name,
          avatarUrl: u.avatarUrl,
          level: u.level,
          xp: g._sum.amount ?? 0,
          isCurrentUser: u.id === viewerId,
        };
      })
      .filter((e): e is LeaderboardEntryDTO => e !== null);

    const currentUserRank = viewerId
      ? entries.find((e) => e.userId === viewerId) ?? (await getCurrentUserWeeklyRank(viewerId, sevenDaysAgo))
      : null;

    return { scope, entries, currentUserRank };
  },
};

async function getCurrentUserAllTimeRank(
  viewerId: string | null,
  topEntries: LeaderboardEntryDTO[]
): Promise<LeaderboardEntryDTO | null> {
  if (!viewerId) return null;
  const inTop = topEntries.find((e) => e.userId === viewerId);
  if (inTop) return inTop;

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { id: true, name: true, avatarUrl: true, level: true, totalXp: true },
  });
  if (!viewer) return null;

  const higherCount = await prisma.user.count({ where: { totalXp: { gt: viewer.totalXp } } });
  return {
    rank: higherCount + 1,
    userId: viewer.id,
    name: viewer.name,
    avatarUrl: viewer.avatarUrl,
    level: viewer.level,
    xp: viewer.totalXp,
    isCurrentUser: true,
  };
}

async function getCurrentUserWeeklyRank(
  viewerId: string,
  since: Date
): Promise<LeaderboardEntryDTO | null> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { id: true, name: true, avatarUrl: true, level: true },
  });
  if (!viewer) return null;

  const own = await prisma.xpEvent.aggregate({
    where: { userId: viewerId, createdAt: { gte: since } },
    _sum: { amount: true },
  });
  const ownXp = own._sum.amount ?? 0;
  if (ownXp === 0) return null;

  const allSums = await prisma.xpEvent.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    _sum: { amount: true },
  });
  const higherCount = allSums.filter((g) => (g._sum.amount ?? 0) > ownXp).length;

  return {
    rank: higherCount + 1,
    userId: viewer.id,
    name: viewer.name,
    avatarUrl: viewer.avatarUrl,
    level: viewer.level,
    xp: ownXp,
    isCurrentUser: true,
  };
}

export { BADGE_DEFINITIONS };
