import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Nav } from "./Nav";

describe("<Nav />", () => {
  beforeEach(() => {
    window.scrollTo(0, 0);
  });
  afterEach(() => {
    window.scrollTo(0, 0);
  });

  it("renders brand + desktop links + CTA", () => {
    render(<Nav />);
    // Brand mark is aria-hidden; brand text is the whole link label
    expect(screen.getByText(/gradientwall/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^studio$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^gallery$/i })).toBeInTheDocument();
    // CTA has both mobile ("Studio →") + desktop ("Open studio →") children; at least one renders
    expect(screen.getByText(/open studio/i)).toBeInTheDocument();
  });

  it("is transparent at the top (scrollY <= 24)", () => {
    render(<Nav />);
    const nav = screen.getByRole("navigation");
    // Gradient at rest — background uses a linear-gradient
    expect(nav.style.background).toContain("linear-gradient");
  });

  it("switches to solid glass after scrolling past 24px", () => {
    render(<Nav />);
    const nav = screen.getByRole("navigation");
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 300, writable: true, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(nav.style.background).toBe("rgba(7, 7, 10, 0.55)");
  });
});
