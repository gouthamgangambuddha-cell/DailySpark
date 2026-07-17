import { Link } from "react-router-dom";
import type { LessonSummaryDTO } from "@dailyspark/types";
import { DifficultyBadge } from "./DifficultyBadge";

export function LessonCard({ lesson }: { lesson: LessonSummaryDTO }) {
  return (
    <Link
      to={`/lessons/${lesson.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-ink-soft"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-paper-dim dark:bg-white/5">
        {lesson.imageUrl ? (
          <img
            src={lesson.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="h-3 w-3 rounded-full bg-spark-500" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-ink/50 dark:text-paper/50">
            {lesson.category}
          </span>
          <DifficultyBadge difficulty={lesson.difficulty} />
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-ink dark:text-paper">
          {lesson.title}
        </h3>
        <p className="line-clamp-2 text-sm text-ink/70 dark:text-paper/70">{lesson.summary}</p>

        <div className="mt-auto flex items-center justify-between pt-3 font-mono text-xs text-ink/50 dark:text-paper/50">
          <span>{lesson.estimatedReadingMinutes} min read</span>
          <span className="flex items-center gap-1">
            <span aria-hidden>{lesson.isLiked ? "♥" : "♡"}</span>
            {lesson.likesCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
