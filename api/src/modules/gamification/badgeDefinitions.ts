export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    code: "first_spark",
    name: "First Spark",
    description: "Complete your very first quiz.",
    icon: "✨",
  },
  {
    code: "week_streak",
    name: "One Week Lit",
    description: "Keep a 7-day streak alive.",
    icon: "🔥",
  },
  {
    code: "month_streak",
    name: "Unquenchable",
    description: "Keep a 30-day streak alive.",
    icon: "🕯️",
  },
  {
    code: "century_club",
    name: "Century Club",
    description: "Earn 100 total XP.",
    icon: "💯",
  },
  {
    code: "xp_1000",
    name: "Bright Mind",
    description: "Earn 1,000 total XP.",
    icon: "🧠",
  },
  {
    code: "perfect_score",
    name: "Perfect Spark",
    description: "Get every question right on a quiz.",
    icon: "🎯",
  },
  {
    code: "ten_lessons",
    name: "Ten Down",
    description: "Complete quizzes for 10 different lessons.",
    icon: "📚",
  },
];

export const BADGE_CODES = {
  FIRST_SPARK: "first_spark",
  WEEK_STREAK: "week_streak",
  MONTH_STREAK: "month_streak",
  CENTURY_CLUB: "century_club",
  XP_1000: "xp_1000",
  PERFECT_SCORE: "perfect_score",
  TEN_LESSONS: "ten_lessons",
} as const;
