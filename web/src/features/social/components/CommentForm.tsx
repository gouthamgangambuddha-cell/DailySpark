import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  compact?: boolean;
  onCancel?: () => void;
}

export function CommentForm({ onSubmit, placeholder, compact, onCancel }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
      onCancel?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? "Share your thoughts..."}
        rows={compact ? 2 : 3}
        maxLength={1000}
        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
      />
      <div className="flex gap-2 self-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting} disabled={!content.trim()}>
          {compact ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
