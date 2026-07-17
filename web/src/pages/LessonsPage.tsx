import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { lessonsApi } from "@/features/lessons/api/lessonsApi";
import { LessonCard } from "@/features/lessons/components/LessonCard";
import { CategoryFilter } from "@/features/lessons/components/CategoryFilter";
import { Button } from "@/components/ui/Button";
import { Seo } from "@/components/Seo";
import type { LessonSortMode } from "@dailyspark/types";

const SORT_OPTIONS: { value: LessonSortMode; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most liked" },
  { value: "trending", label: "Trending" },
];

export function LessonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<string | null>(searchParams.get("category"));
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState<LessonSortMode>(
    (searchParams.get("sort") as LessonSortMode) ?? "newest"
  );
  const [page, setPage] = useState(1);

  // Debounce the search box so we're not firing a request on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Keep the URL in sync so search results are linkable/shareable.
  useEffect(() => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (debouncedSearch) params.q = debouncedSearch;
    if (sort !== "newest") params.sort = sort;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, debouncedSearch, sort]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["lessons", { category, q: debouncedSearch, sort, page }],
    queryFn: () =>
      lessonsApi.list({
        category: category ?? undefined,
        q: debouncedSearch || undefined,
        sort,
        page,
        limit: 9,
      }),
    placeholderData: keepPreviousData,
  });

  const handleCategoryChange = (next: string | null) => {
    setCategory(next);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Seo
        title="Browse lessons"
        description="Five-minute lessons across science, history, code, money, psychology, and more. Filter by category, search by topic, and find your next spark."
        path="/lessons"
      />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink dark:text-paper">
            Today's lessons
          </h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
            Five minutes each. Pick what sparks your curiosity.
          </p>
        </div>
        <Link to="/">
          <Button variant="secondary">← Home</Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search lessons..."
          className="w-full max-w-sm rounded-xl border border-ink/20 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as LessonSortMode);
            setPage(1);
          }}
          className="rounded-xl border border-ink/20 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-8">
        <CategoryFilter selected={category} onChange={handleCategoryChange} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5"
            />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div
            className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 ${
              isFetching ? "opacity-60" : ""
            }`}
          >
            {data.items.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="font-mono text-sm text-ink/60 dark:text-paper/60">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="py-16 text-center text-ink/60 dark:text-paper/60">
          {debouncedSearch
            ? `No lessons matching "${debouncedSearch}".`
            : "No lessons in this category yet — check back soon."}
        </p>
      )}
    </div>
  );
}
