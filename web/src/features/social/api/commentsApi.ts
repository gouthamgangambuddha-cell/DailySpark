import type { CommentDTO, CreateCommentRequestDTO } from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const commentsApi = {
  async list(lessonId: string) {
    const res = await apiClient.get<{ success: true; data: { comments: CommentDTO[] } }>(
      `/lessons/${lessonId}/comments`
    );
    return res.data.data.comments;
  },

  async create(lessonId: string, payload: CreateCommentRequestDTO) {
    const res = await apiClient.post<{ success: true; data: { comment: CommentDTO } }>(
      `/lessons/${lessonId}/comments`,
      payload
    );
    return res.data.data.comment;
  },

  async remove(commentId: string) {
    await apiClient.delete(`/comments/${commentId}`);
  },

  async toggleLike(commentId: string) {
    const res = await apiClient.post<{
      success: true;
      data: { liked: boolean; likesCount: number };
    }>(`/comments/${commentId}/like`);
    return res.data.data;
  },
};
