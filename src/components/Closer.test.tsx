import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Closer } from "./Closer";

describe("<Closer />", () => {
  it("renderiza el heading editorial y el CTA", () => {
    render(<Closer />);
    // SplitWords renders each word in its own span, so we match the heading's
    // aggregate textContent with regex (any whitespace between word fragments).
    const heading = screen.getByRole("heading", { level: 2 });
    const text = heading.textContent ?? "";
    expect(text).toMatch(/ship\s*the\s*wallpaper/i);
    expect(screen.getByRole("link", { name: /open the studio/i })).toBeInTheDocument();
  });

  it("CTA apunta a #studio", () => {
    render(<Closer />);
    const link = screen.getByRole("link", { name: /open the studio/i });
    expect(link.getAttribute("href")).toBe("#studio");
  });

  it("expone una capa de sprites con pointer-events: none para el mouse-trail", () => {
    const { container } = render(<Closer />);
    const spriteLayer = container.querySelector("[data-sprite-layer]");
    expect(spriteLayer).not.toBeNull();
    expect(spriteLayer!.className).toMatch(/pointer-events-none/);
  });
});
