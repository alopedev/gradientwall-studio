/**
 * A Sink writes an encoded blob somewhere. The default implementation
 * triggers a browser download. A hypothetical "save to cloud" Sink would
 * POST to storage.
 */
export type Sink = (blob: Blob, filename: string) => Promise<void>;

/**
 * Default browser-side sink: create an ObjectURL, click a hidden anchor to
 * trigger the download, and revoke the URL after the click dispatches.
 */
export const browserDownloadSink: Sink = async (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename;
  a.href = url;
  a.click();
  // Revoke after the browser has started the download. 1s is well past the
  // click-dispatch microtask but before any memory pressure matters.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

interface ShareNavigator {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

/** iPhone or iPad; iPadOS reports a Mac, so touch tells them apart. */
export function isIOSDevice(nav: { userAgent: string; maxTouchPoints: number }): boolean {
  return (
    /iPhone|iPad|iPod/.test(nav.userAgent) ||
    (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1)
  );
}

/**
 * On iOS a download lands in Files, two steps away from Photos; the share
 * sheet's Save Image puts it in Photos at once. Everywhere else, and whenever
 * the sheet can't open (no file sharing, or the tap's permission ran out while
 * rendering), it downloads as before. Closing the sheet saves nothing.
 */
export function createShareOrDownloadSink({
  nav = globalThis.navigator as ShareNavigator | undefined,
  isIOS = () => typeof navigator !== "undefined" && isIOSDevice(navigator),
  download = browserDownloadSink,
}: {
  nav?: ShareNavigator;
  isIOS?: () => boolean;
  download?: Sink;
} = {}): Sink {
  return async (blob, filename) => {
    const files = [new File([blob], filename, { type: blob.type })];
    if (!isIOS() || !nav?.share || !nav.canShare?.({ files })) return download(blob, filename);
    try {
      await nav.share({ files });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      await download(blob, filename);
    }
  };
}

/** The Download button's sink: the share sheet on iOS, a download elsewhere. */
export const defaultSink: Sink = createShareOrDownloadSink();
