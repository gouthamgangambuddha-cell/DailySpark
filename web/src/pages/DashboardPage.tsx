import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import { gamificationApi } from "@/features/gamification/api/gamificationApi";
import { LevelProgress } from "@/features/gamification/components/LevelProgress";
import { StreakDisplay } from "@/features/gamification/components/StreakDisplay";
import { BadgesGrid } from "@/features/gamification/components/BadgesGrid";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { aiApi } from "@/features/ai/api/aiApi";
import { LessonCard } from "@/features/lessons/components/LessonCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Welcome to Premium! 🎉");
      queryClient.invalidateQueries({ queryKey: ["payments", "subscription"] });
      setSearchParams({}, { replace: true });
    } else if (checkout === "canceled") {
      toast("Checkout canceled — no charge was made.");
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["gamification", "me"],
    queryFn: gamificationApi.getMySummary,
  });

  const { data: recommendations, isLoading: isLoadingRecs } = useQuery({
    queryKey: ["ai", "recommendations"],
    queryFn: aiApi.getRecommendations,
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-paper">
            Welcome back, {user?.name} 👋
          </h1>
          {!user?.emailVerified && (
            <p className="mt-1 text-sm text-ember-500">
              Please check your inbox to verify your email.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="secondary" onClick={() => logout()}>
            Log out
          </Button>
        </div>
      </div>

      {isLoading || !summary ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5" />
          <div className="h-28 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Card>
              <LevelProgress
                level={summary.level}
                xpIntoCurrentLevel={summary.xpIntoCurrentLevel}
                xpToNextLevel={summary.xpToNextLevel}
              />
              <p className="mt-3 font-mono text-xs text-ink/50 dark:text-paper/50">
                {summary.totalXp} total XP
              </p>
            </Card>
            <StreakDisplay
              currentStreak={summary.currentStreak}
              longestStreak={summary.longestStreak}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Card className="text-center">
              <p className="font-display text-2xl font-bold text-ink dark:text-paper">
                {summary.lessonsCompleted}
              </p>
              <p className="text-xs text-ink/50 dark:text-paper/50">Lessons done</p>
            </Card>
            <Card className="text-center">
              <p className="font-display text-2xl font-bold text-ink dark:text-paper">
                {summary.quizzesCompleted}
              </p>
              <p className="text-xs text-ink/50 dark:text-paper/50">Quizzes done</p>
            </Card>
            <Card className="col-span-2 text-center sm:col-span-2">
              <p className="font-display text-2xl font-bold text-ink dark:text-paper">
                {summary.badges.filter((b) => b.earned).length}/{summary.badges.length}
              </p>
              <p className="text-xs text-ink/50 dark:text-paper/50">Badges earned</p>
            </Card>
          </div>

          <Card className="mt-5">
            <h2 className="mb-4 font-display text-lg font-bold text-ink dark:text-paper">
              Badges
            </h2>
            <BadgesGrid badges={summary.badges} />
          </Card>
        </>
      )}

      <div className="mt-5">
        <h2 className="mb-4 font-display text-lg font-bold text-ink dark:text-paper">
          Suggested for you
        </h2>
        {isLoadingRecs ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5" />
            ))}
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recommendations.slice(0, 3).map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Like a few lessons and we'll start tailoring suggestions to you.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/lessons">
          <Button>Browse lessons</Button>
        </Link>
        <Link to="/leaderboard">
          <Button variant="secondary">Leaderboard</Button>
        </Link>
        <Link to="/feed">
          <Button variant="secondary">Activity</Button>
        </Link>
        <Link to="/profile">
          <Button variant="secondary">Edit profile</Button>
        </Link>
        {user?.role === "ADMIN" && (
          <Link to="/admin">
            <Button variant="secondary">Admin</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
