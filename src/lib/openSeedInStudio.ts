import { loadGallerySeed } from "@/store";
import type { GallerySeed } from "./palettes";

/** Carga el seed en el studio y scrollea a la sección — flujo compartido entre tarjetas de Gallery. */
export function openSeedInStudio(seed: GallerySeed): void {
  loadGallerySeed(seed);
  document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
