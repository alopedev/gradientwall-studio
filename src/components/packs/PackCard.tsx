import { Link } from "react-router-dom";
import type { Pack } from "@/lib/packs";
import { PackCover } from "./PackCover";

export function PackCard({ pack }: { pack: Pack }) {
  return (
    <Link
      to={`/packs/${pack.slug}`}
      className="group relative block rounded-[2px] overflow-hidden bg-[#0a0a0d] border border-white/8 transition-colors duration-200 hover:border-white/20"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black">
        <PackCover cover={pack.cover} w={720} h={960} className="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        <div className="absolute top-3 left-3 z-10 rounded-full bg-black/55 border border-white/14 px-2.5 py-1 font-sans text-[10px] tracking-[0.18em] uppercase text-white/80 backdrop-blur-md">
          {pack.style}
        </div>
        <div className="absolute top-3 right-3 z-10 rounded-[2px] bg-white/95 text-[#0a0a0d] px-2.5 py-1 font-sans text-[11px] font-medium tracking-tight">
          €{pack.priceEur.toFixed(2)}
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="display-head text-[20px] text-white leading-tight">{pack.name}</div>
        <div className="mt-1.5 font-serif italic text-[14px] text-white/60 leading-snug">{pack.tagline}</div>
        <div className="mt-3 font-sans text-[10px] tracking-[0.2em] uppercase text-white/40">
          {pack.previews.length} wallpapers · max resolution
        </div>
      </div>
    </Link>
  );
}
