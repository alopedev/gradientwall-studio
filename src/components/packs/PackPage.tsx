import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { SharedElement } from "@/lib/page-transition";
import { SectionLink } from "../ui/SectionLink";
import { describeContents, getPackBySlug } from "@/lib/packs";
import { canPurchasePack, openCheckout } from "@/lib/store";
import { AI_DISCLOSURE } from "@/lib/copy";
import { Nav } from "../Nav";
import { Footer } from "../Footer";
import { inkButton } from "../ui/InkButton";
import { MorePacks } from "./MorePacks";
import { PageMeta } from "../PageMeta";
import { buildPackPage, packPath } from "@/lib/seo/pages";
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
  // One path for both Buy buttons. A failed load is logged and the button
  // comes back, so a second click retries (checkout.ts forgets the failure).
  const startCheckout = async () => {
    if (!pack || eligibility.kind !== "buyable" || checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      await openCheckout({ variantId: eligibility.variantId, packSlug: pack.slug });
    } catch (err) {
      console.error("[checkout] could not open", err);
    } finally {
      setCheckoutLoading(false);
    }
  };
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaVisible = useInView(ctaRef);

  if (!pack) {
    return (
      <>
        <PageMeta
          title="Pack not found"
          description="The pack you're looking for has moved or doesn't exist. Browse the full GradientWall catalog instead."
          path={packPath(slug ?? "")}
          noindex
        />
        <Nav />
        <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-ink-dim mb-4">
            404
          </span>
          <h1 className="display-head text-[clamp(40px,6vw,76px)] text-ink mb-4">
            Pack not found.
          </h1>
          <p className="font-sans text-[15px] text-ink-dim mb-8 max-w-[42ch]">
            The pack you're looking for has moved or doesn't exist. Browse the full catalog instead.
          </p>
          <SectionLink to="packs" className={`${inkButton({ variant: "primary" })} px-6`}>
            ← Back to packs
          </SectionLink>
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
              <SectionLink
                to="packs"
                shared={() => backToCard(pack.slug)}
                className="inline-flex min-h-11 items-center gap-1.5 font-sans text-[11px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink transition-colors"
              >
                ← All packs
              </SectionLink>
              <span className="block mb-2 font-sans text-[11px] tracking-[0.22em] uppercase text-ink-dim">
                Pack · {pack.style}
              </span>
              <h1
                data-vt="pack-title"
                className="display-head w-fit text-[clamp(56px,8vw,120px)] text-ink"
              >
                {pack.name}
              </h1>
              <div className="mt-3 max-w-[40ch] font-sans text-[clamp(15px,1.6vw,18px)] font-light text-ink-dim leading-snug">
                {pack.tagline}
              </div>
            </>
          }
          buy={
            (buyEnabled || pack.etsyUrl) && (
              <div
                ref={ctaRef}
                className="flex w-full items-center justify-between gap-4 rounded-sharp border-2 border-ink bg-bg py-2 pl-5 pr-2 sm:w-auto"
              >
                <span className="display-head text-[28px] leading-none text-ink">
                  €{pack.priceEur.toFixed(2)}
                </span>
                {buyEnabled ? (
                  <button
                    type="button"
                    disabled={checkoutLoading}
                    title="Open checkout"
                    onClick={startCheckout}
                    className={`${BUY_BUTTON} cursor-pointer ${
                      checkoutLoading ? "opacity-80 cursor-wait" : ""
                    }`}
                  >
                    {checkoutLoading ? "Loading…" : "Buy now"}
                  </button>
                ) : (
                  <a
                    href={pack.etsyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={BUY_BUTTON}
                  >
                    Get it on Etsy <span aria-hidden>↗</span>
                  </a>
                )}
              </div>
            )
          }
        />

        {/* What you get */}
        <section className="mx-auto grid max-w-[1600px] gap-[clamp(28px,4vw,64px)] px-[clamp(16px,4vw,56px)] py-[clamp(40px,6vw,88px)] lg:grid-cols-2">
          <div className="grid content-start gap-5">
            <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-ink-dim">
              {describeContents(pack)}
            </span>
            <p className="m-0 max-w-[56ch] font-sans text-[16px] leading-relaxed text-ink-dim">
              {pack.description}
            </p>
            <p className="m-0 max-w-[48ch] font-sans text-[12px] text-ink-dim leading-relaxed">
              {buyEnabled
                ? "Instant download link by email, valid 30 days, up to 5 downloads. VAT included. Personal use only: no reselling, no sharing."
                : "Instant download from your Etsy account. VAT included. Personal use only: no reselling, no sharing."}
            </p>
          </div>
          <div className="grid content-start gap-6">
            <PackSpecs pack={pack} />
            <p className="m-0 max-w-[48ch] font-sans text-[11px] text-ink-dim leading-relaxed">
              <span className="uppercase tracking-[0.18em]">How it was made</span>
              <br />
              {AI_DISCLOSURE}
            </p>
          </div>
        </section>

        <MorePacks currentSlug={pack.slug} />
      </main>
      {!ctaVisible && (buyEnabled || pack.etsyUrl) && (
        <StickyBuyBar
          price={pack.priceEur}
          href={buyEnabled ? undefined : pack.etsyUrl}
          onCheckout={buyEnabled ? startCheckout : undefined}
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
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t-2 border-ink bg-bg px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
      <span className="display-head text-[28px] leading-none text-ink">€{price.toFixed(2)}</span>
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

const BUY_BUTTON = `${inkButton({ variant: "primary" })} px-6`;

/**
 * Back to the catalog, A1 in reverse: the phone and the name fly from this
 * page into the pack's own card.
 */
function backToCard(slug: string): SharedElement[] {
  const card = `[data-pack-card="${slug}"]`;
  return [
    {
      name: "pack-phone",
      source: document.querySelector<HTMLElement>("[data-vt=pack-phone]"),
      dest: `${card} [data-vt-src=phone]`,
    },
    {
      name: "pack-title",
      source: document.querySelector<HTMLElement>("[data-vt=pack-title]"),
      dest: `${card} h3`,
    },
  ];
}
