import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { gamificationApi } from "@/features/gamification/api/gamificationApi";
import { Button } from "@/components/ui/Button";
import type { LeaderboardScope } from "@dailyspark/types";

export function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>("allTime");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", scope],
    queryFn: () => gamificationApi.getLeaderboard(scope),
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink dark:text-paper">Leaderboard</h1>
        <Link to="/dashboard">
          <Button variant="secondary">← Dashboard</Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setScope("allTime")}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
            scope === "allTime"
              ? "border-spark-500 bg-spark-500 text-ink"
              : "border-ink/20 text-ink/70 dark:border-white/20 dark:text-paper/70"
          }`}
        >
          All time
        </button>
        <button
          onClick={() => setScope("weekly")}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
            scope === "weekly"
              ? "border-spark-500 bg-spark-500 text-ink"
              : "border-ink/20 text-ink/70 dark:border-white/20 dark:text-paper/70"
          }`}
        >
          This week
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-paper-dim dark:bg-white/5" />
          ))}
        </div>
      ) : !data || data.entries.length === 0 ? (
        <p className="py-16 text-center text-ink/60 dark:text-paper/60">
          No activity yet {scope === "weekly" ? "this week" : ""} — be the first to spark a streak.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.entries.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 rounded-xl border p-4 ${
                entry.isCurrentUser
                  ? "border-spark-500 bg-spark-500/10"
                  : "border-ink/10 bg-paper dark:border-white/10 dark:bg-ink-soft"
              }`}
            >
              <span className="w-6 text-center font-mono font-bold text-ink/50 dark:text-paper/50">
                {entry.rank}
              </span>
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt="" className="h-9 w-9 rounded-full" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-spark-500/20 text-sm font-bold text-spark-700 dark:text-spark-300">
                  {entry.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-ink dark:text-paper">
                  {entry.name} {entry.isCurrentUser && <span className="text-spark-600 dark:text-spark-400">(you)</span>}
                </p>
                <p className="text-xs text-ink/50 dark:text-paper/50">Level {entry.level}</p>
              </div>
              <span className="font-mono font-bold text-ink dark:text-paper">{entry.xp} XP</span>
            </div>
          ))}

          {data.currentUserRank && !data.entries.some((e) => e.isCurrentUser) && (
            <>
              <div className="my-1 text-center text-ink/30 dark:text-paper/30">⋯</div>
              <div className="flex items-center gap-4 rounded-xl border border-spark-500 bg-spark-500/10 p-4">
                <span className="w-6 text-center font-mono font-bold text-ink/50 dark:text-paper/50">
                  {data.currentUserRank.rank}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-spark-500/20 text-sm font-bold text-spark-700 dark:text-spark-300">
                  {data.currentUserRank.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink dark:text-paper">
                    {data.currentUserRank.name}{" "}
                    <span className="text-spark-600 dark:text-spark-400">(you)</span>
                  </p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">
                    Level {data.currentUserRank.level}
                  </p>
                </div>
                <span className="font-mono font-bold text-ink dark:text-paper">
                  {data.currentUserRank.xp} XP
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
