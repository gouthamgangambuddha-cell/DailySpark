import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import { lessonsApi } from "../api/lessonsApi";

interface LessonActionsProps {
  lessonId: string;
  initialLiked: boolean;
  initialLikesCount: number;
  initialBookmarked: boolean;
}

export function LessonActions({
  lessonId,
  initialLiked,
  initialLikesCount,
  initialBookmarked,
}: LessonActionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const requireAuth = () => {
    if (!user) {
      toast("Log in to save your progress on lessons.");
      navigate("/login", { state: { from: window.location.pathname } });
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!requireAuth() || isLiking) return;
    setIsLiking(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => c + (nextLiked ? 1 : -1));
    try {
      const result = await lessonsApi.toggleLike(lessonId);
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
      toast.error("Could not update like. Please try again.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!requireAuth() || isBookmarking) return;
    setIsBookmarking(true);
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    try {
      const result = await lessonsApi.toggleBookmark(lessonId);
      setBookmarked(result.bookmarked);
      toast.success(result.bookmarked ? "Saved to your bookmarks" : "Removed from bookmarks");
    } catch {
      setBookmarked(bookmarked);
      toast.error("Could not update bookmark. Please try again.");
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleLike}
        disabled={isLiking}
        aria-pressed={liked}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
          liked
            ? "border-ember-500 bg-ember-500/10 text-ember-600 dark:text-ember-400"
            : "border-ink/20 text-ink/70 hover:border-ember-400 dark:border-white/20 dark:text-paper/70"
        }`}
      >
        <span aria-hidden>{liked ? "♥" : "♡"}</span>
        {likesCount}
      </button>

      <button
        onClick={handleBookmark}
        disabled={isBookmarking}
        aria-pressed={bookmarked}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
          bookmarked
            ? "border-spark-500 bg-spark-500/15 text-spark-700 dark:text-spark-300"
            : "border-ink/20 text-ink/70 hover:border-spark-400 dark:border-white/20 dark:text-paper/70"
        }`}
      >
        <span aria-hidden>{bookmarked ? "🔖" : "🏷"}</span>
        {bookmarked ? "Saved" : "Save"}
      </button>
    </div>
  );
}
