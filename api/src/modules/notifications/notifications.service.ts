import { prisma } from "@dailyspark/db";
import type { NotificationDTO, NotificationType } from "@dailyspark/types";
import { sendPushNotification } from "../../lib/firebaseAdmin";
import { logger } from "../../lib/logger";

const actorSelect = { select: { id: true, name: true, avatarUrl: true } };

function toDTO(n: {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actor: { id: string; name: string; avatarUrl: string | null } | null;
  lesson: { slug: string } | null;
}): NotificationDTO {
  return {
    id: n.id,
    type: n.type as NotificationType,
    message: n.message,
    actor: n.actor,
    lessonSlug: n.lesson?.slug ?? null,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

export const notificationsService = {
  /** Internal helper — other modules call this to notify a user. Never throws on failure. */
  async create(input: {
    userId: string;
    type: NotificationType;
    message: string;
    actorId?: string;
    lessonId?: string;
    commentId?: string;
  }) {
    if (input.actorId === input.userId) return;

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        message: input.message,
        actorId: input.actorId,
        lessonId: input.lessonId,
        commentId: input.commentId,
      },
      include: { lesson: { select: { slug: true } } },
    });

    // Push delivery is best-effort and must never break the caller's flow
    // (e.g. posting a comment reply should succeed even if push fails).
    this.sendPush(input.userId, notification).catch((err) =>
      logger.error("Push notification dispatch failed", { error: String(err) })
    );
  },

  async sendPush(
    userId: string,
    notification: { message: string; lesson: { slug: string } | null }
  ) {
    const deviceTokens = await prisma.deviceToken.findMany({ where: { userId } });
    if (deviceTokens.length === 0) return;

    const { invalidTokens } = await sendPushNotification(
      deviceTokens.map((d) => d.token),
      {
        title: "DailySpark",
        body: notification.message,
        url: notification.lesson ? `/lessons/${notification.lesson.slug}` : undefined,
      }
    );

    if (invalidTokens.length > 0) {
      await prisma.deviceToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
  },

  async registerDeviceToken(userId: string, token: string, platform: string) {
    await prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  },

  async unregisterDeviceToken(token: string) {
    await prisma.deviceToken.deleteMany({ where: { token } });
  },

  async list(userId: string, page: number, limit: number) {
    const [totalItems, notifications, unreadCount] = await prisma.$transaction([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.findMany({
        where: { userId },
        include: { actor: actorSelect, lesson: { select: { slug: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: notifications.map(toDTO),
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      unreadCount,
    };
  },

  async markRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },
};
