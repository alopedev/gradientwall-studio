import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { m } from "motion/react";
import { describeContents, getPackBySlug } from "@/lib/packs";
import { canPurchasePack, openCheckout } from "@/lib/store";
import { AI_DISCLOSURE } from "@/lib/copy";
import { Nav } from "../Nav";
import { Footer } from "../Footer";
import { glassButton } from "../ui/GlassButton";
import { MagneticButton } from "../ui/MagneticButton";
import { PageMeta } from "../PageMeta";
import { buildPackPage } from "@/lib/seo/pages";
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
      <main>
        <PackShowcase
          pack={pack}
          header={
            <>
              <Link
                to="/#packs"
                className="inline-flex min-h-11 items-center gap-1.5 font-sans text-[11px] tracking-[0.18em] uppercase text-white/60 hover:text-white transition-colors"
              >
                ← All packs
              </Link>
              <span className="block mb-2 font-sans text-[11px] tracking-[0.22em] uppercase text-white/60">
                Pack · {pack.style}
              </span>
              <m.h1
                layoutId={`pack-${pack.slug}-title`}
                className="m-0 font-serif italic font-normal text-[clamp(56px,8vw,120px)] text-white leading-[0.92] tracking-tight"
              >
                {pack.name}.
              </m.h1>
              <div className="mt-2 font-serif italic text-[clamp(18px,2vw,24px)] text-white/70 leading-snug">
                {pack.tagline}
              </div>
            </>
          }
          buy={
            (buyEnabled || pack.etsyUrl) && (
              <div
                ref={ctaRef}
                className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-white/16 bg-[rgba(20,20,26,0.6)] py-2 pl-5 pr-2 backdrop-blur-xl sm:w-auto"
              >
                <span className="display-head text-[28px] leading-none text-white">
                  €{pack.priceEur.toFixed(2)}
                </span>
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
                      {checkoutLoading ? "Loading…" : "Buy now"}
                    </button>
                  </MagneticButton>
                ) : (
                  <MagneticButton>
                    <a
                      href={pack.etsyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={BUY_BUTTON}
                    >
                      Get it on Etsy <span aria-hidden>↗</span>
                    </a>
                  </MagneticButton>
                )}
              </div>
            )
          }
        />

        {/* What you get */}
        <section className="mx-auto grid max-w-[1600px] gap-[clamp(28px,4vw,64px)] px-[clamp(16px,4vw,56px)] py-[clamp(40px,6vw,88px)] lg:grid-cols-2">
          <div className="grid content-start gap-5">
            <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-white/60">
              {describeContents(pack)}
            </span>
            <p className="m-0 max-w-[56ch] font-sans text-[16px] leading-relaxed text-white/75">
              {pack.description}
            </p>
            <p className="m-0 max-w-[48ch] font-sans text-[12px] text-white/60 leading-relaxed">
              {buyEnabled
                ? "Instant download link by email, valid 30 days, up to 5 downloads. VAT included. Personal use only: no reselling, no sharing."
                : "Instant download from your Etsy account. VAT included. Personal use only: no reselling, no sharing."}
            </p>
          </div>
          <div className="grid content-start gap-6">
            <PackSpecs pack={pack} />
            <p className="m-0 max-w-[48ch] font-sans text-[11px] text-white/60 leading-relaxed">
              <span className="uppercase tracking-[0.18em]">How it was made</span>
              <br />
              {AI_DISCLOSURE}
            </p>
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

const BUY_BUTTON = `${glassButton({ variant: "primary" })} px-6`;
