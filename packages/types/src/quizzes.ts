export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "IMAGE";

export interface QuestionOptionDTO {
  id: string;
  text: string;
  order: number;
}

/** A question as shown to someone *taking* the quiz — no correct-answer info. */
export interface QuestionForAttemptDTO {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl: string | null;
  order: number;
  options: QuestionOptionDTO[]; // empty for FILL_BLANK
}

/** A quiz as shown to someone about to take it. */
export interface QuizForAttemptDTO {
  id: string;
  lessonId: string;
  title: string;
  timeLimitSeconds: number | null;
  xpReward: number;
  questions: QuestionForAttemptDTO[];
}

export interface AnswerSubmissionDTO {
  questionId: string;
  selectedOptionId?: string; // MULTIPLE_CHOICE / TRUE_FALSE / IMAGE
  fillAnswer?: string; // FILL_BLANK
}

export interface SubmitQuizRequestDTO {
  answers: AnswerSubmissionDTO[];
  timeTakenSeconds?: number;
}

export interface QuestionResultDTO {
  questionId: string;
  correct: boolean;
  explanation: string;
  correctOptionId: string | null; // for option-based questions
  correctFillAnswers: string[]; // for FILL_BLANK
}

export interface QuizResultDTO {
  attemptId: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  timeTakenSeconds: number | null;
  results: QuestionResultDTO[];
  // Populated once the gamification module (Step 7) is wired in; optional
  // here so this file has no import dependency on gamification.ts.
  gamification?: import("./gamification").GamificationDeltaDTO;
}

// --- Admin authoring shapes ---

export interface CreateQuestionOptionDTO {
  text: string;
  isCorrect: boolean;
}

export interface CreateQuestionDTO {
  type: QuestionType;
  prompt: string;
  imageUrl?: string;
  explanation: string;
  options?: CreateQuestionOptionDTO[]; // required for MULTIPLE_CHOICE/TRUE_FALSE/IMAGE
  correctFillAnswers?: string[]; // required for FILL_BLANK
}

export interface CreateQuizRequestDTO {
  title: string;
  timeLimitSeconds?: number;
  xpReward?: number;
  questions: CreateQuestionDTO[];
}
