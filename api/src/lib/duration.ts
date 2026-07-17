const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/** Parses strings like "15m", "30d", "1h" into a future Date. */
export function durationFromNow(duration: string): Date {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Expected e.g. "15m", "30d".`);
  }
  const [, amountStr, unit] = match;
  const amount = Number(amountStr);
  const ms = amount * UNIT_MS[unit as keyof typeof UNIT_MS];
  return new Date(Date.now() + ms);
}
