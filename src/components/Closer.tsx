import { useEffect, useRef } from "react";
import { mulberry32 } from "@/lib/gradient";
import { buildMiniaturePool, MINIATURE_POOL_SIZE } from "@/lib/miniaturePool";
import { EASE_CSS } from "@/lib/motion";
import { computeSpawn, pickPoolIndex, randomRotation } from "@/lib/mouseTrail";
import { Framed } from "./ui/Framed";
import { Reveal } from "./ui/Reveal";

const MIN_SPAWN_INTERVAL = 80;
const DWELL_MS = 350;
const FADE_MS = 750;
const LIFETIME_MS = DWELL_MS + FADE_MS;
const SPRITE_SIZE = 140;

export function Closer() {
  const sectionRef = useRef<HTMLElement>(null);
  const spriteLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const layer = spriteLayerRef.current;
    if (!section || !layer) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pool = buildMiniaturePool();
    if (pool.length === 0) return;

    const rng = mulberry32(Date.now() & 0xffffffff);
    let lastSpawnTs = 0;
    const timers = new Set<number>();
    const rafs = new Set<number>();

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (!computeSpawn({ lastSpawnTs, now, minInterval: MIN_SPAWN_INTERVAL })) return;
      lastSpawnTs = now;

      const rect = section.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const src = pool[pickPoolIndex(rng, MINIATURE_POOL_SIZE)];
      const rot = randomRotation(rng);

      const sprite = document.createElement("img");
      sprite.src = src;
      sprite.alt = "";
      sprite.style.cssText = [
        "position:absolute",
        `left:${x - SPRITE_SIZE / 2}px`,
        `top:${y - SPRITE_SIZE / 2}px`,
        `width:${SPRITE_SIZE}px`,
        `height:${SPRITE_SIZE}px`,
        "border-radius:2px",
        `transform:rotate(${rot}deg) scale(0.9)`,
        "opacity:1",
        // Dwell en opacity:1 durante DWELL_MS y luego fade-out limpio —
        // sin delay los sprites se ven como flashes tenues.
        `transition:opacity ${FADE_MS}ms ${EASE_CSS} ${DWELL_MS}ms, transform ${FADE_MS}ms ${EASE_CSS} ${DWELL_MS}ms`,
        "will-change:opacity,transform",
        "pointer-events:none",
      ].join(";");
      layer.appendChild(sprite);
      // Force reflow: sin esto el browser batchea la inicialización + el
      // cambio del rAF y la transición nunca arranca desde opacity:1.
      void sprite.offsetWidth;

      const rafId = requestAnimationFrame(() => {
        rafs.delete(rafId);
        sprite.style.opacity = "0";
        sprite.style.transform = `rotate(${rot}deg) scale(0.55)`;
      });
      rafs.add(rafId);

      const tId = window.setTimeout(() => {
        timers.delete(tId);
        sprite.remove();
      }, LIFETIME_MS);
      timers.add(tId);
    };

    section.addEventListener("mousemove", onMove);
    return () => {
      section.removeEventListener("mousemove", onMove);
      rafs.forEach(cancelAnimationFrame);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="closer"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(120px,18vw,220px)] border-t border-white/8 overflow-hidden"
    >
      <div ref={spriteLayerRef} data-sprite-layer className="absolute inset-0 pointer-events-none z-0" aria-hidden />

      <Framed offset={-4} size={7} className="relative z-10 max-w-[min(92vw,1100px)] mx-auto py-8">
        <Reveal className="text-center">
          <span className="block mb-6 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
            04 — Ship it
          </span>
          <h2 className="m-0 text-[clamp(44px,9vw,140px)] leading-[0.95]">
            <span className="block font-sans font-bold uppercase tracking-[-0.03em] text-white">
              Ship the wallpaper
            </span>
            <span className="block font-serif italic font-normal tracking-tight text-white/85 mt-1">
              your phone deserves.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.2} className="mt-10 md:mt-14 flex justify-center">
          <a
            href="#studio"
            className="inline-flex items-center gap-3 bg-white text-[#07070a] font-sans font-medium uppercase tracking-[0.18em] text-[clamp(13px,1vw,18px)] px-[clamp(32px,3vw,56px)] py-[clamp(16px,1.4vw,26px)] rounded-[2px] hover:bg-white/90 transition-colors duration-150"
          >
            Open the Studio
            <span aria-hidden>→</span>
          </a>
        </Reveal>
      </Framed>
    </section>
  );
}
