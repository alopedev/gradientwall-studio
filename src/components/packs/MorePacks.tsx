import { Link } from "react-router-dom";
import { getPacks } from "@/lib/packs";
import { useRenderParams } from "@/store";
import { useWallpaperEngine } from "../studio/engine";
import { inkButton } from "../ui/InkButton";
import { PackCard } from "./PackCard";

/**
 * The end of a pack page: the other packs, plus the free Studio, so a visitor
 * who doesn't buy this one still has somewhere to go.
 */
export function MorePacks({ currentSlug }: { currentSlug: string }) {
  const others = getPacks().filter((p) => p.slug !== currentSlug);
  return (
    <section
      aria-labelledby="more-packs-title"
      className="mx-auto max-w-[1600px] border-t border-ink px-[clamp(16px,4vw,56px)] py-[clamp(40px,6vw,88px)]"
    >
      <h2 id="more-packs-title" className="display-head mb-8 text-[clamp(32px,4vw,52px)] text-ink">
        more packs
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {others.map((p) => (
          <div key={p.slug} className="h-full">
            <PackCard pack={p} />
          </div>
        ))}
        <StudioCard />
      </div>
    </section>
  );
}

/** The live wallpaper from the Studio, with a link to make one. */
function StudioCard() {
  const engine = useWallpaperEngine();
  const params = useRenderParams();
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-sharp border-2 border-ink">
      <div className="relative min-h-[220px] flex-1 bg-bg-2">
        <engine.Canvas
          params={params}
          device="desktop"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink p-5">
        <div>
          <p className="display-head m-0 text-[26px] leading-none text-ink">or make your own</p>
          <p className="m-0 mt-2 font-sans text-[13px] text-ink-dim">
            Free, in your browser, no account.
          </p>
        </div>
        <Link to="/#studio" className={`${inkButton({ variant: "primary" })} px-5`}>
          Open the Studio <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
