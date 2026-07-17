export interface ExplainRequestDTO {
  lessonId: string;
  question: string;
}

export interface ExplainResponseDTO {
  answer: string;
  remainingToday: number | null; // null = unlimited (premium)
}

export interface FlashcardDTO {
  front: string;
  back: string;
}

export interface GenerateFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
  remainingToday: number | null;
}

export interface PracticeQuestionDTO {
  question: string;
  answer: string;
}

export interface GeneratePracticeQuestionsResponseDTO {
  questions: PracticeQuestionDTO[];
  remainingToday: number | null;
}

export interface TranslateLessonRequestDTO {
  lessonId: string;
  targetLanguage: string;
}

export interface TranslateLessonResponseDTO {
  title: string;
  summary: string;
  content: string;
  remainingToday: number | null;
}

export interface AiQuotaDTO {
  used: number;
  limit: number | null;
  remaining: number | null;
}
