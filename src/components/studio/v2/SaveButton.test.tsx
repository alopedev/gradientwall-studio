// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfigStore } from "@/store";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { SaveButton } from "./SaveButton";

const INITIAL = useConfigStore.getState();
const heart = () => screen.getByLabelText("Save this wallpaper");

describe("SaveButton", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useFavoritesStore.getState().clear();
    });
  });

  it("saves the wallpaper, shows it as saved, and removes it on a second tap", async () => {
    const user = userEvent.setup();
    render(<SaveButton onMessage={vi.fn()} />);
    await user.click(heart());
    expect(useFavoritesStore.getState().items).toHaveLength(1);
    expect(heart().getAttribute("aria-pressed")).toBe("true");
    await user.click(heart());
    expect(useFavoritesStore.getState().items).toHaveLength(0);
  });

  it.each([
    ["turning a color off", () => useConfigStore.getState().toggleColor(1)],
    ["density", () => useConfigStore.setState({ density: 0.9 })],
    ["engine", () => useConfigStore.setState({ engine: "v1" })],
  ])(
    "stops showing as saved after %s changes, and the next tap saves the variant",
    async (_n, edit) => {
      const user = userEvent.setup();
      render(<SaveButton onMessage={vi.fn()} />);
      await user.click(heart());
      act(() => edit());
      expect(heart().getAttribute("aria-pressed")).toBe("false");
      await user.click(heart());
      expect(useFavoritesStore.getState().items).toHaveLength(2);
    },
  );
});
