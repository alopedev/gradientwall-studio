import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageSource } from "./ImageSource";
import { useConfigStore } from "@/store/useConfigStore";
import { resetStores } from "@/test-utils";
import * as extractModule from "@/lib/color-extract";
import type { Colors4 } from "@/lib/palettes";

const EXTRACTED: Colors4 = ["#001122", "#334455", "#667788", "#99aabb"];

describe("<ImageSource />", () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders an upload affordance with an accessible label", () => {
    render(<ImageSource />);
    expect(screen.getByLabelText(/upload an image to extract/i)).toBeInTheDocument();
  });

  it("on successful extract: writes the 4 colors", async () => {
    vi.spyOn(extractModule, "extractColorsFromFile").mockResolvedValue(EXTRACTED);

    render(<ImageSource />);
    const input = screen.getByLabelText(/upload an image to extract/i) as HTMLInputElement;
    const file = new File(["fake"], "test.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(useConfigStore.getState().colors).toEqual(EXTRACTED);
    });
  });

  it("on extract error: surfaces the message and leaves the colors untouched", async () => {
    vi.spyOn(extractModule, "extractColorsFromFile").mockRejectedValue(new Error("bad pixels"));
    const initialColors = useConfigStore.getState().colors;

    render(<ImageSource />);
    const input = screen.getByLabelText(/upload an image to extract/i) as HTMLInputElement;
    const file = new File(["fake"], "broken.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/bad pixels/i)).toBeInTheDocument());
    expect(useConfigStore.getState().colors).toBe(initialColors);
  });

  it("calls onComplete once the colors are applied", async () => {
    vi.spyOn(extractModule, "extractColorsFromFile").mockResolvedValue(EXTRACTED);
    const onComplete = vi.fn();

    render(<ImageSource onComplete={onComplete} />);
    const input = screen.getByLabelText(/upload an image to extract/i) as HTMLInputElement;
    const file = new File(["fake"], "test.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(useConfigStore.getState().colors).toEqual(EXTRACTED);
  });
});
