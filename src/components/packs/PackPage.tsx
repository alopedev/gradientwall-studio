import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPackBySlug, type Pack } from "@/lib/packs";
import { isCheckoutConfigured, openCheckout } from "@/lib/checkout";
import { Nav } from "../Nav";
import { Footer } from "../Footer";
import { Framed } from "../ui/Framed";
import { PageMeta } from "../PageMeta";
import { PackCover } from "./PackCover";

const SITE_ORIGIN = "https://gradientwall.com";

/**
 * Build Product + BreadcrumbList JSON-LD. Google reads these and shows
 * price/breadcrumbs as rich results in search. The Product needs `offers`
 * with currency and availability for the pricing snippet to show up.
 */
function buildPackJsonLd(pack: Pack): Record<string, unknown>[] {
  const url = `${SITE_ORIGIN}/packs/${pack.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: pack.name,
      description: pack.description,
      url,
      brand: { "@type": "Brand", name: "GradientWall" },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "EUR",
        price: pack.priceEur.toFixed(2),
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "GradientWall", item: SITE_ORIGIN },
        { "@type": "ListItem", position: 2, name: "Packs", item: `${SITE_ORIGIN}/#packs` },
        { "@type": "ListItem", position: 3, name: pack.name, item: url },
      ],
    },
  ];
}

export function PackPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const pack = getPackBySlug(slug);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const buyEnabled = !!pack?.lemonSqueezyVariantId && isCheckoutConfigured();

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
          <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-white/40 mb-4">404</span>
          <h1 className="display-head text-[clamp(40px,6vw,76px)] text-white mb-4">Pack not found.</h1>
          <p className="font-sans text-[15px] text-white/60 mb-8 max-w-[42ch]">
            The pack you're looking for has moved or doesn't exist. Browse the full catalog instead.
          </p>
          <Link
            to="/#packs"
            className="inline-flex items-center gap-2 rounded-[2px] bg-[#f8f8f8] text-[#171717] px-4 py-2.5 text-[11px] tracking-[0.14em] uppercase font-sans font-medium"
          >
            ← Back to packs
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${pack.name} — pack of ${pack.previews.length} wallpapers`}
        description={pack.description}
        path={`/packs/${pack.slug}`}
        ogType="product"
        ogImageAlt={`${pack.name} — ${pack.tagline}`}
        jsonLd={buildPackJsonLd(pack)}
      />
      <Nav />
      <main className="pt-[100px]">
        {/* Hero */}
        <section className="mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(40px,6vw,80px)]">
          <Link
            to="/#packs"
            className="inline-flex items-center gap-1.5 mb-8 font-sans text-[11px] tracking-[0.18em] uppercase text-white/50 hover:text-white transition-colors"
          >
            ← All packs
          </Link>

          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-[clamp(40px,5vw,80px)] items-center">
            <Framed offset={10} className="rounded-[2px] bg-[#0a0a0d] border border-white/8 aspect-[3/4] overflow-hidden">
              <PackCover cover={pack.cover} w={1080} h={1440} className="block w-full h-full object-cover" />
            </Framed>

            <div>
              <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
                Pack · {pack.style}
              </span>
              <h1 className="display-head text-[clamp(44px,6vw,84px)] text-white leading-[0.95]">
                {pack.name}
              </h1>
              <div className="mt-4 font-serif italic text-[clamp(20px,2.4vw,28px)] text-white/65 leading-snug">
                {pack.tagline}
              </div>

              <p className="mt-8 max-w-[52ch] font-sans text-[16px] leading-relaxed text-white/75">
                {pack.description}
              </p>

              <div className="mt-10 flex flex-wrap items-end gap-6">
                <div>
                  <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-white/40 mb-1.5">
                    Price
                  </div>
                  <div className="display-head text-[44px] text-white leading-none">
                    €{pack.priceEur.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-white/40 mb-1.5">
                    Includes
                  </div>
                  <div className="font-sans text-[14px] text-white/80 leading-tight">
                    {pack.previews.length} wallpapers · max resolution · ZIP
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button
                  disabled={!buyEnabled || checkoutLoading}
                  title={buyEnabled ? "Open checkout" : "Checkout configuration pending"}
                  onClick={async () => {
                    if (!buyEnabled || !pack.lemonSqueezyVariantId) return;
                    setCheckoutLoading(true);
                    try {
                      await openCheckout({ variantId: pack.lemonSqueezyVariantId, packSlug: pack.slug });
                    } finally {
                      setCheckoutLoading(false);
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-[2px] bg-white/95 text-[#0a0a0d] px-5 py-3 text-[11px] tracking-[0.14em] uppercase font-sans font-medium transition-colors ${
                    buyEnabled
                      ? "hover:bg-white cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  } ${checkoutLoading ? "opacity-80 cursor-wait" : ""}`}
                >
                  {checkoutLoading ? "Loading…" : `↓ Buy €${pack.priceEur.toFixed(2)}`}
                </button>
                {!buyEnabled && (
                  <span className="font-sans text-[11px] tracking-[0.14em] uppercase text-white/40">
                    Checkout coming soon
                  </span>
                )}
              </div>

              <div className="mt-10 font-sans text-[11px] text-white/40 leading-relaxed max-w-[44ch]">
                Personal use across your devices. No reselling, no redistribution. Full terms on
                checkout.
              </div>
            </div>
          </div>
        </section>

        {/* Previews grid */}
        <section className="mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,8vw,120px)] border-t border-white/8">
          <div className="mb-10">
            <span className="block mb-3 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
              Inside the pack
            </span>
            <h2 className="display-head text-[clamp(28px,3.6vw,48px)] text-white">
              All ten wallpapers.
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pack.previews.map((preview, i) => (
              <div
                key={i}
                className="relative aspect-[3/4] rounded-[2px] overflow-hidden bg-black border border-white/8"
              >
                <PackCover
                  cover={preview}
                  w={480}
                  h={640}
                  imgAlt={`${pack.name} preview ${i + 1}`}
                  className="block w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 z-10 rounded-full bg-black/55 border border-white/14 px-2 py-0.5 font-sans text-[9px] tracking-[0.18em] uppercase text-white/70 backdrop-blur-md">
                  {String(i + 1).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
