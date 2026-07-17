export const XP_PER_LEVEL = 100;

export function levelForXp(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

export function xpIntoCurrentLevel(totalXp: number): number {
  return totalXp % XP_PER_LEVEL;
}

export function xpToNextLevel(totalXp: number): number {
  return XP_PER_LEVEL - xpIntoCurrentLevel(totalXp);
}
