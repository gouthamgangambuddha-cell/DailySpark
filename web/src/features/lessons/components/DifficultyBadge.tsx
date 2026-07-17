import type { Difficulty } from "@dailyspark/types";

const stylesByDifficulty: Record<Difficulty, string> = {
  BEGINNER: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  INTERMEDIATE: "bg-spark-500/15 text-spark-700 dark:text-spark-300",
  ADVANCED: "bg-ember-500/10 text-ember-600 dark:text-ember-400",
};

const labels: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wide ${stylesByDifficulty[difficulty]}`}
    >
      {labels[difficulty]}
    </span>
  );
}
