// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudioShell } from "./StudioShell";

describe("StudioShell — Studio v2 surprise-first shell", () => {
  it("renders the section head, canvas, CTA and action row landmarks", () => {
    const { container, getByLabelText, getByRole } = render(<StudioShell />);

    // Section landmark
    const section = container.querySelector("section#studio");
    expect(section).not.toBeNull();

    // Hero CTA — Space binding announced through aria-label
    const cta = getByLabelText(/Surprise me — generate a fresh wallpaper \(Space\)/i);
    expect(cta).toBeTruthy();

    // ActionRow toolbar
    const toolbar = getByRole("toolbar", { name: /wallpaper actions/i });
    expect(toolbar).toBeTruthy();
  });

  it("mounts the canvas Preview verbatim (gestures live there)", () => {
    const { container } = render(<StudioShell />);
    // El canvas exact wrapper que Preview monta; suficiente con localizar uno.
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });
});
