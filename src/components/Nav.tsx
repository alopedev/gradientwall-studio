import * as motion from "motion/react-client";
import { useMotionTemplate, useScroll, useTransform } from "motion/react";

export function Nav() {
  const { scrollY } = useScroll();
  // Smoothly interpolate between the two nav moods across a 0→80px range
  // instead of a binary flip at 24px. Continuous change reads as craftsmanship;
  // a hard flip feels abrupt.
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.55], { clamp: true });
  const blurPx = useTransform(scrollY, [0, 80], [6, 18], { clamp: true });
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.08], { clamp: true });
  const shadowOpacity = useTransform(scrollY, [40, 120], [0, 0.25], { clamp: true });
  // At the very top, layer the cinematic dark-to-transparent gradient on top
  // of the glass so the hero video peeks through. Fades out as you scroll.
  const gradientOpacity = useTransform(scrollY, [0, 40], [1, 0], { clamp: true });

  const bg = useMotionTemplate`rgba(7, 7, 10, ${bgOpacity})`;
  const backdrop = useMotionTemplate`blur(${blurPx}px) saturate(1.5)`;
  const borderCol = useMotionTemplate`rgba(255, 255, 255, ${borderOpacity})`;
  const shadow = useMotionTemplate`0 8px 24px rgba(0, 0, 0, ${shadowOpacity})`;

  return (
    <motion.nav
      style={{
        paddingTop: "max(20px, calc(env(safe-area-inset-top) + 12px))",
        backgroundColor: bg,
        backdropFilter: backdrop,
        WebkitBackdropFilter: backdrop,
        borderBottomColor: borderCol,
        boxShadow: shadow,
      }}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 md:px-9 pb-5 border-b"
    >
      <motion.div
        aria-hidden
        style={{
          opacity: gradientOpacity,
          background:
            "linear-gradient(to bottom, rgba(7,7,10,0.85) 0%, rgba(7,7,10,0.35) 60%, rgba(7,7,10,0) 100%)",
        }}
        className="absolute inset-0 pointer-events-none"
      />

      <a
        href="#"
        className="relative z-10 flex items-center gap-2.5 font-serif text-[20px] tracking-[-0.01em] text-white"
      >
        <span
          className="h-[22px] w-[22px] rounded-full"
          style={{
            background:
              "conic-gradient(from 210deg, #ff4d6d, #ffb14d, #ffe14d, #4dffb1, #4d7dff, #b14dff, #ff4d6d)",
            filter: "blur(0.4px)",
            boxShadow: "0 0 24px rgba(255, 180, 120, 0.35)",
          }}
          aria-hidden
        />
        <span>
          GradientWall<em className="italic font-light text-white/70 ml-0.5">*</em>
        </span>
      </a>

      <div className="relative z-10 hidden md:flex gap-7 text-[13px] tracking-[0.02em] text-white/75">
        <a
          href="#studio"
          className="rounded-[2px] px-2 py-1 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          Studio
        </a>
        <a
          href="#gallery"
          className="rounded-[2px] px-2 py-1 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          Gallery
        </a>
        <a
          href="#"
          className="rounded-[2px] px-2 py-1 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          Pricing
        </a>
        <a
          href="#"
          className="rounded-[2px] px-2 py-1 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          Journal
        </a>
      </div>

      <a
        href="#studio"
        className="relative z-10 rounded-[2px] bg-[#f8f8f8] text-[#171717] px-3 md:px-4 py-2 text-[12px] md:text-[13px] font-sans font-medium tracking-[0.02em] transition-colors duration-150 hover:bg-white whitespace-nowrap"
      >
        <span className="md:hidden">Studio →</span>
        <span className="hidden md:inline">Open studio →</span>
      </a>
    </motion.nav>
  );
}
