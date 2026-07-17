import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { socialApi } from "@/features/social/api/socialApi";
import { useAuth } from "@/features/auth/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: viewer } = useAuth();
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => socialApi.getProfile(userId!),
    enabled: !!userId,
  });

  const handleFollow = async () => {
    if (!viewer) {
      toast("Log in to follow other learners.");
      return;
    }
    setIsFollowLoading(true);
    try {
      await socialApi.toggleFollow(userId!);
      await refetch();
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <div className="h-32 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <Link to="/lessons" className="text-sm font-medium text-ink/60 hover:text-ink dark:text-paper/60">
        ← Back
      </Link>

      <Card className="mt-6 text-center">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-spark-500/20 text-2xl font-bold text-spark-700 dark:text-spark-300">
            {profile.name[0]?.toUpperCase()}
          </div>
        )}
        <h1 className="mt-4 font-display text-2xl font-bold text-ink dark:text-paper">
          {profile.name}
        </h1>
        {profile.bio && <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">{profile.bio}</p>}

        <div className="mt-4 flex justify-center gap-6 font-mono text-sm text-ink/60 dark:text-paper/60">
          <span>
            <strong className="text-ink dark:text-paper">{profile.followersCount}</strong> followers
          </span>
          <span>
            <strong className="text-ink dark:text-paper">{profile.followingCount}</strong> following
          </span>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <span className="rounded-full bg-spark-500/15 px-3 py-1 text-xs font-bold text-spark-700 dark:text-spark-300">
            Level {profile.level}
          </span>
          <span className="rounded-full bg-ember-500/10 px-3 py-1 text-xs font-bold text-ember-600 dark:text-ember-400">
            🔥 {profile.currentStreak} day streak
          </span>
        </div>

        {!profile.isOwnProfile && (
          <Button
            className="mt-6"
            variant={profile.isFollowedByViewer ? "secondary" : "primary"}
            isLoading={isFollowLoading}
            onClick={handleFollow}
          >
            {profile.isFollowedByViewer ? "Following" : "Follow"}
          </Button>
        )}

        <p className="mt-4 text-xs text-ink/40 dark:text-paper/40">
          Member since {new Date(profile.memberSince).toLocaleDateString()}
        </p>
      </Card>
    </div>
  );
}
