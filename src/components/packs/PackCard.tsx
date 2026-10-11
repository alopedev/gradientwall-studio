import { Link } from "react-router-dom";
import { m } from "motion/react";
import { describeContents, isPhoneAndDesktop, type Pack } from "@/lib/packs";
import { coverRenders } from "@/lib/packs/showcase";
import { DeviceDuo } from "./DeviceFrames";
import { PackCover } from "./PackCover";

/**
 * Catalog card: the pack on a laptop and a phone over its own blurred colours,
 * with the name in serif italic and what's inside as a tag.
 */
export function PackCard({ pack }: { pack: Pack }) {
  const { phone, desktop } = coverRenders(pack);
  const glow = desktop ?? phone!;
  const price = `€${pack.priceEur.toFixed(2)}`;
  return (
    <Link
      to={`/packs/${pack.slug}`}
      className="group relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[20px] border border-white/8 bg-[#0a0a0d] transition-[border-color,box-shadow] duration-300 hover:border-white/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
    >
      {/* The pack's own colours, blurred, as the stage light behind the devices. */}
      <PackCover
        cover={glow}
        w={240}
        h={240}
        decorative
        className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to top, rgba(7,7,10,0.88) 0%, rgba(7,7,10,0.45) 45%, rgba(7,7,10,0) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center px-[clamp(20px,4vw,40px)] pt-12 pb-4">
        <DeviceDuo phone={phone} desktop={desktop} className="max-w-[520px]" />
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <m.h3
            layoutId={`pack-${pack.slug}-title`}
            className="m-0 font-serif italic font-normal text-[clamp(32px,3.4vw,48px)] leading-[0.95] tracking-tight text-white"
          >
            {pack.name}.
          </m.h3>
          <p className="m-0 mt-2 font-serif italic text-[15px] leading-snug text-white/80">
            {pack.tagline}
          </p>
          <ul className="m-0 mt-4 flex list-none flex-wrap gap-1.5 p-0">
            <Tag>{describeContents(pack)}</Tag>
            {isPhoneAndDesktop(pack) && <Tag>Phone + desktop</Tag>}
            <Tag>4K · 5K</Tag>
          </ul>
        </div>
        <span className="shrink-0 rounded-full bg-white/95 px-3 py-1.5 font-sans text-[13px] font-medium tracking-tight text-[#0a0a0d]">
          {price}
        </span>
      </div>
    </Link>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-white/14 bg-black/45 px-2.5 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/75 backdrop-blur-md">
      {children}
    </li>
  );
}
