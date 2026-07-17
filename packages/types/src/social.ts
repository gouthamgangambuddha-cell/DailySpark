export interface CommentAuthorDTO {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface CommentDTO {
  id: string;
  content: string;
  author: CommentAuthorDTO;
  likesCount: number;
  isLiked: boolean;
  isOwn: boolean;
  parentId: string | null;
  replies: CommentDTO[];
  createdAt: string;
  isDeleted: boolean;
}

export interface CreateCommentRequestDTO {
  content: string;
  parentId?: string;
}

export interface PublicProfileDTO {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  totalXp: number;
  currentStreak: number;
  followersCount: number;
  followingCount: number;
  isFollowedByViewer: boolean;
  isOwnProfile: boolean;
  memberSince: string;
}

export type ReportTargetType = "LESSON" | "COMMENT";

export interface CreateReportRequestDTO {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}

export type NotificationType = "NEW_FOLLOWER" | "COMMENT_REPLY" | "BADGE_EARNED";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  message: string;
  actor: CommentAuthorDTO | null;
  lessonSlug: string | null;
  isRead: boolean;
  createdAt: string;
}

export type ActivityEventType =
  | "LESSON_LIKED"
  | "LESSON_BOOKMARKED"
  | "QUIZ_COMPLETED"
  | "BADGE_EARNED"
  | "STARTED_FOLLOWING";

export interface ActivityFeedItemDTO {
  id: string;
  type: ActivityEventType;
  actor: CommentAuthorDTO;
  message: string;
  lessonSlug: string | null;
  lessonTitle: string | null;
  createdAt: string;
}
