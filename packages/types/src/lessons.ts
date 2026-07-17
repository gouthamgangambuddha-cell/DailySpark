export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface LessonAuthorDTO {
  id: string | null;
  name: string;
  avatarUrl: string | null;
}

export interface LessonSummaryDTO {
  id: string;
  slug: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  estimatedReadingMinutes: number;
  author: LessonAuthorDTO;
  likesCount: number;
  isBookmarked: boolean;
  isLiked: boolean;
  publishedAt: string | null;
}

export interface LessonDetailDTO extends LessonSummaryDTO {
  content: string;
  audioUrl: string | null;
  references: string[];
}

export interface CreateLessonRequestDTO {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags?: string[];
  difficulty?: Difficulty;
  estimatedReadingMinutes?: number;
  imageUrl?: string;
  audioUrl?: string;
  references?: string[];
  authorName?: string;
  isPublished?: boolean;
}

export type UpdateLessonRequestDTO = Partial<CreateLessonRequestDTO>;

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export type LessonSortMode = "newest" | "popular" | "trending";

export interface ListLessonsQueryDTO {
  category?: string;
  difficulty?: Difficulty;
  tag?: string;
  q?: string;
  author?: string;
  sort?: LessonSortMode;
  page?: number;
  limit?: number;
}
