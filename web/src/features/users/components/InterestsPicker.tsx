import { CATEGORIES } from "@dailyspark/types";

interface InterestsPickerProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

export function InterestsPicker({ selected, onChange }: InterestsPickerProps) {
  const toggle = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => {
        const isActive = selected.includes(category);
        return (
          <button
            key={category}
            type="button"
            onClick={() => toggle(category)}
            aria-pressed={isActive}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              isActive
                ? "border-brand-500 bg-spark-500 text-white"
                : "border-ink/20 bg-paper text-ink/80 hover:border-brand-400 dark:border-white/20 dark:bg-ink dark:text-paper/80"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
