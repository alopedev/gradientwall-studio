import { type EncodeFormat, exportFormatLabel } from "./encode";

/**
 * WebP 95 %, JPEG 95 % where the browser has no WebP encoder. For grainy
 * gradients WebP 95 % looks the same as lossless at a fraction of PNG's size.
 */
export const FORMATS: EncodeFormat[] = [
  { type: "image/webp", quality: 0.95 },
  { type: "image/jpeg", quality: 0.95 },
];

/** "WebP" or "JPEG": what `exportCanvas` will write in this browser. */
export function exportFormat(): string {
  return exportFormatLabel(FORMATS);
}
