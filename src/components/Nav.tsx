import {
  AnimatePresence,
  type MotionStyle,
  m,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getPacks } from "@/lib/packs";
import { paletteName } from "@/lib/palette-name";
import { useConfigStore } from "@/store/useConfigStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { PackCover } from "./packs/PackCover";
import { glassButton } from "./ui/GlassButton";

type Section = "studio" | "packs";

/** The home section that fills the middle of the screen, if any. */
function useSectionInView(): Section | null {
  const [inView, setInView] = useState<Section | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as Section;
          if (entry.isIntersecting) setInView(id);
          else setInView((cur) => (cur === id ? null : cur));
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    for (const id of ["studio", "packs"]) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return inView;
}

/**
 * Glass shared by the three islands. They keep their shape and border at the
 * top of the page and get denser as you scroll, so the content passing under
 * them stays legible. Interpolating across 0→80px reads as craftsmanship; a
 * hard flip at one offset feels abrupt.
 */
function useIslandGlass(): MotionStyle {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 80], [0.38, 0.72], { clamp: true });
  const blurPx = useTransform(scrollY, [0, 80], [14, 24], { clamp: true });
  const shadowOpacity = useTransform(scrollY, [0, 120], [0.18, 0.4], { clamp: true });
  const backgroundColor = useMotionTemplate`rgba(14, 14, 18, ${bgOpacity})`;
  const backdropFilter = useMotionTemplate`blur(${blurPx}px) saturate(1.6)`;
  const boxShadow = useMotionTemplate`inset 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 12px 32px rgba(0, 0, 0, ${shadowOpacity})`;
  return { backgroundColor, backdropFilter, WebkitBackdropFilter: backdropFilter, boxShadow };
}

/**
 * Floating nav in three glass islands: the brand, the sections (Studio, and
 * Packs, which grows into a menu with the covers), and the actions (current
 * palette, saved count, CTA).
 */
export function Nav() {
  const glass = useIslandGlass();

  return (
    <nav
      aria-label="Main"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 md:px-6"
    >
      <div className="relative mx-auto flex max-w-[1100px] items-start justify-between gap-2">
        <m.a
          data-island
          href="/"
          style={glass}
          className="pointer-events-auto flex h-14 items-center gap-2.5 rounded-full pl-4 pr-5 max-sm:px-[17px] font-sans text-[13px] font-medium uppercase tracking-[0.12em] text-white focus-ring"
        >
          <BrandOrb />
          <span className="max-sm:sr-only">
            GradientWall<span className="ml-0.5 font-light text-white/60">*</span>
          </span>
        </m.a>

        <SectionsIsland glass={glass} />

        <ActionsIsland glass={glass} />
      </div>
    </nav>
  );
}

/** The brand dot, painted with the Studio palette so the mark follows the wallpaper. */
function BrandOrb() {
  const colors = useConfigStore((s) => s.colors);
  return (
    <span
      aria-hidden
      className="size-[22px] flex-none rounded-full transition-[background] duration-500"
      style={{
        background: `conic-gradient(from 210deg, ${colors.join(", ")}, ${colors[0]})`,
        boxShadow: `0 0 24px color-mix(in srgb, ${colors[1]} 45%, transparent)`,
      }}
    />
  );
}

const MENU_WIDTH = 520;
const CLOSE_DELAY_MS = 160;

/**
 * Studio link + Packs button with a sliding highlight. Packs opens on hover
 * (mouse) or click (touch, keyboard): the island itself widens and grows a
 * panel with each pack, like a dynamic island.
 */
function SectionsIsland({ glass }: { glass: MotionStyle }) {
  const inView = useSectionInView();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<Section | null>(null);
  const [menuWidth, setMenuWidth] = useState(MENU_WIDTH);
  const islandRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const openMenu = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setMenuWidth(Math.min(MENU_WIDTH, window.innerWidth - 24));
    setOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen(false);
  }, []);
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      closeMenu();
      buttonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!islandRef.current?.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, closeMenu]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const highlighted: Section | null = open ? "packs" : (hovered ?? inView);

  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2">
      <m.div
        data-island
        ref={islandRef}
        style={glass}
        initial={false}
        animate={{ width: open ? menuWidth : "auto" }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onPointerEnter={cancelClose}
        onPointerLeave={(e) => {
          setHovered(null);
          if (e.pointerType === "mouse" && open) closeSoon();
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closeMenu();
        }}
        className="pointer-events-auto overflow-hidden rounded-[28px]"
      >
        <SectionLinks
          highlighted={highlighted}
          open={open}
          buttonRef={buttonRef}
          onHover={setHovered}
          onPacksHover={openMenu}
          onPacksClick={() => (open ? closeMenu() : openMenu())}
        />
        <AnimatePresence initial={false}>
          {open && <PacksMenu key="menu" onNavigate={closeMenu} />}
        </AnimatePresence>
      </m.div>
    </div>
  );
}

function SectionLinks({
  highlighted,
  open,
  buttonRef,
  onHover,
  onPacksHover,
  onPacksClick,
}: {
  highlighted: Section | null;
  open: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onHover: (s: Section) => void;
  onPacksHover: () => void;
  onPacksClick: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  // The highlight is one element that slides between the items; measured
  // after layout so it follows the real label widths.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      const el = highlighted
        ? row.querySelector<HTMLElement>(`[data-section=${highlighted}]`)
        : null;
      setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    document.fonts?.ready.then(measure);
    // The row re-centres while the island widens, so follow its size too.
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [highlighted]);

  const item =
    "relative z-10 inline-flex h-12 items-center gap-1.5 rounded-full px-4 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors duration-150 hover:text-white aria-expanded:text-white aria-[current=location]:text-white focus-ring";

  return (
    <div ref={rowRef} className="relative flex items-center justify-center p-1">
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-white/[0.13] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.3,1.25,0.5,1)]"
        style={{ left: pill?.left ?? 0, width: pill?.width ?? 0, opacity: pill ? 1 : 0 }}
      />
      <a
        href="/#studio"
        data-section="studio"
        aria-current={highlighted === "studio" ? "location" : undefined}
        onPointerEnter={() => onHover("studio")}
        className={`${item} max-sm:hidden`}
      >
        Studio
      </a>
      <button
        ref={buttonRef}
        type="button"
        data-section="packs"
        aria-expanded={open}
        aria-controls="nav-packs"
        onPointerEnter={(e) => {
          onHover("packs");
          if (e.pointerType === "mouse") onPacksHover();
        }}
        onClick={onPacksClick}
        className={item}
      >
        Packs
        <svg
          aria-hidden="true"
          viewBox="0 0 10 6"
          className={`size-2 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}

/** The panel the Packs island grows: one card per pack, plus the free Studio. */
function PacksMenu({ onNavigate }: { onNavigate: () => void }) {
  const colors = useConfigStore((s) => s.colors);
  const packs = getPacks();

  return (
    <m.div
      id="nav-packs"
      role="region"
      aria-label="Packs"
      // Following any link inside closes the menu (delegated, so links stay plain).
      onClick={(e) => {
        if ((e.target as Element).closest("a")) onNavigate();
      }}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 34, opacity: { duration: 0.18 } }}
    >
      <div className="grid grid-cols-3 gap-2.5 px-3 pt-1 max-[480px]:grid-cols-2">
        {packs.map((pack) => (
          <a
            key={pack.slug}
            href={`/packs/${pack.slug}`}
            className="group flex min-w-0 flex-col gap-2 rounded-2xl p-1.5 transition-colors duration-150 hover:bg-white/[0.07] focus-ring"
          >
            <span className="block aspect-[4/3] overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
              <PackCover
                cover={pack.cover}
                decorative
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </span>
            <span className="flex flex-col px-1 pb-0.5 font-sans">
              <span className="text-[13px] font-medium text-white">{pack.name}</span>
              <span className="text-[11px] text-white/55 tabular-nums">
                {pack.previews.length} wallpapers · €{pack.priceEur.toFixed(2)}
              </span>
            </span>
          </a>
        ))}
        <a
          href="/#studio"
          className="group flex min-w-0 flex-col gap-2 rounded-2xl p-1.5 transition-colors duration-150 hover:bg-white/[0.07] focus-ring max-[480px]:col-span-2"
        >
          <span
            className="block aspect-[4/3] rounded-xl max-[480px]:aspect-[3/1] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-[background] duration-500"
            style={{
              background: `conic-gradient(from 210deg, ${colors.join(", ")}, ${colors[0]})`,
            }}
          />
          <span className="flex flex-col px-1 pb-0.5 font-sans">
            <span className="text-[13px] font-medium text-white">Your own</span>
            <span className="text-[11px] text-white/55">Free in the Studio</span>
          </span>
        </a>
      </div>
      <div className="flex justify-end px-4 pb-3 pt-1">
        <a
          href="/#packs"
          className="inline-flex min-h-9 items-center px-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 hover:text-white focus-ring"
        >
          All packs →
        </a>
      </div>
    </m.div>
  );
}

/** Current palette, saved count and the CTA. */
function ActionsIsland({ glass }: { glass: MotionStyle }) {
  const colors = useConfigStore((s) => s.colors);
  const savedCount = useFavoritesStore((s) => s.items.length);
  const name = paletteName(colors);
  const chip =
    "inline-flex h-11 items-center gap-2 rounded-full px-3 font-sans text-[12px] text-white/85 transition-colors duration-150 hover:bg-white/[0.08] hover:text-white focus-ring";

  return (
    <m.div
      data-island
      style={glass}
      className="pointer-events-auto flex h-14 items-center gap-1 rounded-full p-1.5"
    >
      <a
        href="/#studio"
        aria-label={`Current palette: ${name}`}
        className={`${chip} max-md:hidden`}
      >
        <span aria-hidden className="flex gap-1">
          {colors.map((c, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: four fixed slots
              key={i}
              className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] transition-[background] duration-500"
              style={{ background: c }}
            />
          ))}
        </span>
        <span>{name}</span>
      </a>
      <a href="/#studio" aria-label={`${savedCount} saved`} className={`${chip} max-md:hidden`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 text-rose">
          <path
            fill="currentColor"
            d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"
          />
        </svg>
        <span className="tabular-nums">{savedCount}</span>
      </a>
      <a
        href="/#studio"
        className={`${glassButton({ variant: "primary" })} rounded-full! min-h-11 px-5 text-[0.82rem]`}
      >
        <span className="md:hidden">Make one →</span>
        <span className="hidden md:inline">Make a wallpaper →</span>
      </a>
    </m.div>
  );
}
