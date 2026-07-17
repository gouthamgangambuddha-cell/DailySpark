export interface BadgeDTO {
  code: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface GamificationSummaryDTO {
  totalXp: number;
  level: number;
  xpIntoCurrentLevel: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  badges: BadgeDTO[];
}

export interface LeaderboardEntryDTO {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  level: number;
  xp: number; // totalXp for "all time", summed XpEvent amounts for "weekly"
  isCurrentUser: boolean;
}

export type LeaderboardScope = "weekly" | "allTime";

export interface LeaderboardResponseDTO {
  scope: LeaderboardScope;
  entries: LeaderboardEntryDTO[];
  currentUserRank: LeaderboardEntryDTO | null; // present even if outside the top N
}

/** Returned alongside a quiz result so the UI can celebrate level-ups / new badges. */
export interface GamificationDeltaDTO {
  xpEarned: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  currentStreak: number;
  streakExtended: boolean;
  newBadges: BadgeDTO[];
}
