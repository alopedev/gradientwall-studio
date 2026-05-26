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
        <div className="mt-6 font-sans text-[11px] tracking-[0.12em] uppercase text-white/40">
          GRADIENTWALL · EST. 2026
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <FooterCol
          title="Get started"
          links={[
            { label: "Studio", href: "/#studio" },
            { label: "Packs", href: "/#packs" },
            { label: "Recover download", href: "/recover" },
          ]}
        />
      </Reveal>

      <Reveal delay={0.2} className="md:col-span-2 pt-10 mt-5 border-t border-white/8">
        <div className="flex flex-wrap justify-between gap-4 font-sans text-[11px] tracking-[0.14em] uppercase text-white/40">
          <span>© 2026 GradientWall</span>
          <span>Terms · Privacy · Cookies</span>
        </div>
      </Reveal>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="m-0 mb-3.5 font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-white/40">
        {title}
      </h4>
      <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="group relative inline-block focus-ring text-[14px] text-white/75 hover:text-white transition-colors duration-150"
            >
              {l.label}
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-0.5 h-px origin-left scale-x-0 bg-[color:var(--color-accent)] transition-transform duration-200 ease-out group-hover:scale-x-100"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
