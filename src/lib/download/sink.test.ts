// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { browserDownloadSink, createShareOrDownloadSink, isIOSDevice } from "./sink";

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
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
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

describe("createShareOrDownloadSink", () => {
  const blob = new Blob(["x"], { type: "image/jpeg" });

  function fakeNav(share: (data: ShareData) => Promise<void>, canShare = true) {
    return {
      share: vi.fn(share),
      canShare: vi.fn(() => canShare),
    };
  }

  it("on iPhone, hands the file to the share sheet so Save Image puts it in Photos", async () => {
    const nav = fakeNav(async () => undefined);
    const download = vi.fn(async () => undefined);
    const sink = createShareOrDownloadSink({ nav, isIOS: () => true, download });
    await sink(blob, "wallpaper.jpg");
    expect(nav.share).toHaveBeenCalledOnce();
    const files = nav.share.mock.calls[0][0].files as File[];
    expect(files[0].name).toBe("wallpaper.jpg");
    expect(files[0].type).toBe("image/jpeg");
    expect(download).not.toHaveBeenCalled();
  });

  it("downloads as before away from iOS", async () => {
    const nav = fakeNav(async () => undefined);
    const download = vi.fn(async () => undefined);
    const sink = createShareOrDownloadSink({ nav, isIOS: () => false, download });
    await sink(blob, "wallpaper.jpg");
    expect(nav.share).not.toHaveBeenCalled();
    expect(download).toHaveBeenCalledWith(blob, "wallpaper.jpg");
  });

  it("downloads when the browser can't share files", async () => {
    const nav = fakeNav(async () => undefined, false);
    const download = vi.fn(async () => undefined);
    await createShareOrDownloadSink({ nav, isIOS: () => true, download })(blob, "w.jpg");
    expect(nav.share).not.toHaveBeenCalled();
    expect(download).toHaveBeenCalledOnce();
  });

  it("downloads when the share sheet is refused (the tap's permission ran out)", async () => {
    const nav = fakeNav(async () => {
      throw new DOMException("no gesture", "NotAllowedError");
    });
    const download = vi.fn(async () => undefined);
    await createShareOrDownloadSink({ nav, isIOS: () => true, download })(blob, "w.jpg");
    expect(download).toHaveBeenCalledWith(blob, "w.jpg");
  });

  it("does nothing more when the visitor closes the share sheet", async () => {
    const nav = fakeNav(async () => {
      throw new DOMException("cancelled", "AbortError");
    });
    const download = vi.fn(async () => undefined);
    await createShareOrDownloadSink({ nav, isIOS: () => true, download })(blob, "w.jpg");
    expect(download).not.toHaveBeenCalled();
  });
});

describe("isIOSDevice", () => {
  it("knows iPhone and iPad, including iPads that report a Mac", () => {
    expect(
      isIOSDevice({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
    expect(
      isIOSDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
    expect(
      isIOSDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        maxTouchPoints: 0,
      }),
    ).toBe(false);
    expect(isIOSDevice({ userAgent: "Mozilla/5.0 (Linux; Android 14)", maxTouchPoints: 5 })).toBe(
      false,
    );
  });
});
