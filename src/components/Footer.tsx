export function Footer() {
  return (
    <footer className="mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] pt-20 pb-10 border-t border-white/8 grid grid-cols-2 md:grid-cols-4 gap-10">
      <div className="col-span-2 md:col-span-1">
        <div className="max-w-[18ch] font-sans font-light leading-[1.02] tracking-[-0.02em] text-[clamp(28px,3.5vw,44px)]">
          <span className="block text-white">Small tools for</span>
          <span className="block font-serif italic text-white/75">calmer screens.</span>
        </div>
        <div className="mt-6 font-sans text-[11px] tracking-[0.12em] uppercase text-white/40">
          GRADIENTWALL · EST. 2026
        </div>
      </div>

      <FooterCol
        title="Studio"
        links={[
          { label: "Create", href: "#studio" },
          { label: "Gallery", href: "#gallery" },
          { label: "Premium palettes", href: "#" },
          { label: "Changelog", href: "#" },
        ]}
      />
      <FooterCol
        title="About"
        links={[
          { label: "Manifesto", href: "#" },
          { label: "Journal", href: "#" },
          { label: "Contact", href: "#" },
        ]}
      />
      <FooterCol
        title="Elsewhere"
        links={[
          { label: "Instagram", href: "#" },
          { label: "Are.na", href: "#" },
          { label: "RSS", href: "#" },
        ]}
      />

      <div className="col-span-2 md:col-span-4 flex justify-between pt-10 mt-5 border-t border-white/8 font-sans text-[11px] tracking-[0.14em] uppercase text-white/40">
        <span>© 2026 GradientWall Studio</span>
        <span>Terms · Privacy · Cookies</span>
      </div>
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
            <a href={l.href} className="text-[14px] text-white/75 hover:text-white transition-colors duration-150">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
