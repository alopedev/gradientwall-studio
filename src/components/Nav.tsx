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
  // The bar is a floating glass pill: it keeps its shape and border at the top
  // of the page and gets denser as you scroll, so the content passing under it
  // stays legible. Interpolating across 0→80px reads as craftsmanship; a hard
  // flip at one offset feels abrupt.
  const bgOpacity = useTransform(scrollY, [0, 80], [0.38, 0.72], { clamp: true });
  const blurPx = useTransform(scrollY, [0, 80], [14, 24], { clamp: true });
  const shadowOpacity = useTransform(scrollY, [0, 120], [0.18, 0.4], { clamp: true });

  const bg = useMotionTemplate`rgba(14, 14, 18, ${bgOpacity})`;
  const backdrop = useMotionTemplate`blur(${blurPx}px) saturate(1.6)`;
  const shadow = useMotionTemplate`inset 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 12px 32px rgba(0, 0, 0, ${shadowOpacity})`;

  return (
    <nav
      aria-label="Main"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 md:px-6"
    >
      <m.div
        style={{
          backgroundColor: bg,
          backdropFilter: backdrop,
          WebkitBackdropFilter: backdrop,
          boxShadow: shadow,
        }}
        className="pointer-events-auto mx-auto flex max-w-[1100px] items-center justify-between rounded-full py-1.5 pl-4 pr-1.5 md:pl-6"
      >
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

        <div className="relative z-10 flex items-center gap-1 md:gap-3">
          <NavLink href="/#packs" active={packsInView}>
            Packs
          </NavLink>
          <a
            href="/#studio"
            className={`${glassButton({ variant: "primary" })} rounded-full! min-h-11 px-5 text-[0.82rem]`}
          >
            <span className="md:hidden">Make one →</span>
            <span className="hidden md:inline">Make a wallpaper →</span>
          </a>
        </div>
      </m.div>
    </nav>
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
