import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const links = [
  { label: "Lessons", href: "/lessons", isRoute: true },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const navigate = useNavigate();

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    navigate(`/lessons?q=${encodeURIComponent(quickSearch.trim())}`);
    setQuickSearch("");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-paper/90 backdrop-blur dark:border-white/5 dark:bg-ink/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2 font-display text-xl font-bold">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full bg-spark-500"
          />
          DailySpark
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) =>
            link.isRoute ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-ink/70 transition hover:text-ink dark:text-paper/70 dark:hover:text-paper"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink/70 transition hover:text-ink dark:text-paper/70 dark:hover:text-paper"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        <form onSubmit={handleQuickSearch} className="hidden md:block">
          <input
            type="search"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search lessons..."
            className="w-44 rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 text-sm outline-none transition focus:w-56 focus:ring-2 focus:ring-spark-500 dark:border-white/15 dark:bg-ink dark:text-paper"
          />
        </form>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="text-sm font-semibold text-ink/80 hover:text-ink dark:text-paper/80 dark:hover:text-paper"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-spark-500 px-4 py-2 text-sm font-bold text-ink transition hover:bg-spark-600"
          >
            Start free
          </Link>
        </div>

        <button
          className="md:hidden"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
        >
          <div className="flex h-5 w-6 flex-col justify-between">
            <span className="h-0.5 w-full bg-ink dark:bg-paper" />
            <span className="h-0.5 w-full bg-ink dark:bg-paper" />
            <span className="h-0.5 w-full bg-ink dark:bg-paper" />
          </div>
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-ink/5 px-5 py-4 md:hidden dark:border-white/5">
          <div className="flex flex-col gap-4">
            {links.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-ink/80 dark:text-paper/80"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-ink/80 dark:text-paper/80"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="mt-2 flex flex-col gap-3 border-t border-ink/5 pt-4 dark:border-white/5">
              <Link to="/login" className="text-sm font-semibold">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-spark-500 px-4 py-2 text-center text-sm font-bold text-ink"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
