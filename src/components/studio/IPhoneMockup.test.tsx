import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IPhoneMockup } from "./IPhoneMockup";
import type { Colors4 } from "@/lib/palettes";

const COLORS: Colors4 = ["#111111", "#222222", "#333333", "#444444"];
const common = { colors: COLORS, style: "mesh", blur: 48, seed: 42, grain: 45 } as const;

describe("<IPhoneMockup />", () => {
  it("lock variant renders the big clock + date (9:41 shown twice: status bar + lock clock)", () => {
    render(<IPhoneMockup variant="lock" {...common} />);
    expect(screen.getAllByText("9:41")).toHaveLength(2);
    expect(screen.getByText(/Monday/i)).toBeInTheDocument();
  });

  it("home variant renders 20 app-icon placeholders and no big clock", () => {
    const { container } = render(<IPhoneMockup variant="home" {...common} />);
    // The big clock is absent; the small status bar one remains
    // (status bar shows 9:41 at the top — allow it, but require no "Monday" date on home)
    expect(screen.queryByText(/Monday/i)).not.toBeInTheDocument();
    // 20 placeholder "app" tiles
    const grid = container.querySelector(".grid-cols-4");
    expect(grid).not.toBeNull();
    expect(grid!.children).toHaveLength(20);
  });

  it("mounts a canvas (the wallpaper behind chrome)", () => {
    const { container } = render(<IPhoneMockup variant="lock" {...common} />);
    expect(container.querySelector("canvas")).not.toBeNull();
  });
});
