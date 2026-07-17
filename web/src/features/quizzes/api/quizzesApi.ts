import type {
  QuizForAttemptDTO,
  SubmitQuizRequestDTO,
  QuizResultDTO,
} from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const quizzesApi = {
  async getForLesson(lessonId: string) {
    const res = await apiClient.get<{ success: true; data: { quiz: QuizForAttemptDTO } }>(
      `/lessons/${lessonId}/quiz`
    );
    return res.data.data.quiz;
  },

  async submit(quizId: string, payload: SubmitQuizRequestDTO) {
    const res = await apiClient.post<{ success: true; data: QuizResultDTO }>(
      `/quizzes/${quizId}/submit`,
      payload
    );
    return res.data.data;
  },
};
