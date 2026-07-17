import { Link } from "react-router-dom";
import type { QuizResultDTO, QuizForAttemptDTO } from "@dailyspark/types";
import { Button } from "@/components/ui/Button";

interface ResultsSummaryProps {
  quiz: QuizForAttemptDTO;
  result: QuizResultDTO;
  lessonSlug: string;
}

export function ResultsSummary({ quiz, result, lessonSlug }: ResultsSummaryProps) {
  const percent = Math.round((result.score / result.totalQuestions) * 100);

  return (
    <div>
      <div className="rounded-2xl border border-ink/10 bg-paper-dim/60 p-8 text-center dark:border-white/10 dark:bg-white/5">
        <p className="font-mono text-sm uppercase tracking-widest text-ember-500">
          Quiz complete
        </p>
        <p className="mt-2 font-display text-5xl font-extrabold text-ink dark:text-paper">
          {result.score}/{result.totalQuestions}
        </p>
        <p className="mt-1 text-ink/60 dark:text-paper/60">{percent}% correct</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-spark-500 px-4 py-1.5 font-mono text-sm font-bold text-ink">
          +{result.xpEarned} XP
        </p>

        {result.gamification?.leveledUp && (
          <p className="mt-4 font-display text-lg font-bold text-ember-500">
            🎉 Level up! You're now level {result.gamification.level}
          </p>
        )}

        {result.gamification?.currentStreak !== undefined && result.gamification.currentStreak > 1 && (
          <p className="mt-2 font-mono text-sm text-ink/60 dark:text-paper/60">
            🔥 {result.gamification.currentStreak}-day streak
          </p>
        )}

        {result.gamification && result.gamification.newBadges.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {result.gamification.newBadges.map((badge) => (
              <div
                key={badge.code}
                title={badge.description}
                className="flex items-center gap-2 rounded-full border border-spark-500/40 bg-spark-500/10 px-3 py-1.5"
              >
                <span className="text-lg">{badge.icon}</span>
                <span className="text-xs font-semibold text-ink dark:text-paper">
                  New: {badge.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-5">
        {quiz.questions.map((question) => {
          const questionResult = result.results.find((r) => r.questionId === question.id);
          if (!questionResult) return null;

          return (
            <div
              key={question.id}
              className={`rounded-xl border p-5 ${
                questionResult.correct
                  ? "border-teal-500/30 bg-teal-500/5"
                  : "border-ember-500/30 bg-ember-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-display font-semibold text-ink dark:text-paper">
                  {question.prompt}
                </p>
                <span
                  aria-hidden
                  className={`shrink-0 text-lg ${
                    questionResult.correct ? "text-teal-500" : "text-ember-500"
                  }`}
                >
                  {questionResult.correct ? "✓" : "✕"}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
                {questionResult.explanation}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <Link to={`/lessons/${lessonSlug}`}>
          <Button variant="secondary">Back to lesson</Button>
        </Link>
        <Link to="/lessons">
          <Button>More lessons</Button>
        </Link>
      </div>
    </div>
  );
}
