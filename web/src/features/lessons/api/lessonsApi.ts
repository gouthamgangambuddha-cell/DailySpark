import type {
  LessonDetailDTO,
  LessonSummaryDTO,
  PaginatedResponse,
  ListLessonsQueryDTO,
} from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const lessonsApi = {
  async list(query: ListLessonsQueryDTO) {
    const res = await apiClient.get<{ success: true; data: PaginatedResponse<LessonSummaryDTO> }>(
      "/lessons",
      { params: query }
    );
    return res.data.data;
  },

  async getBySlug(slug: string) {
    const res = await apiClient.get<{ success: true; data: { lesson: LessonDetailDTO } }>(
      `/lessons/${slug}`
    );
    return res.data.data.lesson;
  },

  async listBookmarked(page = 1, limit = 12) {
    const res = await apiClient.get<{ success: true; data: PaginatedResponse<LessonSummaryDTO> }>(
      "/lessons/bookmarked",
      { params: { page, limit } }
    );
    return res.data.data;
  },

  async toggleLike(lessonId: string) {
    const res = await apiClient.post<{
      success: true;
      data: { liked: boolean; likesCount: number };
    }>(`/lessons/${lessonId}/like`);
    return res.data.data;
  },

  async toggleBookmark(lessonId: string) {
    const res = await apiClient.post<{ success: true; data: { bookmarked: boolean } }>(
      `/lessons/${lessonId}/bookmark`
    );
    return res.data.data;
  },
};
