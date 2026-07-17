import { motion, useReducedMotion } from "framer-motion";

export function MatchIllustration() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 320 400"
      className="h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="An illustration of a lit match, representing a spark of daily learning"
    >
      {/* Match stick */}
      <rect x="150" y="140" width="16" height="220" rx="8" fill="#F3E7CE" />
      {/* Charred tip just under the flame */}
      <rect x="148" y="150" width="20" height="26" rx="6" fill="#2A2620" />

      {/* Flame group - flickers continuously */}
      <motion.g
        style={{ transformOrigin: "158px 130px" }}
        className={shouldReduceMotion ? "" : "animate-flicker"}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
      >
        <path
          d="M158 60c18 22 28 40 28 58 0 18-13 32-28 32s-28-14-28-32c0-9 3-17 8-25-1 8 2 14 8 14 7 0 8-8 6-16 4-10 9-19 14-31z"
          fill="#E1483B"
        />
        <path
          d="M158 88c11 14 17 25 17 36 0 11-8 20-17 20s-17-9-17-20c0-5 2-10 5-15 0 5 2 8 5 8 4 0 5-5 3-10 2-6 5-12 9-19z"
          fill="#FFB627"
        />
      </motion.g>

      {/* Small ambient sparks drifting up from the flame */}
      {!shouldReduceMotion &&
        [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={158 + (i - 1) * 22}
            cy={70}
            r={i === 1 ? 3 : 2}
            fill="#FFCE6E"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -60 }}
            transition={{
              delay: 1.2 + i * 0.4,
              duration: 2.2,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeOut",
            }}
          />
        ))}
    </svg>
  );
}
