import { useStudioStore } from "@/store/useStudioStore";
import { seedToHex } from "@/lib/gradient";
import { Swatches } from "./Swatches";
import { Palettes } from "./Palettes";

const STYLES = ["mesh", "blobs", "liquid"] as const;

export function ControlsPanel() {
  const activeTab = useStudioStore((s) => s.activeTab);
  const setActiveTab = useStudioStore((s) => s.setActiveTab);
  const style = useStudioStore((s) => s.style);
  const setStyle = useStudioStore((s) => s.setStyle);
  const blur = useStudioStore((s) => s.blur);
  const setBlur = useStudioStore((s) => s.setBlur);
  const grain = useStudioStore((s) => s.grain);
  const setGrain = useStudioStore((s) => s.setGrain);
  const seed = useStudioStore((s) => s.seed);
  const reshuffle = useStudioStore((s) => s.reshuffle);
  const save = useStudioStore((s) => s.save);

  return (
    <div className="liquid p-7 flex flex-col gap-7">
      {/* Source */}
      <div className="flex flex-col gap-3.5">
        <h3 className="m-0 font-serif font-normal italic text-[22px] tracking-[-0.01em] text-white">Source</h3>
        <div className="flex justify-center md:justify-start">
          <div className="inline-flex p-1 gap-1 rounded-full liquid-subtle">
            {(["picker", "palettes"] as const).map((t) => {
              const active = activeTab === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`rounded-full px-3.5 py-2 text-xs font-sans tracking-[0.08em] uppercase transition-colors duration-150 ${
                    active ? "bg-white text-[#07070a]" : "text-white/75 hover:text-white"
                  }`}
                >
                  {t === "picker" ? "Color picker" : "Palettes"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === "picker" ? (
        <div className="flex flex-col gap-3.5">
          <LabelRow left="Four colors" right="mix · 4/4" />
          <Swatches />
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <LabelRow left="Curated" right="2 free · more on Premium" />
          <Palettes />
        </div>
      )}

      {/* Style */}
      <div className="flex flex-col gap-3.5">
        <LabelRow left="Style" right={style} />
        <div className="flex justify-center md:justify-start">
          <div className="inline-flex p-1 gap-1 rounded-full liquid-subtle">
            {STYLES.map((s) => {
              const active = style === s;
              return (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`rounded-full px-3.5 py-2 text-xs font-sans tracking-[0.08em] uppercase transition-colors duration-150 ${
                    active ? "bg-white text-[#07070a]" : "text-white/75 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Blur */}
      <div className="flex flex-col gap-3.5">
        <LabelRow left="Softness" right={`${blur}px`} />
        <input
          type="range"
          min={10}
          max={120}
          value={blur}
          onChange={(e) => setBlur(+e.target.value)}
          className="gw-slider"
        />
      </div>

      {/* Grain */}
      <div className="flex flex-col gap-3.5">
        <LabelRow left="Grain" right={`${grain}%`} />
        <input
          type="range"
          min={0}
          max={100}
          value={grain}
          onChange={(e) => setGrain(+e.target.value)}
          className="gw-slider"
        />
      </div>

      {/* Seed actions */}
      <div className="flex flex-col gap-3.5">
        <LabelRow left="Composition" right={seedToHex(seed)} />
        <div className="flex gap-2">
          <button
            onClick={reshuffle}
            className="flex-1 rounded-[2px] border border-white/14 text-white px-3.5 py-3 text-xs font-sans tracking-[0.14em] uppercase transition-colors duration-150 hover:bg-white/5 hover:border-white/30"
          >
            Reshuffle
          </button>
          <button
            onClick={save}
            className="flex-1 rounded-[2px] bg-[#f8f8f8] text-[#171717] px-3.5 py-3 text-xs font-sans font-medium tracking-[0.14em] uppercase transition-colors duration-150 hover:bg-white"
          >
            Save to history
          </button>
        </div>
      </div>
    </div>
  );
}

function LabelRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between items-baseline font-sans text-[11px] tracking-[0.18em] uppercase text-white/40">
      <span>{left}</span>
      <span className="text-white/75 tracking-[0.08em]">{right}</span>
    </div>
  );
}
