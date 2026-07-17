import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("converts a normal title to a lowercase, hyphenated slug", () => {
    expect(slugify("How Black Holes Warp Time")).toBe("how-black-holes-warp-time");
  });

  it("strips punctuation", () => {
    expect(slugify("What's the Big Deal?!")).toBe("whats-the-big-deal");
  });

  it("collapses multiple spaces and underscores into a single hyphen", () => {
    expect(slugify("Too   many_spaces  here")).toBe("too-many-spaces-here");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Leading and trailing--  ")).toBe("leading-and-trailing");
  });

  it("returns an empty string for input with no alphanumeric characters", () => {
    expect(slugify("!!!???")).toBe("");
  });
});
