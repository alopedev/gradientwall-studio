// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfigStore } from "@/store";
import { PaletteHex } from "./PaletteHex";

const INITIAL = useConfigStore.getState();

describe("PaletteHex", () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState(INITIAL, true);
      useConfigStore.getState().setColors(["#112233", "#aabbcc", "#ff8800", "#00ffaa"]);
    });
    vi.unstubAllGlobals();
  });

  it("lists the four colors with their hex codes, in upper case", () => {
    render(<PaletteHex onMessage={vi.fn()} />);
    const list = screen.getByRole("list", { name: /palette colors/i });
    expect(list.textContent).toContain("#112233");
    expect(list.textContent).toContain("#AABBCC");
    expect(list.textContent).toContain("#FF8800");
    expect(list.textContent).toContain("#00FFAA");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("shows only the colors the wallpaper really uses when some are switched off", () => {
    act(() => useConfigStore.getState().toggleColor(1));
    render(<PaletteHex onMessage={vi.fn()} />);
    const list = screen.getByRole("list", { name: /palette colors/i });
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(list.textContent).not.toContain("#AABBCC");
  });

  it("follows the palette when it changes", () => {
    render(<PaletteHex onMessage={vi.fn()} />);
    act(() => useConfigStore.getState().setColors(["#010203", "#040506", "#070809", "#0a0b0c"]));
    expect(screen.getByRole("list", { name: /palette colors/i }).textContent).toContain("#010203");
  });

  it("copies a code to the clipboard on click and says so", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const onMessage = vi.fn();
    render(<PaletteHex onMessage={onMessage} />);

    await user.click(screen.getByRole("button", { name: "Copy #FF8800" }));
    expect(writeText).toHaveBeenCalledWith("#FF8800");
    expect(onMessage).toHaveBeenCalledWith("Copied #FF8800");
  });

  it("says it could not copy when the browser refuses, instead of failing silently", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const onMessage = vi.fn();
    render(<PaletteHex onMessage={onMessage} />);
    await user.click(screen.getByRole("button", { name: "Copy #112233" }));
    expect(onMessage).toHaveBeenCalledWith(expect.stringMatching(/couldn't copy/i));
  });

  it("says it could not copy when there is no clipboard API at all", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined });
    const onMessage = vi.fn();
    render(<PaletteHex onMessage={onMessage} />);
    await user.click(screen.getByRole("button", { name: "Copy #112233" }));
    expect(onMessage).toHaveBeenCalledWith(expect.stringMatching(/couldn't copy/i));
  });
});
