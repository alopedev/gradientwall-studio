import { AI_DISCLOSURE, ETSY_SHOP_URL } from "@/lib/copy";
import { useConfigStore } from "@/store/useConfigStore";
import { EmailCapture } from "./EmailCapture";
import { Reveal } from "./ui/Reveal";

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] pt-20 pb-10 border-t border-white/8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10">
      <Reveal>
        <div className="max-w-[18ch] leading-[0.98] tracking-[-0.03em] text-[clamp(28px,3.5vw,44px)]">
          <span className="block font-sans font-bold uppercase text-white">Small tools for</span>
          <span className="block font-sans font-bold uppercase text-white/80 mt-1">
            calmer screens.
          </span>
        </div>
        <div className="mt-6 font-sans text-[11px] tracking-[0.12em] uppercase text-white/55">
          GradientWall · Made in Tarragona
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <FooterCol
          title="Get started"
          links={[
            { label: "Studio", href: "/#studio" },
            { label: "Packs", href: "/#packs" },
            { label: "Etsy shop", href: ETSY_SHOP_URL },
            { label: "Recover download", href: "/recover" },
          ]}
        />
      </Reveal>

      <EmailCapture
        source="footer"
        heading="New packs and Studio features, in your inbox."
        className="relative md:col-span-2 max-w-[520px]"
      />

      <Reveal delay={0.2} className="md:col-span-2 pt-10 mt-5 border-t border-white/8">
        <div className="flex flex-wrap justify-between gap-4 font-sans text-[11px] tracking-[0.14em] uppercase text-white/55">
          <span>© 2026 GradientWall</span>
          <span className="max-w-[56ch] normal-case tracking-normal text-[12px] sm:text-right">
            Pack artwork: {AI_DISCLOSURE.charAt(0).toLowerCase() + AI_DISCLOSURE.slice(1)}
          </span>
        </div>
      </Reveal>

      <Wordmark />
    </footer>
  );
}

/**
 * The brand name, huge, filled with the Studio's current palette: shuffle a
 * wallpaper and the footer picks up its colours. Decorative (the brand text
 * is already in the nav and the copyright line), so it is hidden from
 * assistive tech.
 */
function Wordmark() {
  const colors = useConfigStore((s) => s.colors);
  const [c0, c1, c2, c3] = colors;
  return (
    <Reveal className="md:col-span-2 -mb-2 select-none overflow-hidden">
      <div
        aria-hidden
        className="font-sans font-bold uppercase leading-[0.82] tracking-[-0.055em] text-center text-transparent bg-clip-text text-[clamp(40px,12.4vw,200px)]"
        style={{
          backgroundImage: `radial-gradient(70% 130% at 12% 15%, ${c0}, transparent 62%), radial-gradient(70% 130% at 88% 5%, ${c1}, transparent 62%), radial-gradient(80% 150% at 50% 115%, ${c2}, transparent 62%)`,
          backgroundColor: c3,
        }}
      >
        GradientWall
      </div>
    </Reveal>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="m-0 mb-3.5 font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-white/55">
        {title}
      </h4>
      <ul className="flex flex-col gap-0 list-none p-0 m-0">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="group relative inline-block py-3 focus-ring text-[14px] text-white/75 hover:text-white transition-colors duration-150"
            >
              {l.label}
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-2 h-px origin-left scale-x-0 bg-[color:var(--color-accent)] transition-transform duration-200 ease-out group-hover:scale-x-100"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
