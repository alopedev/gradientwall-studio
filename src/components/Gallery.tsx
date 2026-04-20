import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { loadGallerySeed } from "@/store";
import { GALLERY_SEEDS, type GallerySeed } from "@/lib/palettes";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { EASE, EASE_CSS } from "@/lib/motion";
import { Reveal } from "./ui/Reveal";

export function Gallery() {
  return (
    <section
      id="gallery"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,9vw,120px)] border-t border-white/8"
    >
      <Reveal className="grid md:grid-cols-2 gap-12 items-end mb-14">
        <div>
          <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
            03 — Community
          </span>
          <h2 className="m-0 font-sans font-bold uppercase text-[clamp(40px,5.5vw,76px)] leading-[0.92] tracking-[-0.04em]">
            <span className="block text-white">Made by others.</span>
            <span className="block text-white/75">Remixed by you.</span>
          </h2>
        </div>
        <p className="max-w-[42ch] text-[15px] text-white/75 font-sans font-light">
          A quiet feed of gradients from the GradientWall community. Tap any piece to open it in the studio as a
          starting point.
        </p>
      </Reveal>

      {/* Gallery cards enter viewport with a 60ms stagger — cinematic cascade */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {GALLERY_SEEDS.map((g, i) => (
          <GalleryCard key={g.name} seed={g} index={i} />
        ))}
      </div>
    </section>
  );
}

function GalleryCard({ seed, index }: { seed: GallerySeed; index: number }) {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  // Defer canvas mount until the card scrolls into view. 8 gallery items would
  // otherwise paint eagerly on load. IntersectionObserver flips `visible` once,
  // and from then on the fitted hook handles sizing + DPR inside the child.
  useEffect(() => {
    if (visible) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <m.button
      ref={wrapRef}
      onClick={() => {
        loadGallerySeed(seed);
        document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE, delay: (index % 4) * 0.06 }}
      className="relative aspect-[9/16] rounded-[2px] overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1 p-0 text-left"
      style={{ transitionTimingFunction: EASE_CSS }}
    >
      {visible && <GalleryPaint seed={seed} />}
      <div
        className="absolute bottom-0 inset-x-0 p-4 flex justify-between items-end font-sans text-[10px] tracking-[0.12em] uppercase text-white"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))" }}
      >
        <span>{seed.name}</span>
        <span className="text-white/75">@{seed.author}</span>
      </div>
    </m.button>
  );
}

function GalleryPaint({ seed }: { seed: GallerySeed }) {
  const canvasRef = useFittedGradientCanvas(
    {
      nativeW: 1440,
      nativeH: 2560,
      colors: seed.colors,
      style: seed.style,
      blur: 55,
      seed: seed.seed,
    },
    [seed],
  );
  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
