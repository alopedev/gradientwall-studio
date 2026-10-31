import { type ImageSources, PHONE_MEDIA } from "./responsive-image";

/**
 * Fetch and decode the file an `<img>` with these sources would show, so it
 * paints whole the moment it mounts instead of in strips over a black frame.
 * Resolves once decoded (or failed: the `<img>` then shows what it can).
 * Null where the browser can't decode ahead, so the caller doesn't wait.
 */
export function preloadImage(s: ImageSources): Promise<void> | null {
  if (typeof Image === "undefined") return null;
  const img = new Image();
  if (typeof img.decode !== "function") return null;
  if (s.phoneCrop && window.matchMedia?.(PHONE_MEDIA).matches) {
    img.src = s.phoneCrop.src;
  } else {
    if (s.sizes) img.sizes = s.sizes;
    if (s.srcSet) img.srcset = s.srcSet;
    img.src = s.src;
  }
  return img.decode().catch(() => {});
}
