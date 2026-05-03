import { Preview } from "./Preview";
import { RightRail } from "./RightRail";
import { BottomBar } from "./BottomBar";
import { History } from "./History";
import { Reveal } from "../ui/Reveal";

export function Studio() {
  return (
    <section
      id="studio"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,9vw,120px)]"
    >
      {/* Section head */}
      <Reveal className="grid md:grid-cols-2 gap-12 items-end mb-14">
        <div>
          <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
            02 — The studio
          </span>
          <h2 className="m-0 text-[clamp(40px,5.5vw,76px)] leading-[0.95] font-sans font-bold uppercase tracking-[-0.03em] text-white">
            Pick four colors.
          </h2>
        </div>
        <p className="max-w-[42ch] text-[15px] text-white/75 font-sans font-light">
          Choose hues from our curated palettes or bring your own. Adjust the mix, the blobs, the grain —
          everything re-renders instantly. When it feels right, export for your device.
        </p>
      </Reveal>

      {/* Canvas-dominant split. Rail gets ~38% on desktop so the swatch grid +
          4-pill style bar breathe; mobile/tablet stack single-column. */}
      <div className="grid gap-7 items-start grid-cols-1 md:[grid-template-columns:minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col">
          <Preview />
          <BottomBar />
        </div>
        <RightRail />
      </div>

      <History />
    </section>
  );
}
