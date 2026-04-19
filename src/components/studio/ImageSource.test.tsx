import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageSource } from "./ImageSource";
import { useConfigStore } from "@/store/useConfigStore";
import { useUIStore } from "@/store/useUIStore";
import { resetStores } from "@/test-utils";
import * as extractModule from "@/lib/color-extract";
import type { Colors4 } from "@/lib/palettes";

const EXTRACTED: Colors4 = ["#001122", "#334455", "#667788", "#99aabb"];

describe("<ImageSource />", () => {
  beforeEach(() => {
    resetStores();
    // Ensure we start away from the picker tab so we can observe the auto-switch.
    useUIStore.setState({ activeTab: "image" });
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders an upload affordance with an accessible label", () => {
    render(<ImageSource />);
    expect(screen.getByLabelText(/upload an image to extract/i)).toBeInTheDocument();
  });

  it("on successful extract: writes the 4 colors + switches to the picker tab", async () => {
    vi.spyOn(extractModule, "extractColorsFromFile").mockResolvedValue(EXTRACTED);

    render(<ImageSource />);
    const input = screen.getByLabelText(/upload an image to extract/i) as HTMLInputElement;
    const file = new File(["fake"], "test.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(useConfigStore.getState().colors).toEqual(EXTRACTED);
    });
    expect(useUIStore.getState().activeTab).toBe("picker");
  });

  it("on extract error: surfaces the message and keeps the user in the image tab", async () => {
    vi.spyOn(extractModule, "extractColorsFromFile").mockRejectedValue(new Error("bad pixels"));
    const initialColors = useConfigStore.getState().colors;

    render(<ImageSource />);
    const input = screen.getByLabelText(/upload an image to extract/i) as HTMLInputElement;
    const file = new File(["fake"], "broken.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/bad pixels/i)).toBeInTheDocument());
    // Colors are untouched and we stayed on the image tab so the user can retry.
    expect(useConfigStore.getState().colors).toBe(initialColors);
    expect(useUIStore.getState().activeTab).toBe("image");
  });
});
