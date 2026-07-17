import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import { paymentsApi } from "@/features/payments/api/paymentsApi";

const freeFeatures = [
  "One lesson + quiz a day",
  "Streaks, XP, and levels",
  "16 subject categories",
  "Community leaderboard",
];

const premiumFeatures = [
  "Unlimited lessons & AI explanations",
  "Ad-free, offline mode",
  "Exclusive lessons & premium badges",
  "Advanced stats & priority support",
];

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoPremium = async () => {
    if (!user) {
      navigate("/register", { state: { from: "/#pricing" } });
      return;
    }
    try {
      const url = await paymentsApi.createCheckoutSession("monthly");
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not start checkout right now.");
    }
  };

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-12 max-w-xl">
        <p className="mb-3 font-mono text-sm uppercase tracking-widest text-ember-500">Pricing</p>
        <h2 className="font-display text-3xl font-bold text-ink dark:text-paper md:text-4xl">
          Free to start. Worth upgrading.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-ink/10 bg-paper-dim/60 p-8 dark:border-white/10 dark:bg-white/5"
        >
          <p className="font-mono text-sm uppercase tracking-widest text-ink/50 dark:text-paper/50">
            Free
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-ink dark:text-paper">
            $0<span className="text-base font-medium text-ink/50 dark:text-paper/50"> forever</span>
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink/80 dark:text-paper/80">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            to="/register"
            className="mt-8 block rounded-xl border border-ink/20 px-6 py-3 text-center font-bold text-ink transition hover:border-ink/40 dark:border-white/20 dark:text-paper"
          >
            Start free
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative rounded-2xl border-2 border-spark-500 bg-ink p-8 text-paper"
        >
          <span className="absolute -top-3 right-8 rounded-full bg-spark-500 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-ink">
            Most lit
          </span>
          <p className="font-mono text-sm uppercase tracking-widest text-spark-500">Premium</p>
          <p className="mt-2 font-display text-4xl font-bold">
            $6<span className="text-base font-medium text-paper/50"> / month</span>
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {premiumFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-paper/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-spark-500" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleGoPremium}
            className="mt-8 block w-full rounded-xl bg-spark-500 px-6 py-3 text-center font-bold text-ink transition hover:bg-spark-600"
          >
            Go premium
          </button>
        </motion.div>
      </div>
    </section>
  );
}
