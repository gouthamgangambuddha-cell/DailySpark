import { prisma } from "@dailyspark/db";
import type { CommentDTO, CreateCommentRequestDTO } from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { notificationsService } from "../notifications/notifications.service";

const authorSelect = { select: { id: true, name: true, avatarUrl: true } };

interface RawComment {
  id: string;
  content: string;
  parentId: string | null;
  likesCount: number;
  isDeleted: boolean;
  createdAt: Date;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

function buildTree(
  comments: RawComment[],
  likedIds: Set<string>,
  viewerId: string | null
): CommentDTO[] {
  const byParent = new Map<string | null, RawComment[]>();
  for (const c of comments) {
    const key = c.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }

  function toDTO(c: RawComment): CommentDTO {
    return {
      id: c.id,
      content: c.isDeleted ? "[deleted]" : c.content,
      author: c.isDeleted ? { id: c.user.id, name: "Deleted", avatarUrl: null } : c.user,
      likesCount: c.likesCount,
      isLiked: likedIds.has(c.id),
      isOwn: c.userId === viewerId,
      parentId: c.parentId,
      replies: (byParent.get(c.id) ?? [])
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(toDTO),
      createdAt: c.createdAt.toISOString(),
      isDeleted: c.isDeleted,
    };
  }

  return (byParent.get(null) ?? [])
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(toDTO);
}

export const commentsService = {
  async listForLesson(lessonId: string, viewerId: string | null): Promise<CommentDTO[]> {
    const comments = await prisma.comment.findMany({
      where: { lessonId },
      include: { user: authorSelect },
      orderBy: { createdAt: "asc" },
    });

    let likedIds = new Set<string>();
    if (viewerId && comments.length > 0) {
      const likes = await prisma.commentLike.findMany({
        where: { userId: viewerId, commentId: { in: comments.map((c) => c.id) } },
      });
      likedIds = new Set(likes.map((l) => l.commentId));
    }

    return buildTree(comments, likedIds, viewerId);
  },

  async create(lessonId: string, userId: string, input: CreateCommentRequestDTO): Promise<CommentDTO> {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw AppError.notFound("Lesson not found");

    let parent = null;
    if (input.parentId) {
      parent = await prisma.comment.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.lessonId !== lessonId) {
        throw AppError.badRequest("Parent comment not found on this lesson");
      }
    }

    const comment = await prisma.comment.create({
      data: { lessonId, userId, content: input.content, parentId: input.parentId },
      include: { user: authorSelect },
    });

    if (parent && parent.userId !== userId) {
      const author = await prisma.user.findUnique({ where: { id: userId } });
      await notificationsService.create({
        userId: parent.userId,
        type: "COMMENT_REPLY",
        message: `${author?.name ?? "Someone"} replied to your comment`,
        actorId: userId,
        lessonId,
        commentId: comment.id,
      });
    }

    return {
      id: comment.id,
      content: comment.content,
      author: comment.user,
      likesCount: 0,
      isLiked: false,
      isOwn: true,
      parentId: comment.parentId,
      replies: [],
      createdAt: comment.createdAt.toISOString(),
      isDeleted: false,
    };
  },

  async softDelete(commentId: string, userId: string, isAdmin: boolean) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw AppError.notFound("Comment not found");
    if (comment.userId !== userId && !isAdmin) {
      throw AppError.forbidden("You can only delete your own comments");
    }
    await prisma.comment.update({ where: { id: commentId }, data: { isDeleted: true, content: "" } });
  },

  async toggleLike(userId: string, commentId: string): Promise<{ liked: boolean; likesCount: number }> {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw AppError.notFound("Comment not found");

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      const [, updated] = await prisma.$transaction([
        prisma.commentLike.delete({ where: { id: existing.id } }),
        prisma.comment.update({ where: { id: commentId }, data: { likesCount: { decrement: 1 } } }),
      ]);
      return { liked: false, likesCount: updated.likesCount };
    }

    const [, updated] = await prisma.$transaction([
      prisma.commentLike.create({ data: { userId, commentId } }),
      prisma.comment.update({ where: { id: commentId }, data: { likesCount: { increment: 1 } } }),
    ]);
    return { liked: true, likesCount: updated.likesCount };
  },
};
