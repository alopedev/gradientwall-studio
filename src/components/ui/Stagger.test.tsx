import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stagger, computeStaggerDelays } from "./Stagger";

describe("computeStaggerDelays()", () => {
  it("produces an arithmetic progression baseDelay + i*step", () => {
    expect(computeStaggerDelays(3, 0.1, 0)).toEqual([0, 0.1, 0.2]);
  });

  it("applies baseDelay as the first offset", () => {
    expect(computeStaggerDelays(3, 0.08, 0.1)).toEqual([0.1, 0.18, 0.26]);
  });

  it("returns an empty array for zero children", () => {
    expect(computeStaggerDelays(0, 0.1, 0)).toEqual([]);
  });

  it("uses the project's default step 0.08 when omitted", () => {
    expect(computeStaggerDelays(3)).toEqual([0, 0.08, 0.16]);
  });
});

describe("<Stagger />", () => {
  it("renders each child exactly once (passthrough)", () => {
    render(
      <Stagger>
        <span>alpha</span>
        <span>beta</span>
        <span>gamma</span>
      </Stagger>,
    );
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.getByText("gamma")).toBeInTheDocument();
  });

  it("wraps each child with data-stagger-delay reflecting the computed offset", () => {
    const { container } = render(
      <Stagger step={0.1} baseDelay={0.2}>
        <span>a</span>
        <span>b</span>
      </Stagger>,
    );
    const wrappers = container.querySelectorAll("[data-stagger-delay]");
    expect(wrappers).toHaveLength(2);
    expect(wrappers[0].getAttribute("data-stagger-delay")).toBe("0.2");
    expect(wrappers[1].getAttribute("data-stagger-delay")).toBe("0.3");
  });
});
