import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { lessonsApi } from "@/features/lessons/api/lessonsApi";
import { DifficultyBadge } from "@/features/lessons/components/DifficultyBadge";
import { LessonActions } from "@/features/lessons/components/LessonActions";
import { commentsApi } from "@/features/social/api/commentsApi";
import { socialApi } from "@/features/social/api/socialApi";
import { CommentThread } from "@/features/social/components/CommentThread";
import { AiPanel } from "@/features/ai/components/AiPanel";
import { useAuth } from "@/features/auth/AuthContext";
import { Seo } from "@/components/Seo";

export function LessonDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const {
    data: lesson,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["lessons", slug],
    queryFn: () => lessonsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const {
    data: comments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["comments", lesson?.id],
    queryFn: () => commentsApi.list(lesson!.id),
    enabled: !!lesson?.id,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: lesson?.title, url });
      } catch {
        // user cancelled the share sheet — no action needed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleReport = async () => {
    if (!user) {
      toast("Log in to report a lesson.");
      return;
    }
    if (!lesson) return;
    const reason = window.prompt("Tell us what's wrong with this lesson:");
    if (!reason || reason.trim().length < 5) return;
    try {
      await socialApi.createReport({ targetType: "LESSON", targetId: lesson.id, reason: reason.trim() });
      toast.success("Report submitted. Thank you.");
    } catch {
      toast.error("Could not submit report.");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <div className="h-8 w-2/3 animate-pulse rounded bg-paper-dim dark:bg-white/5" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-paper-dim dark:bg-white/5" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-paper-dim dark:bg-white/5" />
      </div>
    );
  }

  if (isError || !lesson) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-paper">
          Lesson not found
        </h1>
        <p className="mt-2 text-ink/60 dark:text-paper/60">
          This lesson may have been removed or the link is incorrect.
        </p>
        <Link
          to="/lessons"
          className="mt-6 inline-block font-semibold text-spark-700 hover:underline dark:text-spark-300"
        >
          ← Back to all lessons
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-2xl px-5 py-10">
      <Seo
        title={lesson.title}
        description={lesson.summary}
        path={`/lessons/${lesson.slug}`}
        image={lesson.imageUrl ?? undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: lesson.title,
          description: lesson.summary,
          image: lesson.imageUrl ?? undefined,
          author: { "@type": "Person", name: lesson.author.name },
          datePublished: lesson.publishedAt ?? undefined,
          articleSection: lesson.category,
        }}
      />
      <div className="flex items-center justify-between">
        <Link
          to="/lessons"
          className="text-sm font-medium text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper"
        >
          ← All lessons
        </Link>
        <div className="flex gap-4 text-sm font-medium text-ink/50 dark:text-paper/50">
          <button onClick={handleShare} className="hover:text-ink dark:hover:text-paper">
            Share
          </button>
          <button onClick={handleReport} className="hover:text-ember-500">
            Report
          </button>
        </div>
      </div>

      {lesson.imageUrl && (
        <img
          src={lesson.imageUrl}
          alt=""
          fetchPriority="high"
          className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-ink/50 dark:text-paper/50">
          {lesson.category}
        </span>
        <DifficultyBadge difficulty={lesson.difficulty} />
        <span className="font-mono text-xs text-ink/50 dark:text-paper/50">
          {lesson.estimatedReadingMinutes} min read
        </span>
      </div>

      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink dark:text-paper md:text-4xl">
        {lesson.title}
      </h1>

      <p className="mt-3 text-lg text-ink/70 dark:text-paper/70">{lesson.summary}</p>

      <Link
        to={`/users/${lesson.author.id}`}
        className="mt-4 flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper"
      >
        {lesson.author.avatarUrl && (
          <img src={lesson.author.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
        )}
        By {lesson.author.name}
      </Link>

      {lesson.audioUrl && (
        <audio controls src={lesson.audioUrl} className="mt-6 w-full">
          Your browser does not support audio playback.
        </audio>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {lesson.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-paper-dim px-3 py-1 text-xs text-ink/60 dark:bg-white/5 dark:text-paper/60"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-ink dark:text-paper">
        {lesson.content}
      </div>

      {lesson.references.length > 0 && (
        <div className="mt-10 border-t border-ink/10 pt-6 dark:border-white/10">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink/50 dark:text-paper/50">
            References
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-ink/70 dark:text-paper/70">
            {lesson.references.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 border-t border-ink/10 pt-6 dark:border-white/10">
        <Link
          to={`/lessons/${lesson.slug}/quiz`}
          className="inline-flex items-center gap-2 rounded-xl bg-spark-500 px-5 py-3 font-bold text-ink transition hover:bg-spark-600"
        >
          Take the quiz →
        </Link>
      </div>

      <div className="mt-4 border-t border-ink/10 pt-6 dark:border-white/10">
        <LessonActions
          lessonId={lesson.id}
          initialLiked={lesson.isLiked}
          initialLikesCount={lesson.likesCount}
          initialBookmarked={lesson.isBookmarked}
        />
      </div>

      <div className="mt-6 border-t border-ink/10 pt-6 dark:border-white/10">
        <AiPanel lessonId={lesson.id} />
      </div>

      <div className="mt-10 border-t border-ink/10 pt-6 dark:border-white/10">
        <CommentThread
          lessonId={lesson.id}
          comments={comments ?? []}
          onChanged={() => refetchComments()}
        />
      </div>
    </article>
  );
}
