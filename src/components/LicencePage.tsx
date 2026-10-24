import type { ReactNode } from "react";
import { ETSY_SHOP_URL } from "@/lib/copy";
import { LICENCE_PAGE } from "@/lib/seo/pages";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { PageMeta } from "./PageMeta";

const EMAIL = "alexoliveperez@gmail.com";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="m-0 mb-3 font-sans text-[18px] font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-3 font-sans text-[15px] font-light leading-relaxed text-ink-dim">
        {children}
      </div>
    </section>
  );
}

/**
 * What you may do with a wallpaper from the site. Google Images links here from
 * each gallery image (`imageObjectJsonLd`), so its terms must stay on this URL.
 */
export function LicencePage() {
  return (
    <>
      <PageMeta
        title={LICENCE_PAGE.title}
        description={LICENCE_PAGE.description}
        path={LICENCE_PAGE.path}
      />
      <Nav />
      <main className="min-h-screen pt-[120px] pb-[clamp(60px,9vw,120px)]">
        <article className="mx-auto max-w-[680px] px-[clamp(24px,5vw,80px)]">
          <h1 className="display-head m-0 text-[clamp(36px,4.6vw,56px)] leading-[1.05] text-ink">
            Licence
          </h1>
          <p className="mt-4 font-sans text-[15px] font-light leading-relaxed text-ink-dim">
            The short version: the free wallpapers are yours to use on your own screens. Please
            don't sell them.
          </p>

          <Section title="Free wallpapers">
            <p>
              Every wallpaper you make in the Studio or download from a gallery on this site is free
              for personal use: as the background of your own phone, tablet or computer. No account,
              no watermark, and no credit needed.
            </p>
            <p>
              You may share a link to the page it came from, or a screenshot of your own screen with
              it set.
            </p>
          </Section>

          <Section title="What you may not do">
            <p>
              Sell the files or give them away as files: in a wallpaper pack, an app, a template, a
              print-on-demand shop or a stock photo site. Don't present them as your own work.
            </p>
          </Section>

          <Section title="Packs from the shop">
            <p>
              The paid packs are sold on{" "}
              <a href={ETSY_SHOP_URL} className="underline underline-offset-2 hover:text-ink">
                Etsy
              </a>
              , and their terms are on each listing.
            </p>
          </Section>

          <Section title="Anything else">
            <p>
              For any other use, ask first:{" "}
              <a href={`mailto:${EMAIL}`} className="underline underline-offset-2 hover:text-ink">
                {EMAIL}
              </a>
              .
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  );
}
