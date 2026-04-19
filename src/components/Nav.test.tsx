import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./Nav";

describe("<Nav />", () => {
  it("renders brand + desktop links + CTA", () => {
    render(<Nav />);
    // Brand mark is aria-hidden; brand text is the whole link label
    expect(screen.getByText(/gradientwall/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^studio$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^gallery$/i })).toBeInTheDocument();
    // CTA has both mobile ("Studio →") + desktop ("Open studio →") children; at least one renders
    expect(screen.getByText(/open studio/i)).toBeInTheDocument();
  });

  it("renders the cinematic top-fade-to-transparent overlay (seen at the top of the page)", () => {
    const { container } = render(<Nav />);
    // The gradient overlay is a child div; assert it exists with the linear-gradient
    const gradientLayer = container.querySelector('[style*="linear-gradient"]');
    expect(gradientLayer).not.toBeNull();
    expect(gradientLayer!.getAttribute("style")).toMatch(/rgba\(7\s*,\s*7\s*,\s*10\s*,\s*0\.85\)/);
  });

  it("applies backdrop-filter blur as a scroll-driven style (not a class toggle)", () => {
    const { container } = render(<Nav />);
    const nav = container.querySelector("nav")!;
    // Motion writes the MotionValue-backed style to the DOM inline. The initial
    // value at scrollY=0 is blur(6px) — smoothly interpolating up to blur(18px)
    // at scrollY=80.
    expect(nav.style.backdropFilter).toMatch(/blur\(/);
  });
});
