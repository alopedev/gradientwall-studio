import { Sparkles } from "lucide-react";
import { m } from "motion/react";
import { useEffect, useState } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ShimmerButton } from "@/components/ui/shadcn/shimmer-button";
import { EASE } from "@/lib/motion";
import { useConfigStore } from "@/store";

/**
 * SurpriseCTA — la acción protagonista del Studio v2.
 *
 * Pegada bajo el canvas Preview, antes del ActionRow. Es el botón hero del
 * editor: un click y el usuario tiene un wallpaper que querría instalar.
 *
 * Diferencias con `SurpriseMeHero` (v1):
 * - Cablea `applySurprise()` (motor mejorado de Fase 1) en lugar de
 *   `randomize()`. Resultado: paleta armónica + curated seed + style
 *   weighted + defaults curados de grain/contrast/vibrance.
 * - Envuelta en `MagneticButton` — atrae hacia el cursor sobre desktop
 *   (gated en pointer fino + prefers-reduced-motion).
 * - "Fresh state" — anillo pulsante sobre el botón mientras el usuario no
 *   ha disparado todavía ningún surprise en esta sesión. Tras el primer
 *   click se apaga (señal "ya tienes algo que mirar").
 * - Sigue ligado a `Space` global (mismo guard que v1: no dispara dentro
 *   de inputs / textareas).
 *
 * Mantiene `ShimmerButton` como base visual — calibrado y firmado por el
 * diseñador en v1, no se reinventa.
 */
export function SurpriseCTA() {
  const applySurprise = useConfigStore((s) => s.applySurprise);
  const [spins, setSpins] = useState(0);
  const [fresh, setFresh] = useState(true);

  const trigger = () => {
    applySurprise();
    setSpins((s) => s + 1);
    if (fresh) setFresh(false);
  };

  // Bind global `Space`. Bail dentro de inputs para no romper SeedBadge,
  // ColorHUD ni otros editores de texto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        trigger();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `trigger` se recrea cada render pero su clausura captura `applySurprise`
    // (estable) y los setters de useState (estables). Las dependencias reales
    // son `applySurprise` y `fresh` (para que el listener vea el estado
    // actualizado y no apague el anillo dos veces).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySurprise, fresh]);

  return (
    <div className="mt-5 flex justify-center">
      {/* Fresh-state ring — pulsa por debajo del botón mientras el usuario no
          ha disparado nada. Se monta dentro del MagneticButton para que el
          ring también acompañe el desplazamiento magnético. */}
      <MagneticButton>
        <div className="relative inline-block">
          {fresh && (
            <m.span
              aria-hidden
              className="absolute inset-[-6px] rounded-[6px] border border-white/35"
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          )}
          <ShimmerButton
            onClick={trigger}
            title="Surprise me — generate a fresh wallpaper (Space)"
            aria-label="Surprise me — generate a fresh wallpaper (Space)"
            background="rgba(15, 15, 18, 0.92)"
            shimmerColor="rgba(255, 255, 255, 0.92)"
            shimmerDuration="3.2s"
            shimmerSize="1px"
            borderRadius="2px"
            className="w-full max-w-[300px] gap-2.5 px-5 py-2.5"
          >
            <m.span
              aria-hidden
              animate={{ rotate: spins * 360 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative z-10 inline-flex"
            >
              <Sparkles className="size-4" />
            </m.span>
            <span className="relative z-10 font-sans text-[12px] font-medium uppercase tracking-[0.16em]">
              Surprise me
            </span>
            <kbd
              aria-hidden
              className="relative z-10 hidden h-[18px] min-w-[38px] items-center justify-center rounded-[3px] border border-white/20 bg-black/40 px-1.5 font-sans text-[9px] normal-case tracking-[0.08em] text-white/85 shadow-[inset_0_-1px_0_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.08)] sm:inline-flex"
            >
              Space
            </kbd>
          </ShimmerButton>
        </div>
      </MagneticButton>
    </div>
  );
}
