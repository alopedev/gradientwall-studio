import { useRef } from "react";
import { m } from "motion/react";
import type { GallerySeed } from "@/lib/palettes";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { useDeferUntilVisible } from "@/lib/useDeferUntilVisible";
import { openSeedInStudio } from "@/lib/openSeedInStudio";
import { EASE, EASE_CSS } from "@/lib/motion";

/** 9:16 poster card for the Gallery residual grid. */
export function GalleryGridCard({ seed, index }: { seed: GallerySeed; index: number }) {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const visible = useDeferUntilVisible(wrapRef);

  return (
    <m.button
      ref={wrapRef}
      onClick={() => openSeedInStudio(seed)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE, delay: (index % 4) * 0.06 }}
      className="relative aspect-square rounded-[2px] overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1 p-0 text-left"
      style={{ transitionTimingFunction: EASE_CSS }}
    >
      {visible && <GridPaint seed={seed} />}
      <div
        className="absolute bottom-0 inset-x-0 p-4 flex flex-col gap-1 font-sans text-[10px] tracking-[0.12em] uppercase text-white"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))" }}
      >
        <span>{seed.name}</span>
        <span className="text-white/60">@{seed.author}</span>
      </div>
    </m.button>
  );
}

function GridPaint({ seed }: { seed: GallerySeed }) {
  const canvasRef = useFittedGradientCanvas(
    {
      nativeW: 1440,
      nativeH: 1440,
      colors: seed.colors,
      style: seed.style,
      blur: 55,
      seed: seed.seed,
    },
    [seed],
  );
  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
