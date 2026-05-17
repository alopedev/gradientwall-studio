export interface EncodeFormat {
  type: "image/webp" | "image/jpeg" | "image/png";
  quality: number;
}

export interface EncodedImage {
  blob: Blob;
  ext: "webp" | "jpg" | "png";
}

const EXT_FOR_TYPE: Record<EncodeFormat["type"], EncodedImage["ext"]> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/**
 * Encode a canvas trying each format in order, returning the first that works.
 * Browsers that don't support a format either return null or fall back to PNG
 * data masquerading under the requested type — we detect via `blob.type`.
 *
 * @throws if no format in the list produces a blob matching its declared type.
 */
export function encodeWithFallback(
  canvas: HTMLCanvasElement,
  formats: EncodeFormat[],
): Promise<EncodedImage> {
  return new Promise((resolve, reject) => {
    const attempt = (index: number): void => {
      if (index >= formats.length) {
        reject(new Error("encodeWithFallback: no format produced a matching blob"));
        return;
      }
      const { type, quality } = formats[index];
      canvas.toBlob(
        (blob) => {
          if (blob && blob.type === type) {
            resolve({ blob, ext: EXT_FOR_TYPE[type] });
          } else {
            attempt(index + 1);
          }
        },
        type,
        quality,
      );
    };
    attempt(0);
  });
}
