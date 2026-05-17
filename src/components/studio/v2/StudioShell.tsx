import { Preview } from "../Preview";
import { SplitWords } from "../../ui/SplitWords";
import { Reveal } from "../../ui/Reveal";
import { ActionRow } from "./ActionRow";
import { SurpriseCTA } from "./SurpriseCTA";

/**
 * StudioShell — orquestador del Studio v2 (surprise-first).
 *
 * Composición:
 * - **Canvas Preview** (intocable, v1) ocupa el centro. Sus gestos
 *   (Alt+scroll, drag-drop de imagen, listeners propios) siguen viviendo en
 *   `Preview.tsx` original — aquí lo montamos tal cual sin tocar ni props
 *   ni context.
 * - **SurpriseCTA** debajo: el botón hero magnético con fresh-state ring.
 *   Bind global `Space` para acción rápida.
 * - **ActionRow** debajo: Save (Fase 4) · Remix · Download+DevicePicker ·
 *   Customize (Fase 3). Bind global `R` para Remix.
 * - **FavoritesStrip** llegará en Fase 4 al pie del shell.
 *
 * Diferencias con v1 (`Studio.tsx`):
 * - Una sola columna centrada en el canvas — sin RightRail.
 * - No `BottomBar` separada; sus acciones supervivientes viven en ActionRow.
 * - No `StudioHints` one-shot — UI autoexplicativa.
 *
 * El feature flag `?v2=1` o `localStorage.gw_studio_v2 === "true"` controla
 * el switch entre v1 y v2 desde `App.tsx`.
 */
export function StudioShell() {
  return (
    <section
      id="studio"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,9vw,120px)]"
    >
      {/* Section head — se conserva la voz brutalist de la home. */}
      <Reveal className="mb-10 grid items-end gap-12 md:grid-cols-2">
        <div>
          <span className="mb-4 block font-sans text-[11px] uppercase tracking-[0.22em] text-white/40">
            02 — The studio
          </span>
          <h2 className="m-0 font-sans text-[clamp(40px,5.5vw,76px)] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-white">
            <SplitWords text="One tap. Done." />
          </h2>
        </div>
        <p className="max-w-[42ch] font-sans text-[15px] font-light text-white/75">
          Hit Surprise me — or press Space — and a wallpaper appears. Don&rsquo;t love it? Remix the
          same palette in a different mood, or open Customize to take control. Export sized for your
          phone, tablet, or desktop.
        </p>
      </Reveal>

      {/* Canvas-dominant column. El Preview lleva su propio aspect-ratio
          interno (container queries) — aquí solo le damos un max-width
          centrado para que respire en pantallas anchas. */}
      <div className="mx-auto flex max-w-[1100px] flex-col items-stretch">
        <Preview framed={false} />
        <SurpriseCTA />
        <ActionRow />
      </div>
    </section>
  );
}
