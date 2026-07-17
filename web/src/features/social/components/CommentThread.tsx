import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { CommentDTO } from "@dailyspark/types";
import { commentsApi } from "../api/commentsApi";
import { useAuth } from "@/features/auth/AuthContext";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
  comment: CommentDTO;
  lessonId: string;
  onChanged: () => void;
  depth?: number;
}

function CommentItem({ comment, lessonId, onChanged, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [liked, setLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);

  const handleReply = async (content: string) => {
    await commentsApi.create(lessonId, { content, parentId: comment.id });
    onChanged();
  };

  const handleLike = async () => {
    if (!user) {
      toast("Log in to like comments.");
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => c + (nextLiked ? 1 : -1));
    try {
      const result = await commentsApi.toggleLike(comment.id);
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    await commentsApi.remove(comment.id);
    onChanged();
  };

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-ink/10 pl-4 dark:border-white/10" : ""}>
      <div className="flex items-start gap-3 py-3">
        {comment.author.avatarUrl ? (
          <img src={comment.author.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spark-500/20 text-xs font-bold text-spark-700 dark:text-spark-300">
            {comment.author.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {comment.isDeleted ? (
              <span className="text-sm font-semibold text-ink/40 dark:text-paper/40">
                {comment.author.name}
              </span>
            ) : (
              <Link
                to={`/users/${comment.author.id}`}
                className="text-sm font-semibold text-ink hover:underline dark:text-paper"
              >
                {comment.author.name}
              </Link>
            )}
            <span className="text-xs text-ink/40 dark:text-paper/40">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p
            className={`mt-0.5 text-sm ${
              comment.isDeleted ? "italic text-ink/40 dark:text-paper/40" : "text-ink/80 dark:text-paper/80"
            }`}
          >
            {comment.content}
          </p>

          {!comment.isDeleted && (
            <div className="mt-1.5 flex items-center gap-4 text-xs font-medium text-ink/50 dark:text-paper/50">
              <button onClick={handleLike} className="flex items-center gap-1 hover:text-ember-500">
                <span aria-hidden>{liked ? "♥" : "♡"}</span> {likesCount}
              </button>
              {depth < 3 && (
                <button onClick={() => setIsReplying((v) => !v)} className="hover:text-ink dark:hover:text-paper">
                  Reply
                </button>
              )}
              {comment.isOwn && (
                <button onClick={handleDelete} className="hover:text-ember-500">
                  Delete
                </button>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-2">
              <CommentForm
                compact
                placeholder={`Reply to ${comment.author.name}...`}
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          lessonId={lessonId}
          onChanged={onChanged}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

interface CommentThreadProps {
  lessonId: string;
  comments: CommentDTO[];
  onChanged: () => void;
}

export function CommentThread({ lessonId, comments, onChanged }: CommentThreadProps) {
  const { user } = useAuth();

  const handleTopLevelComment = async (content: string) => {
    if (!user) {
      toast("Log in to leave a comment.");
      return;
    }
    await commentsApi.create(lessonId, { content });
    onChanged();
  };

  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-bold text-ink dark:text-paper">
        Discussion ({comments.length})
      </h2>

      {user ? (
        <CommentForm onSubmit={handleTopLevelComment} />
      ) : (
        <p className="text-sm text-ink/60 dark:text-paper/60">
          <Link to="/login" className="font-semibold text-spark-700 hover:underline dark:text-spark-300">
            Log in
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      <div className="mt-4 divide-y divide-ink/5 dark:divide-white/5">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/50 dark:text-paper/50">
            No comments yet — be the first to share your thoughts.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} lessonId={lessonId} onChanged={onChanged} />
          ))
        )}
      </div>
    </div>
  );
}
