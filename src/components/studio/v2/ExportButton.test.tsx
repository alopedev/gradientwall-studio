// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { canvas2DEngine, EngineProvider, type WallpaperEngine } from "../engine";
import { ExportButton } from "./ExportButton";

function engineWith(exportWallpaper: WallpaperEngine["exportWallpaper"]): WallpaperEngine {
  return { ...canvas2DEngine, exportWallpaper };
}

describe("ExportButton", () => {
  it("shows progress while exporting, then Saved, and reports the file", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const exportWallpaper = vi.fn(
      (_params, _device, onProgress) =>
        new Promise<{ filename: string; bytes: number }>((resolve) => {
          onProgress?.(0.4);
          finish = () => resolve({ filename: "gradientwall-mobile-#A47B.webp", bytes: 2_097_152 });
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
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(onMessage).toHaveBeenCalledWith(
      expect.stringContaining("gradientwall-mobile-#A47B.webp"),
    );
    expect(onMessage).toHaveBeenCalledWith(expect.stringContaining("2.0 MB"));
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
