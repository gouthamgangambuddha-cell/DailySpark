import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "@/features/social/api/socialApi";
import { Button } from "@/components/ui/Button";

const iconByType: Record<string, string> = {
  LESSON_LIKED: "♥",
  LESSON_BOOKMARKED: "🔖",
  QUIZ_COMPLETED: "🎯",
  BADGE_EARNED: "🏅",
  STARTED_FOLLOWING: "➕",
};

export function ActivityFeedPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ["social", "feed"],
    queryFn: socialApi.getFeed,
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink dark:text-paper">Activity</h1>
        <Link to="/dashboard">
          <Button variant="secondary">← Dashboard</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-paper-dim dark:bg-white/5" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <p className="py-16 text-center text-ink/60 dark:text-paper/60">
          Follow other learners to see their activity here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-ink/10 bg-paper p-4 dark:border-white/10 dark:bg-ink-soft"
            >
              <span className="text-lg" aria-hidden>
                {iconByType[item.type] ?? "•"}
              </span>
              <div className="flex-1">
                <p className="text-sm text-ink/80 dark:text-paper/80">
                  <Link
                    to={`/users/${item.actor.id}`}
                    className="font-semibold text-ink hover:underline dark:text-paper"
                  >
                    {item.actor.name}
                  </Link>{" "}
                  {item.message}
                </p>
                <p className="mt-0.5 text-xs text-ink/40 dark:text-paper/40">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              {item.lessonSlug && (
                <Link
                  to={`/lessons/${item.lessonSlug}`}
                  className="shrink-0 text-xs font-semibold text-spark-700 hover:underline dark:text-spark-300"
                >
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
