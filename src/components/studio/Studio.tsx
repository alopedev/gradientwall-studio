import { Preview } from "./Preview";
import { ControlsPanel } from "./ControlsPanel";
import { History } from "./History";

export function Studio() {
  return (
    <section
      id="studio"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,9vw,120px)]"
    >
      {/* Section head */}
      <div className="grid md:grid-cols-2 gap-12 items-end mb-14">
        <div>
          <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
            02 — The studio
          </span>
          <h2 className="m-0 text-[clamp(40px,5.5vw,76px)] leading-[0.96] tracking-[-0.03em]">
            <span className="block font-sans font-light text-white">Pick four colors.</span>
            <span className="block font-serif italic text-white">Let them breathe.</span>
          </h2>
        </div>
        <p className="max-w-[42ch] text-[15px] text-white/75 font-sans font-light">
          Choose hues from our curated palettes or bring your own. Adjust the mix, the blobs, the grain —
          everything re-renders instantly. When it feels right, export for your device.
        </p>
      </div>

      {/* Studio grid — single column on mobile/tablet, asymmetric split on md+ */}
      <div className="grid gap-7 items-stretch grid-cols-1 md:[grid-template-columns:minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="min-h-[560px]">
          <Preview />
        </div>
        <ControlsPanel />
      </div>

      <History />
    </section>
  );
}
