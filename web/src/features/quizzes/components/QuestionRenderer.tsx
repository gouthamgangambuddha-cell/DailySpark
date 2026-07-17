import type { QuestionForAttemptDTO } from "@dailyspark/types";

interface QuestionRendererProps {
  question: QuestionForAttemptDTO;
  index: number;
  total: number;
  selectedOptionId?: string;
  fillAnswer?: string;
  onSelectOption: (optionId: string) => void;
  onFillAnswerChange: (value: string) => void;
}

export function QuestionRenderer({
  question,
  index,
  total,
  selectedOptionId,
  fillAnswer,
  onSelectOption,
  onFillAnswerChange,
}: QuestionRendererProps) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink/50 dark:text-paper/50">
        Question {index + 1} of {total}
      </p>

      {question.type === "IMAGE" && question.imageUrl && (
        <img
          src={question.imageUrl}
          alt=""
          className="mb-4 aspect-[16/9] w-full rounded-xl object-cover"
        />
      )}

      <h2 className="mb-5 font-display text-xl font-bold text-ink dark:text-paper">
        {question.prompt}
      </h2>

      {question.type === "FILL_BLANK" ? (
        <input
          type="text"
          value={fillAnswer ?? ""}
          onChange={(e) => onFillAnswerChange(e.target.value)}
          placeholder="Type your answer..."
          className="w-full rounded-xl border border-ink/20 px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectOption(option.id)}
                aria-pressed={isSelected}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  isSelected
                    ? "border-spark-500 bg-spark-500/15 text-ink dark:text-paper"
                    : "border-ink/20 text-ink/80 hover:border-spark-400 dark:border-white/20 dark:text-paper/80"
                }`}
              >
                {option.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
