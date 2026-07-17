interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-paper p-5 dark:border-white/10 dark:bg-ink-soft">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ember-500/10 text-2xl">
        🔥
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-ink dark:text-paper">
          {currentStreak} <span className="text-base font-medium text-ink/50 dark:text-paper/50">day{currentStreak === 1 ? "" : "s"}</span>
        </p>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Longest streak: {longestStreak} day{longestStreak === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
