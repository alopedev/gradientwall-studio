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
 * Diseño (Fase 5 — iteración tras feedback del usuario):
 * - `ShimmerButton` (Magic UI) como base. El componente lleva DOS efectos
 *   incorporados que dan el look "halo de luz que da vueltas":
 *     1. **shimmer-slide**: una barra de luz recorre el perímetro del
 *        botón (keyframe `shimmer-slide` definido en index.css).
 *     2. **spin-around**: un conic-gradient gira continuamente dentro de
 *        un container con padding-mask, creando el halo rotativo que el
 *        usuario espera ver.
 *   No añadimos efectos extra encima (la iteración anterior con un conic
 *   propio + ShimmerButton producía un "doble efecto" molesto).
 * - `MagneticButton` wrapper: atrae al cursor en desktop (`pointer: fine`
 *   + sin reduced-motion).
 * - Sparkles icon (Lucide) que rota 360° con cada click — feedback de
 *   acción discreto.
 * - kbd "Space" inline-flex en sm+ (hidden en mobile).
 * - Bind global `Space` con guard sobre inputs / textareas.
 */

export function SurpriseCTA() {
  const applySurprise = useConfigStore((s) => s.applySurprise);
  const [spins, setSpins] = useState(0);

  const trigger = () => {
    applySurprise();
    setSpins((s) => s + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        applySurprise();
        setSpins((s) => s + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applySurprise]);

  return (
    <div className="mt-6 flex justify-center">
      <MagneticButton>
        <ShimmerButton
          onClick={trigger}
          title="Surprise me — generate a fresh wallpaper (Space)"
          aria-label="Surprise me — generate a fresh wallpaper (Space)"
          background="rgba(15, 15, 18, 0.92)"
          shimmerColor="rgba(255, 255, 255, 0.92)"
          shimmerDuration="3.2s"
          shimmerSize="1px"
          borderRadius="2px"
          className="gap-3 px-6 py-3"
        >
          <m.span
            aria-hidden
            animate={{ rotate: spins * 360 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative z-10 inline-flex"
          >
            <Sparkles className="size-4" />
          </m.span>
          <span className="relative z-10 font-sans text-[12px] font-medium uppercase tracking-[0.18em]">
            Surprise me
          </span>
          <kbd
            aria-hidden
            className="relative z-10 hidden h-[20px] min-w-[42px] items-center justify-center rounded-[3px] border border-white/20 bg-black/40 px-1.5 font-sans text-[9px] normal-case tracking-[0.08em] text-white/80 shadow-[inset_0_-1px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] sm:inline-flex"
          >
            Space
          </kbd>
        </ShimmerButton>
      </MagneticButton>
    </div>
  );
}
