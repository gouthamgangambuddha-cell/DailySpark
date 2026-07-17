const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#contact" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper py-14 dark:border-white/10 dark:bg-ink">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold text-ink dark:text-paper">
              <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-spark-500" />
              DailySpark
            </a>
            <p className="mt-3 max-w-[220px] text-sm text-ink/60 dark:text-paper/60">
              Five minutes a day. A lifetime of small, compounding sparks.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink/40 dark:text-paper/40">
                {col.title}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink/70 hover:text-ink dark:text-paper/70 dark:hover:text-paper"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-ink/10 pt-6 text-xs text-ink/40 dark:border-white/10 dark:text-paper/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} DailySpark. All rights reserved.</p>
          <p className="font-mono">Built one spark at a time.</p>
        </div>
      </div>
    </footer>
  );
}
