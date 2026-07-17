/** Truncates a Date to midnight UTC, so only the calendar day matters for comparisons. */
export function toDateOnlyUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function daysBetweenUTC(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toDateOnlyUTC(b).getTime() - toDateOnlyUTC(a).getTime()) / msPerDay);
}
