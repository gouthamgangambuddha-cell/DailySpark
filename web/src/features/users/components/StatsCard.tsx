import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/usersApi";
import { Card } from "@/components/ui/Card";

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-ink dark:text-paper">{value}</p>
      <p className="text-sm text-ink/60 dark:text-paper/60">{label}</p>
    </div>
  );
}

export function StatsCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["users", "me", "stats"],
    queryFn: usersApi.getStats,
  });

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-ink dark:text-paper">
        Your statistics
      </h2>

      {isLoading || !stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-ink/5 dark:bg-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="Day streak" value={stats.currentStreak} />
          <StatBlock label="Total XP" value={stats.totalXp} />
          <StatBlock label="Lessons done" value={stats.lessonsCompleted} />
          <StatBlock label="Days as a member" value={stats.daysSinceJoining} />
        </div>
      )}
    </Card>
  );
}
