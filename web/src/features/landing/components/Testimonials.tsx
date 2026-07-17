import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "I've tried five habit apps this year. This is the first one where the habit is actually learning something, not just checking a box.",
    name: "Priya N.",
    role: "127-day streak",
  },
  {
    quote:
      "The quizzes are short enough that I actually finish them on my coffee break, and I remember more from five minutes here than a whole podcast episode.",
    name: "Daniel O.",
    role: "Level 14, Programming track",
  },
  {
    quote:
      "My streak has survived two work trips and a stomach flu. That's the whole pitch, honestly.",
    name: "Marcus T.",
    role: "212-day streak",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-12 max-w-xl">
        <p className="mb-3 font-mono text-sm uppercase tracking-widest text-ember-500">
          From the streak board
        </p>
        <h2 className="font-display text-3xl font-bold text-ink dark:text-paper md:text-4xl">
          Real people, real streaks.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, rotate: -1, y: 16 }}
            whileInView={{ opacity: 1, rotate: i % 2 === 0 ? -1 : 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-[4px_4px_0_0_rgba(20,24,43,0.08)] dark:border-white/10 dark:bg-ink-soft dark:shadow-none"
          >
            <blockquote className="font-display text-lg leading-snug text-ink dark:text-paper">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-paper/50">
              <span className="h-1.5 w-1.5 rounded-full bg-spark-500" />
              {t.name} — {t.role}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
