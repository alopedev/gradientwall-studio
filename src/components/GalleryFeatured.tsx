import { useRef } from "react";
import { m } from "motion/react";
import { loadGallerySeed } from "@/store";
import type { GallerySeed } from "@/lib/palettes";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { useDeferUntilVisible } from "@/lib/useDeferUntilVisible";
import { EASE, EASE_CSS } from "@/lib/motion";

/**
 * Editorial featured item: name/author offset a la izquierda en serif italic,
 * canvas paisajista a sangre debajo. Rompe con la retícula 9:16 del grid
 * residual.
 */
export function GalleryFeatured({ seed, index }: { seed: GallerySeed; index: number }) {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const visible = useDeferUntilVisible(wrapRef, "400px");

  return (
    <m.button
      ref={wrapRef}
      onClick={() => {
        loadGallerySeed(seed);
        document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
      className="block w-full max-w-[960px] text-left cursor-pointer group p-0 bg-transparent border-0"
      style={{ transitionTimingFunction: EASE_CSS }}
    >
      <div className="ml-[clamp(16px,3vw,48px)] max-w-[36ch] mb-4 md:mb-5">
        <div className="font-sans text-[11px] tracking-[0.22em] uppercase text-white/40 mb-2">
          0{index + 1} · {seed.author}
        </div>
        <h3 className="font-serif italic font-normal leading-[0.98] text-[clamp(28px,3.5vw,56px)] text-white">
          {seed.name}
        </h3>
      </div>
      <div className="relative w-full aspect-[4/5] md:aspect-[16/9] overflow-hidden rounded-[2px] transition-transform duration-500 group-hover:-translate-y-1">
        {visible && <FeaturedPaint seed={seed} />}
      </div>
    </m.button>
  );
}

function FeaturedPaint({ seed }: { seed: GallerySeed }) {
  const canvasRef = useFittedGradientCanvas(
    {
      nativeW: 2560,
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
