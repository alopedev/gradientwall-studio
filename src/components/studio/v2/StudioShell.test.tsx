// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudioShell } from "./StudioShell";

describe("StudioShell", () => {
  it("renders the studio landmark with its controls and the saved strip", () => {
    const { container, getByLabelText, getByRole } = render(<StudioShell />);

    expect(container.querySelector("#studio")).not.toBeNull();
    expect(getByRole("toolbar", { name: /wallpaper controls/i })).toBeTruthy();
    expect(getByLabelText(/shuffle: generate another wallpaper/i)).toBeTruthy();
    expect(getByLabelText("Device")).toBeTruthy();
    expect(getByLabelText("Style")).toBeTruthy();
    expect(getByLabelText("Palette")).toBeTruthy();
    expect(getByLabelText(/favorites — empty/i)).toBeTruthy();
  });

  it("paints the wallpaper into a framed screen", () => {
    const { container, getByRole } = render(<StudioShell />);
    expect(getByRole("img", { name: /wallpaper preview/i })).toBeTruthy();
    expect(container.querySelector("canvas")).not.toBeNull();
  });
});
