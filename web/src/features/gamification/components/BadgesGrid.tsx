import type { BadgeDTO } from "@dailyspark/types";

export function BadgesGrid({ badges }: { badges: BadgeDTO[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {badges.map((badge) => (
        <div
          key={badge.code}
          title={badge.description}
          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
            badge.earned
              ? "border-spark-500/40 bg-spark-500/10"
              : "border-ink/10 bg-paper-dim/60 opacity-40 grayscale dark:border-white/10 dark:bg-white/5"
          }`}
        >
          <span className="text-2xl">{badge.icon}</span>
          <span className="text-xs font-semibold text-ink dark:text-paper">{badge.name}</span>
        </div>
      ))}
    </div>
  );
}
