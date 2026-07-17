import { useEffect, useRef, useState } from "react";

export function useCountdown(totalSeconds: number | null, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds ?? 0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (totalSeconds === null) return;
    setSecondsLeft(totalSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return { secondsLeft, formatted };
}
