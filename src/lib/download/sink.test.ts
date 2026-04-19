// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { browserDownloadSink } from "./sink";

describe("browserDownloadSink", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("creates an ObjectURL, clicks an anchor with filename + href, and revokes after 1s", async () => {
    const click = vi.fn();
    const anchor = { download: "", href: "", click } as unknown as HTMLAnchorElement;
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return anchor;
      return {} as HTMLElement;
    });
    const createURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const revokeURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    const blob = new Blob(["x"], { type: "image/webp" });
    await browserDownloadSink(blob, "wallpaper.webp");

    expect(createURLSpy).toHaveBeenCalledWith(blob);
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(anchor.download).toBe("wallpaper.webp");
    expect(anchor.href).toBe("blob:mock-url");
    expect(click).toHaveBeenCalledOnce();
    expect(revokeURLSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(revokeURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });
});
