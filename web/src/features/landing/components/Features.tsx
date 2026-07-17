import { motion } from "framer-motion";

const features = [
  {
    title: "Bite-sized lessons",
    description:
      "Every topic distilled into a five-minute read — with a summary, difficulty level, and audio narration for the commute.",
  },
  {
    title: "Quizzes that stick",
    description:
      "Multiple choice, true/false, fill-in-the-blank, even image questions — with instant feedback and an explanation for every answer.",
  },
  {
    title: "Streaks worth keeping",
    description:
      "Miss a day and the spark goes out. Come back tomorrow and light it again. Simple, visible, honest progress.",
  },
  {
    title: "XP, levels, and badges",
    description:
      "Every lesson and quiz earns XP toward your level. Badges mark the milestones — first streak, first 100 lessons, first perfect quiz.",
  },
  {
    title: "An AI that explains, not just answers",
    description:
      "Stuck on a concept? Ask for a simpler explanation, a flashcard set, or a related lesson — generated on the spot.",
  },
  {
    title: "16 subjects, one habit",
    description:
      "Science, history, programming, finance, psychology, space, and more — pick your interests and we'll shape your daily lineup.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-12 max-w-xl">
        <p className="mb-3 font-mono text-sm uppercase tracking-widest text-ember-500">
          What you get
        </p>
        <h2 className="font-display text-3xl font-bold text-ink dark:text-paper md:text-4xl">
          Everything a five-minute habit needs, nothing it doesn't.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            className="rounded-2xl border border-ink/10 bg-paper-dim/60 p-6 dark:border-white/10 dark:bg-white/5"
          >
            <div className="mb-4 h-1.5 w-8 rounded-full bg-spark-500" />
            <h3 className="mb-2 font-display text-lg font-bold text-ink dark:text-paper">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-ink/70 dark:text-paper/70">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
