import { AI_DISCLOSURE, ETSY_PURCHASES_URL, ETSY_SHOP_URL } from "@/lib/copy";
import { FOOTER_GROUPS, GUIDES, LANDINGS, landingPath } from "@/lib/seo/landings";
import { LICENCE_PAGE, PRIVACY_PAGE } from "@/lib/seo/pages";
import { isNewsletterEnabled } from "@/lib/newsletter/subscribe";
import { useConfigStore } from "@/store/useConfigStore";
import { EmailCapture } from "./EmailCapture";
import { Reveal } from "./ui/Reveal";
import { PageLink } from "./ui/PageLink";
import { SectionLink } from "./ui/SectionLink";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  /** A home section: the link animates the trip (SectionLink). */
  section?: "studio" | "packs";
}

const MAKE: FooterLink[] = [
  { label: "Studio", href: "/#studio", section: "studio" },
  { label: "Packs", href: "/#packs", section: "packs" },
  { label: "Etsy shop", href: ETSY_SHOP_URL, external: true },
];

/**
 * The wallpaper pages, so every page links to them, grouped so the column
 * stays short and says what they are; the how-to guides go under Help.
 */
const WALLPAPER_GROUPS = FOOTER_GROUPS.map((g) => ({
  title: g.title,
  links: LANDINGS.filter((l) => l.footerGroup === g.id).map((l) => ({
    href: landingPath(l.slug),
    label: l.footerLabel,
  })),
}));

const HELP: FooterLink[] = [
  ...GUIDES.map((l) => ({ href: landingPath(l.slug), label: l.footerLabel })),
  { label: "Find your download", href: ETSY_PURCHASES_URL, external: true },
  { label: "Privacy", href: PRIVACY_PAGE.path },
  { label: "Licence", href: LICENCE_PAGE.path },
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] pt-20 border-t border-ink">
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,1.7fr)_minmax(0,1fr)] md:gap-x-12 pb-14">
        <Reveal className="col-span-2 md:col-span-1">
          {isNewsletterEnabled() ? (
            <EmailCapture
              source="footer"
              size="lg"
              heading="the next pack, before anyone else."
              lead="One email when a new pack or Studio feature lands. Nothing else."
              className="relative max-w-[460px]"
            />
          ) : (
            <p className="display-head max-w-[18ch] text-[clamp(28px,3vw,40px)] text-ink">
              colour for the screen you look at most.
            </p>
          )}
        </Reveal>
        <Reveal delay={0.08}>
          <FooterCol title="Make" links={MAKE} />
        </Reveal>
        <Reveal delay={0.11} className="col-span-2 md:col-span-1 md:order-none order-last">
          <WallpaperCol />
        </Reveal>
        <Reveal delay={0.14}>
          <FooterCol title="Help" links={HELP} />
        </Reveal>
      </div>

      <div className="flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-ink py-5 font-sans text-[11px] tracking-[0.14em] uppercase text-ink-dim">
        <span>© 2026 GradientWall</span>
        <span className="max-w-[56ch] normal-case tracking-normal text-[12px] sm:text-right">
          Pack artwork: {AI_DISCLOSURE.charAt(0).toLowerCase() + AI_DISCLOSURE.slice(1)}
        </span>
      </div>

      <Wordmark />
    </footer>
  );
}

/**
 * The brand name, huge, filled with the Studio's current palette: shuffle a
 * wallpaper and the footer picks up its colours. The fill drifts slowly
 * (`wordmark-drift`, stilled by the reduced-motion block in index.css).
 * Decorative (the brand text is already in the nav and the copyright line),
 * so it is hidden from assistive tech.
 */
function Wordmark() {
  const colors = useConfigStore((s) => s.colors);
  const [c0, c1, c2, c3] = colors;
  return (
    <div className="-mb-[1.2vw] select-none overflow-hidden">
      <div
        aria-hidden
        className="animate-wordmark-drift font-sans font-bold uppercase leading-[0.8] tracking-[-0.055em] text-center text-transparent bg-clip-text bg-[length:140%_140%] text-[clamp(40px,12.4vw,200px)]"
        style={{
          backgroundImage: `radial-gradient(50% 93% at 12% 15%, ${c0}, transparent 62%), radial-gradient(50% 93% at 88% 5%, ${c1}, transparent 62%), radial-gradient(57% 107% at 50% 110%, ${c2}, transparent 62%)`,
          backgroundColor: c3,
        }}
      >
        GradientWall
      </div>
    </div>
  );
}

/** One heading per group, its links side by side and wrapping. */
function WallpaperCol() {
  const title = "Free gradient wallpapers";
  return (
    <nav aria-label={title}>
      <h2 className={COL_TITLE}>{title}</h2>
      <div className="flex flex-col gap-3">
        {WALLPAPER_GROUPS.map((g) => (
          <div key={g.title}>
            <h3 className="m-0 font-sans text-[13px] font-semibold text-ink">{g.title}</h3>
            <ul className="flex flex-wrap gap-x-4 list-none p-0 m-0">
              {g.links.map((l) => (
                <li key={l.href}>
                  <FooterAnchor link={l} compact>
                    {l.label}
                    <Underline />
                  </FooterAnchor>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

const COL_TITLE =
  "m-0 mb-2 font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-ink-dim";

function Underline() {
  return (
    <span
      aria-hidden
      className="absolute left-0 right-0 bottom-1.5 h-px origin-left scale-x-0 bg-[color:var(--color-accent)] transition-transform duration-200 ease-out group-hover:scale-x-100"
    />
  );
}

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h2 className={COL_TITLE}>{title}</h2>
      <ul className="flex flex-col gap-0 list-none p-0 m-0">
        {links.map((l) => (
          <li key={l.label}>
            <FooterAnchor link={l}>
              {l.label}
              {l.external && (
                <span aria-hidden className="ml-1 text-ink-dim">
                  ↗
                </span>
              )}
              <Underline />
            </FooterAnchor>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** A section of the home, another page of the site, or an outside link (new tab). */
function FooterAnchor({
  link,
  compact,
  children,
}: {
  link: FooterLink;
  /** Inline in a wrapping row: less vertical padding, still a 32px+ target. */
  compact?: boolean;
  children: React.ReactNode;
}) {
  const className = `group relative inline-block ${compact ? "py-1.5" : "py-2.5"} focus-ring text-[14px] text-ink-dim hover:text-ink transition-colors duration-150`;
  if (link.section) {
    return (
      <SectionLink to={link.section} className={className}>
        {children}
      </SectionLink>
    );
  }
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <PageLink to={link.href} className={className}>
      {children}
    </PageLink>
  );
}
