import { CATEGORIES } from "@dailyspark/types";

interface CategoryFilterProps {
  selected: string | null;
  onChange: (category: string | null) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
          selected === null
            ? "border-spark-500 bg-spark-500 text-ink"
            : "border-ink/20 text-ink/70 hover:border-spark-400 dark:border-white/20 dark:text-paper/70"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            selected === category
              ? "border-spark-500 bg-spark-500 text-ink"
              : "border-ink/20 text-ink/70 hover:border-spark-400 dark:border-white/20 dark:text-paper/70"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
