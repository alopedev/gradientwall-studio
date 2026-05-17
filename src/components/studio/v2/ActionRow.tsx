import { Download, Heart, RotateCcw, Settings2 } from "lucide-react";
import { m } from "motion/react";
import { useEffect, useState } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { downloadWallpaper } from "@/lib/download";
import { EASE } from "@/lib/motion";
import { useConfigStore, useRenderParams } from "@/store";
import { DevicePicker } from "./DevicePicker";

/**
 * ActionRow — fila de acciones secundarias del Studio v2.
 *
 * Pegada bajo el `SurpriseCTA`. Cuatro acciones:
 * - **Save** (♥) → fijar a favoritos. **Inactivo en Fase 2** (cableado en
 *   Fase 4 cuando aterrice `useFavoritesStore`). Mostrado pero disabled para
 *   prefigurar el wireframe.
 * - **Remix** (↻) → `applyRemix()` del store (variación cercana, paleta y
 *   style intactos). Bind global `R`. **Activo**.
 * - **Download** (↓) → `downloadWallpaper({ device, ...params })`. El
 *   `DevicePicker` vive pegado a la izquierda del label como un combo.
 *   **Activo**.
 * - **Customize** (⚙) → abre `CustomizePopover` con style + colores + light
 *   + density + softness. **Inactivo en Fase 2** (cableado en Fase 3).
 *
 * Decisiones de UX que separan v2 de v1:
 * - Se elimina la `SeedBadge` visible — el usuario no piensa en seeds.
 * - Reshuffle deja de ser un botón propio: la primera acción real es
 *   "Remix" (variación cercana mantiene cohesión visual; reshuffle es un
 *   subset de remix con paleta intacta).
 * - Save aún no se anima — el spring del heart aterriza en Fase 4 junto con
 *   `FavoritesStrip`.
 */
export function ActionRow() {
  const device = useConfigStore((s) => s.device);
  const applyRemix = useConfigStore((s) => s.applyRemix);
  const params = useRenderParams();

  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "saved">("idle");
  const [remixSpins, setRemixSpins] = useState(0);

  // Bind global `R` → Remix. Mismo guard que SurpriseMeHero (no dispara
  // cuando se está escribiendo en un input).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        applyRemix();
        setRemixSpins((s) => s + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyRemix]);

  return (
    <div
      role="toolbar"
      aria-label="Wallpaper actions"
      className="mt-4 flex flex-wrap items-center justify-center gap-2"
    >
      {/* Save — Fase 4 lo cablea a useFavoritesStore */}
      <button
        type="button"
        disabled
        title="Save to favorites (coming in Phase 4)"
        aria-label="Save to favorites — coming soon"
        className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/10 bg-white/4 px-3 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-white/40 transition-colors disabled:cursor-not-allowed"
      >
        <Heart className="size-3.5" aria-hidden />
        Save
      </button>

      {/* Remix — variación cercana */}
      <button
        type="button"
        onClick={() => {
          applyRemix();
          setRemixSpins((s) => s + 1);
        }}
        title="Remix the current wallpaper (R) — same palette, new feel"
        aria-label="Remix the current wallpaper — same palette, new feel (R)"
        className="tactile inline-flex items-center gap-1.5 rounded-[2px] px-3 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-white/85 hover:text-white"
      >
        <m.span
          aria-hidden
          animate={{ rotate: remixSpins * -360 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="inline-flex"
        >
          <RotateCcw className="size-3.5" />
        </m.span>
        Remix
        <kbd
          aria-hidden
          className="ml-0.5 hidden md:inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-[3px] border border-white/15 bg-white/10 px-1 font-sans text-[9px] tracking-[0.05em] text-white/65"
        >
          R
        </kbd>
      </button>

      {/* Download — primary white CTA con DevicePicker integrado */}
      <div className="inline-flex items-stretch gap-px rounded-[2px] bg-white/[0.06] p-[2px]">
        <DevicePicker />
        <MagneticButton>
          <button
            type="button"
            disabled={downloadStatus === "downloading"}
            onClick={async () => {
              setDownloadStatus("downloading");
              await new Promise((r) => requestAnimationFrame(() => r(null)));
              try {
                await downloadWallpaper({ device, ...params });
                setDownloadStatus("saved");
                setTimeout(() => setDownloadStatus("idle"), 1600);
              } catch {
                setDownloadStatus("idle");
              }
            }}
            aria-label="Download wallpaper for the selected device"
            className="focus-ring inline-flex items-center gap-2 rounded-[2px] bg-gradient-to-b from-white to-[#e6e6e6] px-3.5 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(0,0,0,0.18),0_1px_0_rgba(255,255,255,0.05),0_4px_10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,0,0,0.4)] transition-[background,transform,opacity] duration-150 hover:from-white hover:to-white active:translate-y-[0.5px] disabled:cursor-wait disabled:opacity-80"
          >
            {downloadStatus === "downloading" ? (
              <>
                <span
                  aria-hidden
                  className="inline-block size-3 animate-spin rounded-full border-2 border-[#171717] border-t-transparent"
                />
                Generating
              </>
            ) : downloadStatus === "saved" ? (
              <>✓ Saved</>
            ) : (
              <>
                <Download className="size-3.5" aria-hidden />
                Download
              </>
            )}
          </button>
        </MagneticButton>
      </div>

      {/* Customize — Fase 3 lo cablea al Popover */}
      <button
        type="button"
        disabled
        title="Customize style, colors, light, density (coming in Phase 3)"
        aria-label="Customize — coming soon"
        className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/10 bg-white/4 px-3 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-white/40 transition-colors disabled:cursor-not-allowed"
      >
        <Settings2 className="size-3.5" aria-hidden />
        Customize
      </button>
    </div>
  );
}
