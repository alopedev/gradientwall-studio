import { useEffect, useState } from "react";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        paddingTop: "max(20px, calc(env(safe-area-inset-top) + 12px))",
        // Subtle top-to-bottom darken gradient at rest — ensures the top edge
        // (incl. iOS safe area / status bar) is always covered, no matter what
        // content scrolls behind, while keeping the cinematic feel over the video.
        background: scrolled
          ? "rgba(7,7,10,0.55)"
          : "linear-gradient(to bottom, rgba(7,7,10,0.85) 0%, rgba(7,7,10,0.35) 60%, rgba(7,7,10,0) 100%)",
      }}
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 md:px-9 pb-5 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300 ${
        scrolled
          ? "backdrop-blur-[18px] backdrop-saturate-150 border-b border-white/8 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          : "backdrop-blur-[6px] border-b border-transparent"
      }`}
    >
      <a href="#" className="flex items-center gap-2.5 font-serif text-[20px] tracking-[-0.01em] text-white">
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

      <div className="hidden md:flex gap-7 text-[13px] tracking-[0.02em] text-white/75">
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
        className="rounded-[2px] bg-[#f8f8f8] text-[#171717] px-3 md:px-4 py-2 text-[12px] md:text-[13px] font-sans font-medium tracking-[0.02em] transition-colors duration-150 hover:bg-white whitespace-nowrap"
      >
        <span className="md:hidden">Studio →</span>
        <span className="hidden md:inline">Open studio →</span>
      </a>
    </nav>
  );
}
