import { prisma } from "@dailyspark/db";
import type {
  AdminStatsDTO,
  AdminUserDTO,
  UpdateUserAdminRequestDTO,
  AdminReportDTO,
  AdminReportStatus,
  AdminLessonDTO,
  PaginatedResponse,
} from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { recordAuditLog } from "../../lib/auditLog";

const MONTHLY_PRICE_USD = 6;

function toAdminUserDTO(user: {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isPremium: boolean;
  isActive: boolean;
  emailVerified: boolean;
  totalXp: number;
  currentStreak: number;
  createdAt: Date;
}): AdminUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isPremium: user.isPremium,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    totalXp: user.totalXp,
    currentStreak: user.currentStreak,
    createdAt: user.createdAt.toISOString(),
  };
}

export const adminService = {
  async getStats(): Promise<AdminStatsDTO> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast7Days,
      premiumUsers,
      totalLessons,
      publishedLessons,
      totalQuizAttempts,
      attemptsWithScore,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { isPublished: true } }),
      prisma.quizAttempt.count(),
      prisma.quizAttempt.count({ where: { score: { gt: 0 } } }),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

    return {
      totalUsers,
      newUsersLast7Days,
      premiumUsers,
      totalLessons,
      publishedLessons,
      totalQuizAttempts,
      quizCompletionRate:
        totalQuizAttempts > 0 ? Math.round((attemptsWithScore / totalQuizAttempts) * 100) : 0,
      pendingReports,
      estimatedMonthlyRevenue: premiumUsers * MONTHLY_PRICE_USD,
    };
  },

  async listUsers(
    search: string | undefined,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<AdminUserDTO>> {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [totalItems, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: users.map(toAdminUserDTO),
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
  },

  async updateUser(
    adminUserId: string,
    targetUserId: string,
    input: UpdateUserAdminRequestDTO
  ): Promise<AdminUserDTO> {
    if (adminUserId === targetUserId && input.role === "USER") {
      throw AppError.badRequest("You can't demote your own account");
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(input.role !== undefined && { role: input.role }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.isPremium !== undefined && { isPremium: input.isPremium }),
      },
    });

    await recordAuditLog({
      actorId: adminUserId,
      action: "USER_UPDATED",
      targetType: "User",
      targetId: targetUserId,
      metadata: { changes: input },
    });

    return toAdminUserDTO(user);
  },

  async deleteUser(adminUserId: string, targetUserId: string): Promise<void> {
    if (adminUserId === targetUserId) {
      throw AppError.badRequest("You can't delete your own account from the admin panel");
    }
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw AppError.notFound("User not found");
    await prisma.user.delete({ where: { id: targetUserId } });

    await recordAuditLog({
      actorId: adminUserId,
      action: "USER_DELETED",
      targetType: "User",
      targetId: targetUserId,
      metadata: { email: user.email },
    });
  },

  async listReports(
    status: AdminReportStatus | undefined,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<AdminReportDTO>> {
    const where = status ? { status } : {};

    const [totalItems, reports] = await prisma.$transaction([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        include: { reporter: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: reports.map((r) => ({
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        reporter: r.reporter,
        createdAt: r.createdAt.toISOString(),
      })),
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
  },

  async updateReportStatus(
    adminUserId: string,
    reportId: string,
    status: AdminReportStatus
  ): Promise<void> {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw AppError.notFound("Report not found");
    await prisma.report.update({ where: { id: reportId }, data: { status } });

    await recordAuditLog({
      actorId: adminUserId,
      action: "REPORT_STATUS_CHANGED",
      targetType: "Report",
      targetId: reportId,
      metadata: { from: report.status, to: status },
    });
  },

  async listLessons(
    search: string | undefined,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<AdminLessonDTO>> {
    const where = search ? { title: { contains: search, mode: "insensitive" as const } } : {};

    const [totalItems, lessons] = await prisma.$transaction([
      prisma.lesson.count({ where }),
      prisma.lesson.findMany({
        where,
        include: { author: { select: { name: true } }, quiz: { select: { id: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        category: l.category,
        isPublished: l.isPublished,
        likesCount: l.likesCount,
        hasQuiz: !!l.quiz,
        authorName: l.author?.name ?? l.authorName ?? "DailySpark Team",
        createdAt: l.createdAt.toISOString(),
      })),
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
  },
};
