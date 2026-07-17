import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MatchIllustration } from "./MatchIllustration";
import { SparkTrail } from "./SparkTrail";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-20 pt-16 md:grid-cols-2 md:pt-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 font-mono text-sm uppercase tracking-widest text-ember-500"
          >
            5 minutes a day
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink dark:text-paper md:text-6xl"
          >
            Strike a spark.
            <br />
            Keep it lit.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-md text-lg text-ink/70 dark:text-paper/70"
          >
            One short lesson. One quick quiz. One line on your streak. DailySpark
            turns five spare minutes into a habit of getting smarter — in science,
            history, code, money, and a dozen other things worth knowing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/register"
              className="rounded-xl bg-spark-500 px-6 py-3.5 font-bold text-ink transition hover:bg-spark-600"
            >
              Light your first streak
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-ink/70 underline decoration-ink/20 underline-offset-4 hover:text-ink dark:text-paper/70 dark:hover:text-paper"
            >
              See how it works
            </a>
          </motion.div>

          <div className="mt-10">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink/40 dark:text-paper/40">
              A week, one dot at a time
            </p>
            <SparkTrail count={7} />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="mx-auto h-[320px] w-[260px] md:h-[400px] md:w-[320px]"
        >
          <MatchIllustration />
        </motion.div>
      </div>
    </section>
  );
}
