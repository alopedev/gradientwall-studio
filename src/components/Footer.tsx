import { AI_DISCLOSURE, ETSY_PURCHASES_URL, ETSY_SHOP_URL } from "@/lib/copy";
import { landingLinks, PRIVACY_PAGE } from "@/lib/seo/pages";
import { isNewsletterEnabled } from "@/lib/newsletter/subscribe";
import { useConfigStore } from "@/store/useConfigStore";
import { EmailCapture } from "./EmailCapture";
import { Reveal } from "./ui/Reveal";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const MAKE: FooterLink[] = [
  { label: "Studio", href: "/#studio" },
  { label: "Packs", href: "/#packs" },
  { label: "Etsy shop", href: ETSY_SHOP_URL, external: true },
];

/** The landings, so every page links to them. */
const WALLPAPERS: FooterLink[] = landingLinks().map(({ href, label }) => ({
  href,
  label: label
    .replace(" Gradient Wallpapers for Desktop", " desktop")
    .replace(" Gradient Wallpapers", ""),
}));

const HELP: FooterLink[] = [
  { label: "Find your download", href: ETSY_PURCHASES_URL, external: true },
  { label: "Privacy", href: PRIVACY_PAGE.path },
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] pt-20 border-t border-ink">
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-12 pb-14">
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
        <Reveal delay={0.11}>
          <FooterCol title="Gradient wallpapers" links={WALLPAPERS} />
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

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="m-0 mb-2 font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-ink-dim">
        {title}
      </h2>
      <ul className="flex flex-col gap-0 list-none p-0 m-0">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group relative inline-block py-2.5 focus-ring text-[14px] text-ink-dim hover:text-ink transition-colors duration-150"
            >
              {l.label}
              {l.external && (
                <span aria-hidden className="ml-1 text-ink-dim">
                  ↗
                </span>
              )}
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-1.5 h-px origin-left scale-x-0 bg-[color:var(--color-accent)] transition-transform duration-200 ease-out group-hover:scale-x-100"
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
