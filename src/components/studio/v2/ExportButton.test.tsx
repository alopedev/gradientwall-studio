// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfigStore } from "@/store";
import { canvas2DEngine, EngineProvider, type WallpaperEngine } from "../engine";
import { ExportButton } from "./ExportButton";

function engineWith(exportWallpaper: WallpaperEngine["exportWallpaper"]): WallpaperEngine {
  return { ...canvas2DEngine, exportWallpaper, exportFormat: () => "WebP" };
}

const INITIAL = useConfigStore.getState();

describe("ExportButton", () => {
  beforeEach(() => {
    act(() => useConfigStore.setState(INITIAL, true));
  });

  it("says the size and the format of the file right on the button", () => {
    act(() => useConfigStore.getState().setDevice("desktop"));
    render(
      <EngineProvider engine={engineWith(vi.fn())}>
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    const button = screen.getByRole("button", { name: /download wallpaper/i });
    expect(button.textContent).toContain("Download");
    expect(button.textContent).toContain("5120 × 2880 · WebP");
    // The accessible name carries the same facts.
    expect(button.getAttribute("aria-label")).toBe("Download wallpaper, 5120 × 2880, WebP");
  });

  it("names JPEG when the browser has no WebP encoder", () => {
    render(
      <EngineProvider engine={{ ...engineWith(vi.fn()), exportFormat: () => "JPEG" }}>
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    expect(screen.getByRole("button", { name: /download wallpaper/i }).textContent).toContain(
      "· JPEG",
    );
  });

  it("follows the device: a phone is 1440 × 3200", () => {
    act(() => useConfigStore.getState().setDevice("mobile"));
    render(
      <EngineProvider engine={engineWith(vi.fn())}>
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    expect(screen.getByRole("button", { name: /download wallpaper/i }).textContent).toContain(
      "1440 × 3200 · WebP",
    );
  });

  it("keeps the size visible while rendering and after", async () => {
    const user = userEvent.setup();
    act(() => useConfigStore.getState().setDevice("mobile"));
    render(
      <EngineProvider engine={engineWith(vi.fn(() => new Promise<never>(() => undefined)))}>
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    await user.click(screen.getByRole("button", { name: /download wallpaper/i }));
    expect(screen.getByText("Rendering 0%")).toBeTruthy();
    expect(screen.getByRole("button", { name: /download wallpaper/i }).textContent).toContain(
      "1440 × 3200 · WebP",
    );
  });

  it("shows progress while exporting, then Downloaded, and reports the file with a link to the packs", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const exportWallpaper = vi.fn(
      (_params, _device, onProgress) =>
        new Promise<{ filename: string; bytes: number }>((resolve) => {
          onProgress?.(0.4);
          finish = () => resolve({ filename: "gradientwall-mobile-A47B.webp", bytes: 2_097_152 });
        }),
    );
    const onMessage = vi.fn();
    render(
      <EngineProvider engine={engineWith(exportWallpaper)}>
        <ExportButton onMessage={onMessage} />
      </EngineProvider>,
    );

    await user.click(screen.getByRole("button", { name: /download wallpaper/i }));
    expect(exportWallpaper).toHaveBeenCalledOnce();
    expect(screen.getByText("Rendering 40%")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /download wallpaper/i }).getAttribute("aria-busy"),
    ).toBe("true");

    await act(async () => finish());
    expect(screen.getByText("Downloaded")).toBeTruthy();
    expect(onMessage).toHaveBeenCalledWith(
      expect.stringContaining("gradientwall-mobile-A47B.webp"),
      { label: expect.stringMatching(/packs/i), href: "#packs" },
    );
    expect(onMessage).toHaveBeenCalledWith(expect.stringContaining("2.0 MB"), expect.anything());
  });

  it("ignores a second click while busy", async () => {
    const user = userEvent.setup();
    const exportWallpaper = vi.fn(() => new Promise<never>(() => undefined));
    render(
      <EngineProvider engine={engineWith(exportWallpaper)}>
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    const button = screen.getByRole("button", { name: /download wallpaper/i });
    await user.click(button);
    await user.click(button);
    expect(exportWallpaper).toHaveBeenCalledOnce();
  });

  it("tells the user when the export fails and goes back to idle", async () => {
    const user = userEvent.setup();
    const onMessage = vi.fn();
    render(
      <EngineProvider engine={engineWith(vi.fn().mockRejectedValue(new Error("boom")))}>
        <ExportButton onMessage={onMessage} />
      </EngineProvider>,
    );
    await user.click(screen.getByRole("button", { name: /download wallpaper/i }));
    expect(onMessage).toHaveBeenCalledWith(expect.stringMatching(/couldn't render/i));
    expect(screen.getByText("Download")).toBeTruthy();
  });
});
