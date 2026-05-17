import { Sparkles } from "lucide-react";
import { m } from "motion/react";
import { useEffect, useState } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { EASE } from "@/lib/motion";
import { useConfigStore } from "@/store";

/**
 * SurpriseCTA — la acción protagonista del Studio v2.
 *
 * Pegada bajo el canvas Preview, antes del ActionRow. Es el botón hero del
 * editor: un click y el usuario tiene un wallpaper que querría instalar.
 *
 * Diseño v3 (Fase 5 polish):
 * - Botón propio con look "tactile glass" — sin ShimmerButton encima,
 *   evitando el efecto "doble" del rediseño anterior.
 * - Fondo: glass dark con highlight superior, border blanco/14.
 * - Sparkles icon prominente (size 4) + label uppercase con tracking.
 * - kbd "Space" hidden en mobile, inline-flex sm+.
 * - Magnetic wrapper (radius 90, strength 8 — defaults del componente).
 * - BorderBeam conic-gradient rotativo SOLO en estado "fresh" (antes del
 *   primer surprise de la sesión); se apaga tras el primer click.
 * - Bind global Space — el guard sigue bailing dentro de inputs.
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
    // trigger se recrea cada render pero captura applySurprise y fresh
    // (necesarios para que el listener vea estado actualizado).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySurprise, fresh]);

  return (
    <div className="mt-6 flex justify-center">
      <MagneticButton>
        <div className="relative inline-block">
          {/* BorderBeam fresh-state: conic-gradient rotativo en CSS pure.
              El padre tiene padding 1.5px y el mask-composite XOR recorta
              el interior, dejando solo el ring perimetral. Solo se monta
              mientras fresh=true → tras el primer surprise desaparece. */}
          {fresh && (
            <span
              aria-hidden
              className="motion-safe:animate-[gw-beam-rotate_3.5s_linear_infinite] pointer-events-none absolute inset-[-2px] rounded-[3px]"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.9) 30deg, rgba(255,255,255,0.35) 60deg, transparent 90deg, transparent 360deg)",
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1.5px",
              }}
            />
          )}
          <button
            type="button"
            onClick={trigger}
            title="Surprise me — generate a fresh wallpaper (Space)"
            aria-label="Surprise me — generate a fresh wallpaper (Space)"
            className="focus-ring relative inline-flex items-center gap-3 rounded-[2px] border border-white/14 bg-gradient-to-b from-white/8 to-white/4 px-6 py-3 font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.45),0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:from-white/12 hover:to-white/6 active:translate-y-[0.5px]"
          >
            <m.span
              aria-hidden
              animate={{ rotate: spins * 360 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex"
            >
              <Sparkles className="size-4" />
            </m.span>
            <span>Surprise me</span>
            <kbd
              aria-hidden
              className="hidden h-[20px] min-w-[42px] items-center justify-center rounded-[3px] border border-white/20 bg-black/40 px-1.5 font-sans text-[9px] normal-case tracking-[0.08em] text-white/80 shadow-[inset_0_-1px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] sm:inline-flex"
            >
              Space
            </kbd>
          </button>
        </div>
      </MagneticButton>
    </div>
  );
}
