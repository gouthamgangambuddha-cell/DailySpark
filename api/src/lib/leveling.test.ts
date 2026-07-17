import { describe, it, expect } from "vitest";
import { levelForXp, xpIntoCurrentLevel, xpToNextLevel, XP_PER_LEVEL } from "./leveling";

describe("leveling", () => {
  it("starts at level 1 with zero XP", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("levels up exactly every XP_PER_LEVEL points", () => {
    expect(levelForXp(XP_PER_LEVEL - 1)).toBe(1);
    expect(levelForXp(XP_PER_LEVEL)).toBe(2);
    expect(levelForXp(XP_PER_LEVEL * 2)).toBe(3);
  });

  it("computes xpIntoCurrentLevel as the remainder", () => {
    expect(xpIntoCurrentLevel(0)).toBe(0);
    expect(xpIntoCurrentLevel(50)).toBe(50);
    expect(xpIntoCurrentLevel(XP_PER_LEVEL + 30)).toBe(30);
  });

  it("computes xpToNextLevel as the complement of xpIntoCurrentLevel", () => {
    expect(xpToNextLevel(0)).toBe(XP_PER_LEVEL);
    expect(xpToNextLevel(XP_PER_LEVEL - 10)).toBe(10);
  });
});
