import { useEffect, useRef, useState } from "react";
import { loadGallerySeed } from "@/store";
import { GALLERY_SEEDS, type GallerySeed } from "@/lib/palettes";
import { renderGradient } from "@/lib/gradient";

export function Gallery() {
  return (
    <section
      id="gallery"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,9vw,120px)] border-t border-white/8"
    >
      <div className="grid md:grid-cols-2 gap-12 items-end mb-14">
        <div>
          <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
            03 — Community
          </span>
          <h2 className="m-0 text-[clamp(40px,5.5vw,76px)] leading-[0.96] tracking-[-0.03em]">
            <span className="block font-sans font-light text-white">Made by others.</span>
            <span className="block font-serif italic text-white">Remixed by you.</span>
          </h2>
        </div>
        <p className="max-w-[42ch] text-[15px] text-white/75 font-sans font-light">
          A quiet feed of gradients from the GradientWall community. Tap any piece to open it in the studio as a
          starting point.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {GALLERY_SEEDS.map((g) => (
          <GalleryCard key={g.name} seed={g} />
        ))}
      </div>
    </section>
  );
}

function GalleryCard({ seed }: { seed: GallerySeed }) {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [painted, setPainted] = useState(false);

  // Defer canvas paint until the card scrolls into view. 8 gallery items × ~900KB
  // of GPU-backed canvas each would be ~7MB eagerly. With this, each card paints
  // once on first visibility and then stays painted.
  useEffect(() => {
    if (painted) return;
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          renderGradient(canvas, {
            w: 360,
            h: 640,
            colors: seed.colors,
            style: seed.style,
            blur: 55,
            seed: seed.seed,
          });
          setPainted(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seed, painted]);

  return (
    <button
      ref={wrapRef}
      onClick={() => {
        loadGallerySeed(seed);
        document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="relative aspect-[9/16] rounded-[2px] overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1 p-0 text-left"
      style={{ transitionTimingFunction: "cubic-bezier(.2,.7,.2,1)" }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div
        className="absolute bottom-0 inset-x-0 p-4 flex justify-between items-end font-sans text-[10px] tracking-[0.12em] uppercase text-white"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))" }}
      >
        <span>{seed.name}</span>
        <span className="text-white/75">@{seed.author}</span>
      </div>
    </button>
  );
}
