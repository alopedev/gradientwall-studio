import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Closer } from "./Closer";

describe("<Closer />", () => {
  it("renderiza el heading editorial y el CTA", () => {
    render(<Closer />);
    expect(screen.getByText(/ship the wallpaper/i)).toBeInTheDocument();
    expect(screen.getByText(/your phone deserves/i)).toBeInTheDocument();
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
