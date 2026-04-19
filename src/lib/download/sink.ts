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
