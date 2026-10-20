import type { CSSProperties } from "react";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getPacks } from "@/lib/packs";
import { packPath } from "@/lib/seo/pages";
import { paletteName } from "@/lib/palette-name";
import { useConfigStore } from "@/store/useConfigStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { PackCover } from "./packs/PackCover";
import { inkButton } from "./ui/InkButton";
import { PAGE_COLUMN } from "./ui/layout";
import { BrandMark, Logo } from "./ui/Logo";

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

/** True once the page has scrolled past the top. */
function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return scrolled;
}

/** Floating paper with a soft shadow and no edge: the strip once scrolled, and the open menu. */
const SHADOW = "0 10px 30px -12px rgb(30 28 24 / 0.35)";
const PAPER: CSSProperties = { backgroundColor: "var(--color-bg)", boxShadow: SHADOW };
const BARE: CSSProperties = { backgroundColor: "transparent", boxShadow: "none" };

/**
 * Frameless nav: the brand, the sections (Studio, and Packs, which grows into
 * a menu with the covers) and the actions (current palette, saved count, CTA)
 * sit on the hero with no background. Once the page scrolls they become one
 * floating paper strip with a soft shadow, so content never runs under bare text.
 */
export function Nav() {
  const scrolled = useScrolled();
  return (
    <nav
      aria-label="Main"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50"
    >
      <div data-nav-column className={PAGE_COLUMN}>
        <div
          data-nav-strip
          data-scrolled={scrolled}
          style={scrolled ? PAPER : BARE}
          className="pointer-events-auto relative flex items-start justify-between gap-2 rounded-sharp transition-[background-color,box-shadow] duration-300"
        >
          <a
            href="/"
            className="flex h-14 items-center rounded-sharp pl-4 pr-5 max-sm:px-[15px] text-ink focus-ring"
          >
            <Logo size={26} className="max-sm:hidden" />
            <BrandMark size={26} className="sm:hidden" />
            <span className="sr-only">gradientwall</span>
          </a>

          <SectionsIsland />

          <ActionsIsland />
        </div>
      </div>
    </nav>
  );
}

const MENU_WIDTH = 520;
const CLOSE_DELAY_MS = 160;
/** Horizontal padding around the links track (`p-1` on both sides). */
const ISLAND_PADDING_X = 8;

/**
 * Studio link + Packs button with a sliding highlight. Packs opens on hover
 * (mouse) or click (touch, keyboard): the island itself widens and grows a
 * panel with each pack, like a dynamic island.
 */
function SectionsIsland() {
  const inView = useSectionInView();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<Section | null>(null);
  const [menuWidth, setMenuWidth] = useState(MENU_WIDTH);
  const [closedWidth, setClosedWidth] = useState<number | null>(null);
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

  // The closed island is as wide as its links. Animating back to a measured
  // number (not "auto") lets it shrink in one movement: "auto" would wait for
  // the panel to unmount and then snap.
  useLayoutEffect(() => {
    const measure = () => {
      const track = islandRef.current?.querySelector<HTMLElement>("[data-track]");
      if (track?.offsetWidth) setClosedWidth(track.offsetWidth + ISLAND_PADDING_X);
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The pointer wins over the open menu, which wins over the section on screen.
  const highlighted: Section | null = hovered ?? (open ? "packs" : inView);

  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2">
      <m.div
        data-packs-island
        ref={islandRef}
        style={open ? PAPER : BARE}
        initial={false}
        animate={{ width: open ? menuWidth : (closedWidth ?? "auto") }}
        transition={
          open
            ? { type: "spring", stiffness: 380, damping: 32 }
            : { type: "spring", stiffness: 520, damping: 44 }
        }
        onPointerEnter={cancelClose}
        onPointerLeave={(e) => {
          setHovered(null);
          if (e.pointerType === "mouse" && open) closeSoon();
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closeMenu();
        }}
        className="pointer-events-auto overflow-hidden rounded-sharp transition-[background-color,box-shadow] duration-200"
      >
        <SectionLinks
          highlighted={highlighted}
          open={open}
          buttonRef={buttonRef}
          onHover={setHovered}
          onStudioHover={closeMenu}
          onPacksHover={openMenu}
          onPacksClick={() => (open ? closeMenu() : openMenu())}
        />
        <AnimatePresence initial={false}>
          {open && <PacksMenu key="menu" width={menuWidth} onNavigate={closeMenu} />}
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
  onStudioHover,
  onPacksHover,
  onPacksClick,
}: {
  highlighted: Section | null;
  open: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onHover: (s: Section) => void;
  onStudioHover: () => void;
  onPacksHover: () => void;
  onPacksClick: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // After closing with a click, hovering doesn't reopen until the pointer leaves.
  const hoverLocked = useRef(false);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  // The highlight is one element that slides between the items; measured
  // after layout so it follows the real label widths. Offsets are taken
  // inside the track, which only wraps the links: the island widening around
  // it never moves them, so the highlight has nothing to chase.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const el = highlighted
        ? track.querySelector<HTMLElement>(`[data-section=${highlighted}]`)
        : null;
      // A hidden item (Studio on phones) has no box: hide the highlight.
      setPill(el?.offsetWidth ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [highlighted]);

  const item =
    "relative z-10 inline-flex h-12 items-center gap-1.5 rounded-full px-4 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-ink-dim transition-colors duration-150 hover:text-ink aria-expanded:text-ink aria-[current=location]:text-ink focus-ring";

  return (
    <div className="flex justify-center p-1">
      <div ref={trackRef} data-track className="relative flex items-center">
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-[2px] bg-ink/[0.1] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.3,1.25,0.5,1)]"
          style={{ left: pill?.left ?? 0, width: pill?.width ?? 0, opacity: pill ? 1 : 0 }}
        />
        <a
          href="/#studio"
          data-section="studio"
          aria-current={highlighted === "studio" ? "location" : undefined}
          onPointerEnter={() => {
            onHover("studio");
            onStudioHover();
          }}
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
            if (e.pointerType === "mouse" && !hoverLocked.current) onPacksHover();
          }}
          // Backs up pointerenter, which can be missed when the page gains focus.
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" && !open && !hoverLocked.current) onPacksHover();
          }}
          onPointerLeave={() => {
            hoverLocked.current = false;
          }}
          onClick={() => {
            hoverLocked.current = open;
            onPacksClick();
          }}
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
    </div>
  );
}

/** The panel the Packs island grows: one card per pack, plus the free Studio. */
function PacksMenu({ width, onNavigate }: { width: number; onNavigate: () => void }) {
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
      className="flex justify-center"
    >
      {/* Fixed width, centred: while the island shrinks it clips the cards
          evenly instead of squeezing them. */}
      <div style={{ width }} className="flex-none">
        <div className="grid grid-cols-3 gap-2.5 px-3 pt-1 max-[480px]:grid-cols-2">
          {packs.map((pack) => (
            <a
              key={pack.slug}
              href={packPath(pack.slug)}
              className="group flex min-w-0 flex-col gap-2 rounded-2xl p-1.5 transition-colors duration-150 hover:bg-ink/[0.07] focus-ring"
            >
              <span className="block aspect-[4/3] overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgba(18,18,18,0.12)]">
                <PackCover
                  cover={pack.cover}
                  decorative
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </span>
              <span className="flex flex-col px-1 pb-0.5 font-sans">
                <span className="text-[13px] font-medium text-ink">{pack.name}</span>
                <span className="text-[11px] text-ink-dim tabular-nums">
                  {pack.previews.length} wallpapers · €{pack.priceEur.toFixed(2)}
                </span>
              </span>
            </a>
          ))}
          <a
            href="/#studio"
            className="group flex min-w-0 flex-col gap-2 rounded-2xl p-1.5 transition-colors duration-150 hover:bg-ink/[0.07] focus-ring max-[480px]:col-span-2"
          >
            <span
              className="block aspect-[4/3] rounded-xl max-[480px]:aspect-[3/1] shadow-[inset_0_0_0_1px_rgba(18,18,18,0.12)] transition-[background] duration-500"
              style={{
                background: `conic-gradient(from 210deg, ${colors.join(", ")}, ${colors[0]})`,
              }}
            />
            <span className="flex flex-col px-1 pb-0.5 font-sans">
              <span className="text-[13px] font-medium text-ink">Your own</span>
              <span className="text-[11px] text-ink-dim">Free in the Studio</span>
            </span>
          </a>
        </div>
        <div className="flex justify-end px-4 pb-3 pt-1">
          <a
            href="/#packs"
            className="inline-flex min-h-9 items-center px-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-ink-dim hover:text-ink focus-ring"
          >
            All packs →
          </a>
        </div>
      </div>
    </m.div>
  );
}

/** Current palette, saved count and the CTA. */
function ActionsIsland() {
  const colors = useConfigStore((s) => s.colors);
  const savedCount = useFavoritesStore((s) => s.items.length);
  const name = paletteName(colors);
  const chip =
    "inline-flex h-11 items-center gap-2 rounded-full px-3 font-sans text-[12px] text-ink/85 transition-colors duration-150 hover:bg-ink/[0.08] hover:text-ink focus-ring";

  return (
    <div className="flex h-14 items-center gap-1 rounded-sharp p-1.5">
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
              className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgba(18,18,18,0.22)] transition-[background] duration-500"
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
        className={`${inkButton({ variant: "primary" })} rounded-[2px]! min-h-11 px-5 text-[0.82rem]`}
      >
        <span className="md:hidden">Studio →</span>
        <span className="hidden md:inline">Open the Studio →</span>
      </a>
    </div>
  );
}
