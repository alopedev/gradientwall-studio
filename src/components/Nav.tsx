import { m } from "motion/react";
import { useMotionTemplate, useScroll, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { glassButton } from "./ui/GlassButton";

/** True while the packs section is the main thing on screen. */
function usePacksInView(): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = document.getElementById("packs");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "-40% 0px -40% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return inView;
}

export function Nav() {
  const packsInView = usePacksInView();
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
    <m.nav
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
      <m.div
        aria-hidden
        style={{
          opacity: gradientOpacity,
          background:
            "linear-gradient(to bottom, rgba(7,7,10,0.85) 0%, rgba(7,7,10,0.35) 60%, rgba(7,7,10,0) 100%)",
        }}
        className="absolute inset-0 pointer-events-none"
      />

      <a
        href="/"
        className="relative z-10 flex min-h-11 items-center gap-2.5 font-sans font-medium uppercase tracking-[0.12em] text-[13px] text-white focus-ring"
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
          GradientWall<span className="font-light text-white/60 ml-0.5">*</span>
        </span>
      </a>

      <div className="relative z-10 flex items-center gap-2 md:gap-4">
        <NavLink href="/#packs" active={packsInView}>
          Packs
        </NavLink>
        <a
          href="/#studio"
          className={`${glassButton({ variant: "primary" })} min-h-10 px-4 text-[0.82rem]`}
        >
          <span className="md:hidden">Make one →</span>
          <span className="hidden md:inline">Make a wallpaper →</span>
        </a>
      </div>
    </m.nav>
  );
}

/**
 * Nav link — underline slides in on hover with the accent colour and stays
 * while its section is on screen. The 44 px hit area comes from padding, so
 * the label keeps its small size.
 */
function NavLink({
  href,
  active = false,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "location" : undefined}
      className="group relative inline-flex min-h-11 items-center px-3 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors duration-150 hover:text-white aria-[current=location]:text-white focus-ring"
    >
      {children}
      <span
        aria-hidden
        className={`absolute left-3 right-3 bottom-2 h-px origin-left bg-[color:var(--color-accent)] transition-transform duration-200 ease-out group-hover:scale-x-100 ${active ? "scale-x-100" : "scale-x-0"}`}
      />
    </a>
  );
}
