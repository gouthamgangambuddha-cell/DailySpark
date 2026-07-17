import type { Role } from "./auth";

export interface AdminStatsDTO {
  totalUsers: number;
  newUsersLast7Days: number;
  premiumUsers: number;
  totalLessons: number;
  publishedLessons: number;
  totalQuizAttempts: number;
  quizCompletionRate: number;
  pendingReports: number;
  estimatedMonthlyRevenue: number;
}

export interface AdminUserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  isPremium: boolean;
  isActive: boolean;
  emailVerified: boolean;
  totalXp: number;
  currentStreak: number;
  createdAt: string;
}

export interface UpdateUserAdminRequestDTO {
  role?: Role;
  isActive?: boolean;
  isPremium?: boolean;
}

export type AdminReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";

export interface AdminReportDTO {
  id: string;
  targetType: "LESSON" | "COMMENT";
  targetId: string;
  reason: string;
  status: AdminReportStatus;
  reporter: { id: string; name: string; email: string };
  createdAt: string;
}

export interface AdminLessonDTO {
  id: string;
  slug: string;
  title: string;
  category: string;
  isPublished: boolean;
  likesCount: number;
  hasQuiz: boolean;
  authorName: string;
  createdAt: string;
}
