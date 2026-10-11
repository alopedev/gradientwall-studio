import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { m } from "motion/react";
import {
  coverAspect,
  getPackBySlug,
  isPhoneAndDesktop,
  pieceAspect,
  type PackCover as PackCoverType,
} from "@/lib/packs";
import { pieceRenders } from "@/lib/packs/showcase";
import { canPurchasePack, openCheckout } from "@/lib/store";
import { AI_DISCLOSURE } from "@/lib/copy";
import { Nav } from "../Nav";
import { Footer } from "../Footer";
import { glassButton } from "../ui/GlassButton";
import { MagneticButton } from "../ui/MagneticButton";
import { PageMeta } from "../PageMeta";
import { buildPackPage } from "@/lib/seo/pages";
import { PackCover } from "./PackCover";
import { PackShowcase } from "./PackShowcase";
import { PackSpecs } from "./PackSpecs";

export function PackPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const pack = getPackBySlug(slug);
  // Memoized: PageMeta re-applies its tags whenever `jsonLd` changes identity.
  const seo = useMemo(() => (pack ? buildPackPage(pack) : null), [pack]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const eligibility = pack ? canPurchasePack(pack) : { kind: "missing-variant" as const };
  const buyEnabled = eligibility.kind === "buyable";
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaVisible = useInView(ctaRef);
  const landscapeGrid = pack ? pack.previews.some((p) => pieceAspect(p) > 1) : false;

  if (!pack) {
    return (
      <>
        <PageMeta
          title="Pack not found"
          description="The pack you're looking for has moved or doesn't exist. Browse the full GradientWall catalog instead."
          path={`/packs/${slug}`}
          noindex
        />
        <Nav />
        <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-white/55 mb-4">
            404
          </span>
          <h1 className="display-head text-[clamp(40px,6vw,76px)] text-white mb-4">
            Pack not found.
          </h1>
          <p className="font-sans text-[15px] text-white/60 mb-8 max-w-[42ch]">
            The pack you're looking for has moved or doesn't exist. Browse the full catalog instead.
          </p>
          <Link to="/#packs" className={`${glassButton({ variant: "primary" })} px-6`}>
            ← Back to packs
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      {seo && <PageMeta {...seo} />}
      <Nav />
      <main className="pt-[100px]">
        {/* Hero */}
        <section className="mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(40px,6vw,80px)]">
          <Link
            to="/#packs"
            className="inline-flex min-h-11 items-center gap-1.5 mb-4 font-sans text-[11px] tracking-[0.18em] uppercase text-white/50 hover:text-white transition-colors"
          >
            ← All packs
          </Link>

          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-[clamp(40px,5vw,80px)] items-start">
            <PackShowcase pack={pack} />

            <div>
              <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-white/55">
                Pack · {pack.style}
              </span>
              <m.h1
                layoutId={`pack-${pack.slug}-title`}
                className="m-0 font-serif italic font-normal text-[clamp(56px,8vw,120px)] text-white leading-[0.92] tracking-tight"
              >
                {pack.name}.
              </m.h1>
              <div className="mt-4 font-serif italic text-[clamp(20px,2.4vw,28px)] text-white/65 leading-snug">
                {pack.tagline}
              </div>

              <p className="mt-8 max-w-[52ch] font-sans text-[16px] leading-relaxed text-white/75">
                {pack.description}
              </p>

              <div ref={ctaRef} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <div>
                  <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-white/55 mb-1.5">
                    Price
                  </div>
                  <div className="display-head text-[44px] text-white leading-none">
                    €{pack.priceEur.toFixed(2)}
                  </div>
                </div>
                {buyEnabled ? (
                  <MagneticButton>
                    <button
                      type="button"
                      disabled={checkoutLoading}
                      title="Open checkout"
                      onClick={async () => {
                        if (eligibility.kind !== "buyable") return;
                        setCheckoutLoading(true);
                        try {
                          await openCheckout({
                            variantId: eligibility.variantId,
                            packSlug: pack.slug,
                          });
                        } finally {
                          setCheckoutLoading(false);
                        }
                      }}
                      className={`${BUY_BUTTON} cursor-pointer ${
                        checkoutLoading ? "opacity-80 cursor-wait" : ""
                      }`}
                    >
                      {checkoutLoading ? "Loading…" : `Buy · €${pack.priceEur.toFixed(2)}`}
                    </button>
                  </MagneticButton>
                ) : pack.etsyUrl ? (
                  <MagneticButton>
                    <a
                      href={pack.etsyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={BUY_BUTTON}
                    >
                      Get it on Etsy · €{pack.priceEur.toFixed(2)} <span aria-hidden>↗</span>
                    </a>
                  </MagneticButton>
                ) : null}
              </div>

              <div className="mt-10 font-sans text-[11px] text-white/55 leading-relaxed max-w-[44ch]">
                {buyEnabled
                  ? "Instant download link by email, valid 30 days, up to 5 downloads. VAT included. Personal use only: no reselling, no sharing."
                  : "Instant download from your Etsy account. VAT included. Personal use only: no reselling, no sharing."}
              </div>
              <div className="mt-8 max-w-[52ch]">
                <PackSpecs pack={pack} />
              </div>
              <p className="mt-6 font-sans text-[11px] text-white/55 leading-relaxed max-w-[44ch]">
                <span className="uppercase tracking-[0.18em] text-white/55">How it was made</span>
                <br />
                {AI_DISCLOSURE}
              </p>
            </div>
          </div>
        </section>

        {/* Previews grid */}
        <section className="mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,8vw,120px)] border-t border-white/8">
          <div className="mb-10">
            <span className="block mb-3 font-sans text-[11px] tracking-[0.22em] uppercase text-white/55">
              What's inside
            </span>
            <h2 className="display-head text-[clamp(28px,3.6vw,48px)] text-white">
              {pack.previews.length === 1
                ? "The wallpaper."
                : `All ${pack.previews.length} ${isPhoneAndDesktop(pack) ? "designs" : "wallpapers"}.`}
            </h2>
          </div>

          <div className={landscapeGrid ? LANDSCAPE_GRID : PORTRAIT_GRID}>
            {pack.previews.map((preview, i) => (
              <PieceTile
                key={preview.kind === "image" ? preview.url : `gradient-${preview.seed}`}
                piece={preview}
                index={i}
              />
            ))}
          </div>
        </section>
      </main>
      {!ctaVisible && (buyEnabled || pack.etsyUrl) && (
        <StickyBuyBar
          price={pack.priceEur}
          href={buyEnabled ? undefined : pack.etsyUrl}
          onCheckout={
            buyEnabled && eligibility.kind === "buyable"
              ? () => openCheckout({ variantId: eligibility.variantId, packSlug: pack.slug })
              : undefined
          }
        />
      )}
      <Footer />
    </>
  );
}

/** True while the element is on screen. Starts true so the bar doesn't flash in on load. */
function useInView(ref: React.RefObject<Element>): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}

/** Phone-only bar that keeps the price and the buy action in reach once the main button scrolls away. */
function StickyBuyBar({
  price,
  href,
  onCheckout,
}: {
  price: number;
  href?: string;
  onCheckout?: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-white/10 bg-[rgba(10,10,13,0.88)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
      <span className="display-head text-[28px] leading-none text-white">€{price.toFixed(2)}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={BUY_BUTTON}>
          Get it on Etsy <span aria-hidden>↗</span>
        </a>
      ) : (
        <button type="button" onClick={onCheckout} className={BUY_BUTTON}>
          Buy
        </button>
      )}
    </div>
  );
}

// Landscape pieces need wider cells than the 9:16-ish phone art the grid was first sized for.
const BUY_BUTTON = `${glassButton({ variant: "primary" })} px-6`;

const LANDSCAPE_GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3";
const PORTRAIT_GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3";

/**
 * One wallpaper in the pack grid, boxed at its own aspect ratio. A piece that
 * ships both renders shows desktop and phone side by side at the same height;
 * anything else shows the single render it has.
 */
function PieceTile({ piece, index }: { piece: PackCoverType; index: number }) {
  const { phone, desktop, phoneIsCrop } = pieceRenders(piece);
  const pair = phone !== null && desktop !== null && !phoneIsCrop;
  const single = (desktop ?? phone)!;
  const badge = (
    <div className="absolute bottom-2 left-2 z-10 rounded-full bg-black/55 border border-white/14 px-2 py-0.5 font-sans text-[9px] tracking-[0.18em] uppercase text-white/70 backdrop-blur-md">
      {String(index + 1).padStart(2, "0")}
    </div>
  );
  if (pair) {
    return (
      <div
        className="relative flex gap-1.5 rounded-2xl overflow-hidden bg-black border border-white/8 p-1.5"
        style={{ aspectRatio: coverAspect(desktop) + coverAspect(phone) }}
      >
        <div
          className="relative h-full overflow-hidden rounded-xl"
          style={{ aspectRatio: coverAspect(desktop) }}
        >
          <PackCover cover={desktop} w={480} h={270} className="block w-full h-full object-cover" />
        </div>
        <div
          className="relative h-full overflow-hidden rounded-xl"
          style={{ aspectRatio: coverAspect(phone) }}
        >
          <PackCover cover={phone} w={270} h={480} className="block w-full h-full object-cover" />
        </div>
        {badge}
      </div>
    );
  }
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-black border border-white/8"
      style={{ aspectRatio: coverAspect(single) }}
    >
      <PackCover cover={single} w={480} h={640} className="block w-full h-full object-cover" />
      {badge}
    </div>
  );
}
