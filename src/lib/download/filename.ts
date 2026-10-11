import { seedToHex } from "@/lib/gradient";
import type { Device } from "@/lib/palettes";

/** `gradientwall-mobile-A47B.webp`. No `#`: it breaks URLs and some file managers. */
export function wallpaperFilename(device: Device, seed: number, ext: string): string {
  return `gradientwall-${device}-${seedToHex(seed).replace("#", "")}.${ext}`;
}
