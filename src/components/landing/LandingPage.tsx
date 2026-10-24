import { useEffect, useMemo } from "react";
import type { Landing, LandingGuide } from "@/lib/seo/landings";
import { buildLandingPage, landingLinks } from "@/lib/seo/pages";
import { useConfigStore } from "@/store";
import { Footer } from "../Footer";
import { Hero } from "../hero/Hero";
import { useScrollToHash } from "../ui/useScrollToHash";
import { Nav } from "../Nav";
import { PacksSection } from "../packs/PacksSection";
import { PageMeta } from "../PageMeta";
import { LazyStudioShell as StudioShell } from "../studio/v2/LazyStudioShell";
import { PAGE_COLUMN } from "../ui/layout";
import { PageLink } from "../ui/PageLink";
import { LandingGallery } from "./LandingGallery";

/**
 * A landing (`lib/seo/landings.ts`): the home's hero with the landing's own
 * headline and starting look, its gallery of wallpapers, a short guide written
 * for its search, then the Studio and the packs, as on the home.
 */
export function LandingPage({ landing }: { landing: Landing }) {
  const seo = useMemo(() => buildLandingPage(landing), [landing]);
  useScrollToHash();

  // Start on the landing's look once; after that the visitor's choices rule.
  useEffect(() => {
    const { device, style, grain } = landing.look;
    const s = useConfigStore.getState();
    if (device) s.setDevice(device);
    if (style) s.setStyle(style);
    if (grain !== undefined) s.setGrain(grain);
  }, [landing]);

  return (
    <>
      <PageMeta {...seo} />
      <Nav />
      <Hero title={landing.h1} subtitle={landing.subtitle} />
      <LandingGallery landing={landing} />
      <section className={`${PAGE_COLUMN} border-t border-ink py-[clamp(48px,6vw,88px)]`}>
        <div className="grid gap-14 md:grid-cols-2">
          {landing.guides.map((guide) => (
            <Guide key={guide.heading} guide={guide} />
          ))}
        </div>
      </section>
      <StudioShell />
      <PacksSection />
      <MoreLandings landing={landing} />
      <Footer />
    </>
  );
}

function Guide({ guide }: { guide: LandingGuide }) {
  const id = `guide-${guide.heading.replace(/\W+/g, "-")}`;
  return (
    <div>
      <h2 id={id} className="display-head text-[clamp(28px,3vw,44px)] text-ink">
        {guide.heading}
      </h2>
      {guide.body.map((p) => (
        <p key={p} className="mt-4 max-w-[52ch] font-sans text-[16px] leading-relaxed text-ink-dim">
          {p}
        </p>
      ))}
      {guide.steps && (
        <ol aria-labelledby={id} className="mt-6 flex flex-col gap-5 font-sans">
          {guide.steps.map((step, i) => (
            <li key={step.text} className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-semibold text-paper"
              >
                {i + 1}
              </span>
              <span className="pt-1.5 text-[17px] leading-snug text-ink">
                {step.text}
                {step.note && <span className="text-ink-dim"> {step.note}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {guide.sizes && (
        <details className="mt-4 font-sans text-[15px]">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ink underline underline-offset-4 focus-ring">
            {guide.sizesLabel}
          </summary>
          <table className="mt-3 w-full max-w-[520px] border-collapse">
            <tbody>
              {guide.sizes.map(([model, size]) => (
                <tr key={model} className="border-b border-ink/20">
                  <td className="py-2 pr-4 text-ink">{model}</td>
                  <td className="whitespace-nowrap py-2 tabular-nums text-ink-dim">{size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

function MoreLandings({ landing }: { landing: Landing }) {
  return (
    <nav
      aria-label="More gradient wallpapers"
      className={`${PAGE_COLUMN} flex flex-col gap-3 border-t border-ink py-10`}
    >
      <p className="m-0 font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-ink-dim">
        More gradient wallpapers
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
        {landingLinks(landing).map((l) => (
          <li key={l.href}>
            <PageLink
              to={l.href}
              className="inline-flex min-h-11 items-center rounded-sharp border-2 border-ink px-3.5 font-sans text-[14px] font-medium text-ink hover:bg-ink hover:text-paper focus-ring"
            >
              {l.label}
            </PageLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
