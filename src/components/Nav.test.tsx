import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./Nav";

describe("<Nav />", () => {
  it("renders brand + Packs link + CTA (both visible at every width)", () => {
    render(<Nav />);
    // Brand mark is aria-hidden; brand text is the whole link label
    expect(screen.getByText(/gradientwall/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^packs$/i })).toBeInTheDocument();
    // CTA has both mobile ("Make one →") + desktop ("Make a wallpaper →") children; at least one renders
    expect(screen.getByText(/make a wallpaper/i)).toBeInTheDocument();
  });

  it("floats as a rounded glass pill with a scroll-driven backdrop blur (not a class toggle)", () => {
    const { container } = render(<Nav />);
    const nav = container.querySelector("nav")!;
    const pill = nav.firstElementChild as HTMLElement;
    expect(pill.className).toMatch(/rounded-full/);
    // Motion writes the MotionValue-backed style to the DOM inline. The initial
    // value at scrollY=0 is blur(14px), rising to blur(24px) at scrollY=80.
    expect(pill.style.backdropFilter).toMatch(/blur\(/);
  });
});
