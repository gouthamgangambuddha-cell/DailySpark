import { useState } from "react";

const faqs = [
  {
    question: "How long does a lesson actually take?",
    answer:
      "About five minutes to read, plus a minute or two for the quiz. Every lesson shows its estimated reading time up front so you know what you're signing up for.",
  },
  {
    question: "What happens if I miss a day?",
    answer:
      "Your streak resets to zero — we won't pretend otherwise. But your XP, level, badges, and lesson history stay exactly as you left them. You just start a new streak the next time you show up.",
  },
  {
    question: "Can I use DailySpark on my phone during a commute?",
    answer:
      "Yes. Every lesson has audio narration, and Premium adds offline mode so you can queue up lessons before you lose signal.",
  },
  {
    question: "Is the content fact-checked?",
    answer:
      "Every lesson lists its author and references. We also support community reporting on any lesson or comment that looks wrong or out of date.",
  },
  {
    question: "Can I cancel Premium anytime?",
    answer:
      "Yes, from your account settings, no phone call required. You'll keep Premium access until the end of your current billing period.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
      <div className="mb-10">
        <p className="mb-3 font-mono text-sm uppercase tracking-widest text-ember-500">
          Questions
        </p>
        <h2 className="font-display text-3xl font-bold text-ink dark:text-paper md:text-4xl">
          Good to know before you start.
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-ink/10 dark:divide-white/10">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={faq.question} className="py-4">
              <button
                className="flex w-full items-center justify-between gap-4 text-left"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="font-display font-semibold text-ink dark:text-paper">
                  {faq.question}
                </span>
                <span
                  aria-hidden
                  className={`shrink-0 text-xl text-spark-600 transition-transform dark:text-spark-500 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <p
                  id={`faq-answer-${i}`}
                  className="mt-3 text-sm leading-relaxed text-ink/70 dark:text-paper/70"
                >
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
