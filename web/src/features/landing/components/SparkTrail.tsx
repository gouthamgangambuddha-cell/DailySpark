import { motion, useReducedMotion } from "framer-motion";

interface SparkTrailProps {
  count?: number;
  size?: number;
  className?: string;
}

export function SparkTrail({ count = 7, size = 10, className = "" }: SparkTrailProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="rounded-full bg-spark-500"
          style={{ width: size, height: size }}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.15, scale: 0.6 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.9 + i * 0.12,
            duration: 0.35,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
