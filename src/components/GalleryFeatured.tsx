import { useRef } from "react";
import { m } from "motion/react";
import { loadGallerySeed } from "@/store";
import { FEATURED_TAGLINES, GALLERY_SEEDS, type GallerySeed } from "@/lib/palettes";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { useDeferUntilVisible } from "@/lib/useDeferUntilVisible";
import { EASE, EASE_CSS } from "@/lib/motion";

/**
 * Editorial featured item. On wide viewports: canvas a la izquierda + sidecar
 * derecho con metadata + 'also try' microgrid 2×2. Mobile colapsa a stack.
 */
export function GalleryFeatured({ seed, index }: { seed: GallerySeed; index: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const visible = useDeferUntilVisible(wrapRef, "400px");
  const tagline = FEATURED_TAGLINES[index] ?? "";
  // "Also try" — 4 seeds que no son el propio featured (ni los otros featured).
  const related = GALLERY_SEEDS.filter((s) => s.name !== seed.name).slice(-4);

  const openInStudio = () => {
    loadGallerySeed(seed);
    document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <m.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
      className="block w-full md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.5fr)] md:gap-10 md:items-center"
    >
      {/* Mobile: metadata above canvas; hidden on desktop (mostrado en sidecar). */}
      <div className="md:hidden ml-[clamp(16px,3vw,48px)] max-w-[36ch] mb-4">
        <div className="font-sans text-[11px] tracking-[0.22em] uppercase text-white/40 mb-2">
          0{index + 1} · {seed.author}
        </div>
        <h3 className="font-serif italic font-normal leading-[0.98] text-[clamp(28px,3.5vw,56px)] text-white">
          {seed.name}
        </h3>
      </div>

      {/* Canvas (col 1 on desktop, solo block en mobile). */}
      <button
        type="button"
        onClick={openInStudio}
        className="block w-full cursor-pointer group p-0 bg-transparent border-0"
        style={{ transitionTimingFunction: EASE_CSS }}
      >
        <div className="relative w-full aspect-[4/5] md:aspect-[16/9] overflow-hidden rounded-[2px] transition-transform duration-500 group-hover:-translate-y-1">
          {visible && <FeaturedPaint seed={seed} />}
        </div>
      </button>

      {/* Sidecar (col 2): solo desktop. */}
      <div className="hidden md:flex flex-col gap-8 pl-2">
        <div>
          <div className="font-sans text-[11px] tracking-[0.22em] uppercase text-white/40 mb-3">
            0{index + 1} · {seed.author}
          </div>
          <h3 className="m-0 font-serif italic font-normal leading-[0.98] text-[clamp(28px,3vw,48px)] text-white">
            {seed.name}
          </h3>
          {tagline && (
            <p className="mt-4 font-sans font-light text-[14px] leading-relaxed text-white/65 max-w-[28ch]">
              {tagline}
            </p>
          )}
          <button
            type="button"
            onClick={openInStudio}
            className="mt-6 inline-flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white hover:text-white group"
          >
            <span className="border-b border-white/30 group-hover:border-white pb-0.5 transition-colors duration-150">
              Open in Studio
            </span>
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>

        {visible && (
          <div>
            <div className="mb-3 font-sans text-[10px] tracking-[0.22em] uppercase text-white/30">
              Also try
            </div>
            <div className="grid grid-cols-2 gap-2">
              {related.map((r) => (
                <RelatedThumb key={r.name} seed={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </m.div>
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

function RelatedThumb({ seed }: { seed: GallerySeed }) {
  const thumbRef = useRef<HTMLButtonElement>(null);
  const visible = useDeferUntilVisible(thumbRef, "200px");
  return (
    <button
      ref={thumbRef}
      type="button"
      onClick={() => {
        loadGallerySeed(seed);
        document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      title={`${seed.name} · @${seed.author}`}
      className="relative aspect-square rounded-[2px] overflow-hidden cursor-pointer p-0 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ transitionTimingFunction: EASE_CSS }}
    >
      {visible && <ThumbPaint seed={seed} />}
    </button>
  );
}

function ThumbPaint({ seed }: { seed: GallerySeed }) {
  const canvasRef = useFittedGradientCanvas(
    {
      nativeW: 720,
      nativeH: 720,
      colors: seed.colors,
      style: seed.style,
      blur: 55,
      seed: seed.seed,
    },
    [seed],
  );
  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
