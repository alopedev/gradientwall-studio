/// <reference lib="webworker" />
import { extractFromPixels } from "@/lib/color-extract";
import type { Colors4 } from "@/lib/palettes";

export type ExtractRequest = {
  id: number;
  data: Uint8ClampedArray;
};
export type ExtractResponse =
  | { id: number; ok: true; colors: Colors4 }
  | { id: number; ok: false; error: string };

self.addEventListener("message", (e: MessageEvent<ExtractRequest>) => {
  const { id, data } = e.data;
  try {
    const colors = extractFromPixels(data);
    const reply: ExtractResponse = { id, ok: true, colors };
    (self as unknown as Worker).postMessage(reply);
  } catch (err) {
    const reply: ExtractResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(reply);
  }
});
