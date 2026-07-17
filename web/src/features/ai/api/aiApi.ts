import type {
  ExplainResponseDTO,
  GenerateFlashcardsResponseDTO,
  GeneratePracticeQuestionsResponseDTO,
  TranslateLessonResponseDTO,
  AiQuotaDTO,
  LessonSummaryDTO,
} from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const aiApi = {
  async explain(lessonId: string, question: string) {
    const res = await apiClient.post<{ success: true; data: ExplainResponseDTO }>("/ai/explain", {
      lessonId,
      question,
    });
    return res.data.data;
  },

  async generateFlashcards(lessonId: string) {
    const res = await apiClient.post<{ success: true; data: GenerateFlashcardsResponseDTO }>(
      "/ai/flashcards",
      { lessonId }
    );
    return res.data.data;
  },

  async generatePracticeQuestions(lessonId: string) {
    const res = await apiClient.post<{
      success: true;
      data: GeneratePracticeQuestionsResponseDTO;
    }>("/ai/practice-questions", { lessonId });
    return res.data.data;
  },

  async translate(lessonId: string, targetLanguage: string) {
    const res = await apiClient.post<{ success: true; data: TranslateLessonResponseDTO }>(
      "/ai/translate",
      { lessonId, targetLanguage }
    );
    return res.data.data;
  },

  async getRecommendations() {
    const res = await apiClient.get<{ success: true; data: { lessons: LessonSummaryDTO[] } }>(
      "/ai/recommendations"
    );
    return res.data.data.lessons;
  },

  async getQuota() {
    const res = await apiClient.get<{ success: true; data: { quota: AiQuotaDTO } }>("/ai/quota");
    return res.data.data.quota;
  },
};
