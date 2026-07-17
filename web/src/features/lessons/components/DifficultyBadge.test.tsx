import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DifficultyBadge } from "./DifficultyBadge";

describe("DifficultyBadge", () => {
  it("renders the correct label for BEGINNER", () => {
    render(<DifficultyBadge difficulty="BEGINNER" />);
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });

  it("renders the correct label for INTERMEDIATE", () => {
    render(<DifficultyBadge difficulty="INTERMEDIATE" />);
    expect(screen.getByText("Intermediate")).toBeInTheDocument();
  });

  it("renders the correct label for ADVANCED", () => {
    render(<DifficultyBadge difficulty="ADVANCED" />);
    expect(screen.getByText("Advanced")).toBeInTheDocument();
  });
});
