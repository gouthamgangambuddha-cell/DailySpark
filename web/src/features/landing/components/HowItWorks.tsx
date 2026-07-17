import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Pick your interests",
    description:
      "Science, code, history, money — choose the subjects you actually want to get sharper in.",
  },
  {
    number: "02",
    title: "Read today's spark",
    description:
      "One lesson, five minutes, written to be understood — not skimmed and forgotten.",
  },
  {
    number: "03",
    title: "Answer the quiz",
    description:
      "A handful of questions lock in what you just read, with the reasoning behind every answer.",
  },
  {
    number: "04",
    title: "Keep the streak lit",
    description:
      "Come back tomorrow. Watch your streak, XP, and level climb — one small session at a time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-ink py-20 text-paper dark:bg-white/5">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-14 max-w-xl">
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-spark-500">
            How it works
          </p>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Four small steps. Repeated daily, they add up fast.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <p className="mb-4 font-mono text-4xl font-bold text-paper/20">{step.number}</p>
              <h3 className="mb-2 font-display text-lg font-bold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-paper/70">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="mt-6 hidden h-px w-full bg-gradient-to-r from-spark-500/40 to-transparent md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
