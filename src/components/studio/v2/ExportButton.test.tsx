// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfigStore } from "@/store";
import { canvas2DEngine, EngineProvider, type WallpaperEngine } from "../engine";
import { ExportButton } from "./ExportButton";
import { onPrint, type PrintEvent } from "./print";

function engineWith(exportWallpaper: WallpaperEngine["exportWallpaper"]): WallpaperEngine {
  return { ...canvas2DEngine, exportWallpaper, exportFormat: () => "WebP" };
}

const INITIAL = useConfigStore.getState();

describe("ExportButton", () => {
  beforeEach(() => {
    act(() => useConfigStore.setState(INITIAL, true));
    sessionStorage.clear();
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

  it("shows progress while exporting, then Downloaded, and opens the help on the first download", async () => {
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
    const help = screen.getByRole("dialog", { name: /your wallpaper is downloading/i });
    expect(help.textContent).toContain("gradientwall-mobile-A47B.webp");
    expect(help.textContent).toContain("2.0 MB");
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("tells how to set the wallpaper on the device it was made for, then shows the packs", async () => {
    const user = userEvent.setup();
    act(() => useConfigStore.getState().setDevice("mobile"));
    render(
      <EngineProvider
        engine={engineWith(vi.fn().mockResolvedValue({ filename: "a.webp", bytes: 1 }))}
      >
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    await user.click(screen.getByRole("button", { name: /download wallpaper/i }));
    const help = screen.getByRole("dialog");
    expect(within(help).getByText("On iPhone")).toBeTruthy();
    expect(within(help).getByText("On Android")).toBeTruthy();
    expect(help.textContent).toMatch(/Use as Wallpaper/);
    // On iPhone the share sheet's Save Image puts it in Photos (Files only as a fallback).
    expect(help.textContent).toMatch(/Save Image/);
    expect(help.textContent).not.toMatch(/Files › Downloads › open it/);
    const packs = within(help).getByRole("link", { name: /see the packs/i });
    expect(packs.getAttribute("href")).toBe("#packs");
    expect(help.textContent).toMatch(/€5\.99 each on Etsy/);
  });

  it("gives desktop steps for a desktop wallpaper", async () => {
    const user = userEvent.setup();
    act(() => useConfigStore.getState().setDevice("desktop"));
    render(
      <EngineProvider
        engine={engineWith(vi.fn().mockResolvedValue({ filename: "a.webp", bytes: 1 }))}
      >
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    await user.click(screen.getByRole("button", { name: /download wallpaper/i }));
    const help = screen.getByRole("dialog");
    expect(within(help).getByText("On a Mac")).toBeTruthy();
    expect(within(help).getByText("On Windows")).toBeTruthy();
  });

  it("closes the help, and later downloads only report the file with a link to the packs", async () => {
    const user = userEvent.setup();
    const onMessage = vi.fn();
    render(
      <EngineProvider
        engine={engineWith(vi.fn().mockResolvedValue({ filename: "b.webp", bytes: 2_097_152 }))}
      >
        <ExportButton onMessage={onMessage} />
      </EngineProvider>,
    );
    const download = screen.getByRole("button", { name: /download wallpaper/i });
    await user.click(download);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(download);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onMessage).toHaveBeenCalledWith(expect.stringContaining("b.webp"), {
      label: expect.stringMatching(/packs/i),
      href: "#packs",
    });
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

  it("tells the device screen to print while the file renders", async () => {
    const user = userEvent.setup();
    const seen: PrintEvent[] = [];
    const off = onPrint((e) => seen.push(e));
    render(
      <EngineProvider
        engine={engineWith(vi.fn().mockResolvedValue({ filename: "gw.webp", bytes: 1 }))}
      >
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    await user.click(screen.getByRole("button", { name: /download wallpaper/i }));
    off();
    expect(seen).toEqual(["start", "done"]);
  });

  it("tells the screen to stop printing when the render fails", async () => {
    const user = userEvent.setup();
    const seen: PrintEvent[] = [];
    const off = onPrint((e) => seen.push(e));
    render(
      <EngineProvider engine={engineWith(vi.fn().mockRejectedValue(new Error("boom")))}>
        <ExportButton onMessage={vi.fn()} />
      </EngineProvider>,
    );
    await user.click(screen.getByRole("button", { name: /download wallpaper/i }));
    off();
    expect(seen).toEqual(["start", "fail"]);
  });
});
