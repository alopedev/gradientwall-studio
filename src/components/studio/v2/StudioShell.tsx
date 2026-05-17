import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import { Preview } from "../Preview";
import { Reveal } from "../../ui/Reveal";
import { SplitWords } from "../../ui/SplitWords";
import { ActionRow } from "./ActionRow";
import { CustomizePanel } from "./CustomizePanel";
import { FavoritesStrip } from "./FavoritesStrip";
import { SurpriseCTA } from "./SurpriseCTA";

/**
 * StudioShell — orquestador del Studio v2 (surprise-first).
 *
 * Composición:
 * - **Canvas Preview** (intocable, v1) ocupa el espacio principal. Sus
 *   gestos (Alt+scroll, drag-drop de imagen, listeners propios) siguen
 *   viviendo en `Preview.tsx` original — aquí lo montamos tal cual.
 * - **CustomizePanel** (Fase 3) aparece como columna lateral derecha cuando
 *   el usuario aprieta el botón Customize del ActionRow. NO es un overlay:
 *   el shell anima el layout reduciendo la columna del canvas y abriendo
 *   espacio a la derecha — el feedback visual de cada control sigue siendo
 *   inmediato sobre el wallpaper porque ambos viven en el mismo viewport.
 * - **SurpriseCTA** debajo del canvas: el botón hero magnético con
 *   fresh-state ring. Bind global `Space`.
 * - **ActionRow** debajo: Save (Fase 4) · Remix · Download+DevicePicker ·
 *   Customize. Bind global `R` para Remix.
 * - **FavoritesStrip** llegará en Fase 4 al pie del shell.
 *
 * El estado `customizeOpen` se mantiene aquí (no en `ActionRow` ni en
 * `CustomizePanel`) porque coreografía cambios de layout que afectan al
 * canvas. Subirlo a este nivel es lo que permite la animación de
 * "el canvas se encoge y aparece el panel".
 *
 * Feature flag: `?v2=1` o `localStorage.gw_studio_v2 === "true"` controla
 * el switch entre v1 y v2 desde `App.tsx`.
 */

/** Ancho fijo del panel cuando está abierto. Coincide con el viejo popover. */
const PANEL_WIDTH = 340;

/** Easing común con el resto del proyecto — coincide con `--magnetic-ease`. */
const LAYOUT_EASE = [0.22, 1, 0.36, 1] as const;
const LAYOUT_DURATION = 0.45;

export function StudioShell() {
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Escape global cierra el panel. Bail en inputs / contenteditable para no
  // colisionar con SeedBadge u otros editores de texto si reaparecen.
  useEffect(() => {
    if (!customizeOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      setCustomizeOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [customizeOpen]);

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

      <div className="mx-auto flex max-w-[1100px] flex-col items-stretch">
        {/* Canvas + Panel viven en un row animable. Cuando customizeOpen es
            true, el panel aparece a la derecha y el canvas se reajusta para
            compartir el espacio. motion.div con prop `layout` interpola la
            geometría del canvas wrapper de forma suave; useFittedGradientCanvas
            ve el cambio de container via ResizeObserver y re-pinta a la
            resolución correcta (rAF batcher coalesce los frames). */}
        <m.div
          layout
          transition={{ duration: LAYOUT_DURATION, ease: LAYOUT_EASE }}
          className="flex items-start gap-5"
        >
          <m.div
            layout
            transition={{ duration: LAYOUT_DURATION, ease: LAYOUT_EASE }}
            className="min-w-0 flex-1"
          >
            <Preview framed={false} />
          </m.div>
          <AnimatePresence initial={false}>
            {customizeOpen && (
              <m.aside
                key="customize-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: PANEL_WIDTH, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: LAYOUT_DURATION, ease: LAYOUT_EASE }}
                className="shrink-0 self-stretch overflow-hidden"
              >
                {/* Width interno fijo para evitar layout shift mientras la
                    animación de width está en marcha — el wrapper recorta
                    con overflow-hidden hasta llegar a PANEL_WIDTH. */}
                <div style={{ width: PANEL_WIDTH }} className="h-full">
                  <CustomizePanel onClose={() => setCustomizeOpen(false)} />
                </div>
              </m.aside>
            )}
          </AnimatePresence>
        </m.div>

        <SurpriseCTA />
        <ActionRow
          customizeOpen={customizeOpen}
          onToggleCustomize={() => setCustomizeOpen((o) => !o)}
        />
        <FavoritesStrip />
      </div>
    </section>
  );
}
