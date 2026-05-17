import { Link, useParams } from "react-router-dom";
import { getPackBySlug } from "@/lib/packs";
import { Nav } from "../Nav";
import { Footer } from "../Footer";
import { PageMeta } from "../PageMeta";

/**
 * Landing after the LS overlay completes. The download link is sent by
 * email (the webhook handler does that on the server side) — this page
 * sets expectations and points at /recover for the email-not-arriving case.
 */
export function PackPurchaseSuccess() {
  const { slug = "" } = useParams<{ slug: string }>();
  const pack = getPackBySlug(slug);

  return (
    <>
      <PageMeta
        title="Order confirmed"
        description="Thanks for your purchase. Check your email for the download link."
        path={`/packs/${slug}/success`}
        noindex
      />
      <Nav />
      <main className="min-h-screen pt-[120px] pb-[clamp(60px,9vw,120px)]">
        <section className="mx-auto max-w-[680px] px-[clamp(24px,5vw,80px)] text-center">
          <span className="block mb-6 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
            Order confirmed
          </span>
          <h1 className="display-head text-[clamp(40px,5.5vw,68px)] text-white leading-[1] mb-5">
            Thanks. <span className="font-serif italic text-white/70">Check your inbox.</span>
          </h1>
          <p className="font-sans text-[16px] text-white/70 leading-relaxed mb-8">
            {pack ? (
              <>
                We've sent the download link for <span className="text-white">{pack.name}</span> to
                the email used at checkout. It should land within a minute.
              </>
            ) : (
              <>
                We've sent the download link to the email used at checkout. It should land within a
                minute.
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              to="/#packs"
              className="inline-flex items-center gap-2 rounded-[2px] bg-white/95 text-[#0a0a0d] px-4 py-2.5 text-[11px] tracking-[0.14em] uppercase font-sans font-medium hover:bg-white"
            >
              ← Browse more packs
            </Link>
            <Link
              to="/recover"
              className="inline-flex items-center gap-2 rounded-[2px] border border-white/20 text-white/85 px-4 py-2.5 text-[11px] tracking-[0.14em] uppercase font-sans font-medium hover:border-white/40 hover:text-white"
            >
              Email didn't arrive?
            </Link>
          </div>

          <div className="font-sans text-[11px] text-white/40 leading-relaxed">
            The download link is valid for 30 days and works up to 5 times. Personal use only — no
            reselling, no redistribution.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
