interface LevelProgressProps {
  level: number;
  xpIntoCurrentLevel: number;
  xpToNextLevel: number;
}

export function LevelProgress({ level, xpIntoCurrentLevel, xpToNextLevel }: LevelProgressProps) {
  const total = xpIntoCurrentLevel + xpToNextLevel;
  const percent = total > 0 ? Math.round((xpIntoCurrentLevel / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-display text-sm font-bold text-ink dark:text-paper">
          Level {level}
        </span>
        <span className="font-mono text-xs text-ink/50 dark:text-paper/50">
          {xpIntoCurrentLevel}/{total} XP
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-paper-dim dark:bg-white/10">
        <div
          className="h-full rounded-full bg-spark-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
