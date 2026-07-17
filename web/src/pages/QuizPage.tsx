import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { lessonsApi } from "@/features/lessons/api/lessonsApi";
import { quizzesApi } from "@/features/quizzes/api/quizzesApi";
import { QuestionRenderer } from "@/features/quizzes/components/QuestionRenderer";
import { ResultsSummary } from "@/features/quizzes/components/ResultsSummary";
import { useCountdown } from "@/features/quizzes/components/useCountdown";
import { Button } from "@/components/ui/Button";
import type { AnswerSubmissionDTO, QuizResultDTO } from "@dailyspark/types";

export function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerSubmissionDTO>>({});
  const [result, setResult] = useState<QuizResultDTO | null>(null);
  const [startedAt] = useState(() => Date.now());

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ["lessons", slug],
    queryFn: () => lessonsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const {
    data: quiz,
    isLoading: quizLoading,
    isError: quizError,
  } = useQuery({
    queryKey: ["quiz", lesson?.id],
    queryFn: () => quizzesApi.getForLesson(lesson!.id),
    enabled: !!lesson?.id,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
      return quizzesApi.submit(quiz!.id, {
        answers: Object.values(answers),
        timeTakenSeconds,
      });
    },
    onSuccess: (data) => setResult(data),
    onError: () => toast.error("Could not submit your quiz. Please try again."),
  });

  const { formatted, secondsLeft } = useCountdown(quiz?.timeLimitSeconds ?? null, () => {
    if (!result && !submitMutation.isPending) {
      toast("Time's up! Submitting your answers...");
      submitMutation.mutate();
    }
  });

  const currentQuestion = quiz?.questions[currentIndex];
  const isLastQuestion = quiz ? currentIndex === quiz.questions.length - 1 : false;
  const hasAnsweredCurrent = useMemo(() => {
    if (!currentQuestion) return false;
    const a = answers[currentQuestion.id];
    return currentQuestion.type === "FILL_BLANK" ? !!a?.fillAnswer?.trim() : !!a?.selectedOptionId;
  }, [answers, currentQuestion]);

  if (lessonLoading || quizLoading) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <div className="h-6 w-1/2 animate-pulse rounded bg-paper-dim dark:bg-white/5" />
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-paper-dim dark:bg-white/5" />
      </div>
    );
  }

  if (quizError || !quiz || !lesson) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-paper">
          No quiz here yet
        </h1>
        <p className="mt-2 text-ink/60 dark:text-paper/60">
          This lesson doesn't have a quiz attached.
        </p>
        <Link
          to={slug ? `/lessons/${slug}` : "/lessons"}
          className="mt-6 inline-block font-semibold text-spark-700 hover:underline dark:text-spark-300"
        >
          ← Back to lesson
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <ResultsSummary quiz={quiz} result={result} lessonSlug={lesson.slug} />
      </div>
    );
  }

  const setOptionAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, selectedOptionId: optionId } }));
  };

  const setFillAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, fillAnswer: value } }));
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-paper">{quiz.title}</h1>
        {quiz.timeLimitSeconds !== null && (
          <span
            className={`font-mono text-sm font-bold ${
              secondsLeft <= 10 ? "text-ember-500" : "text-ink/60 dark:text-paper/60"
            }`}
          >
            {formatted}
          </span>
        )}
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-paper-dim dark:bg-white/10">
        <div
          className="h-full bg-spark-500 transition-all"
          style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {currentQuestion && (
        <QuestionRenderer
          question={currentQuestion}
          index={currentIndex}
          total={quiz.questions.length}
          selectedOptionId={answers[currentQuestion.id]?.selectedOptionId}
          fillAnswer={answers[currentQuestion.id]?.fillAnswer}
          onSelectOption={(optionId) => setOptionAnswer(currentQuestion.id, optionId)}
          onFillAnswerChange={(value) => setFillAnswer(currentQuestion.id, value)}
        />
      )}

      <div className="mt-8 flex justify-between">
        <Button
          variant="secondary"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>

        {isLastQuestion ? (
          <Button
            disabled={!hasAnsweredCurrent}
            isLoading={submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            Submit quiz
          </Button>
        ) : (
          <Button
            disabled={!hasAnsweredCurrent}
            onClick={() => setCurrentIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
