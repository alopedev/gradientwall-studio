import { useShallow } from "zustand/react/shallow";
import { useConfigStore, useUIStore, save, type SourceTab } from "@/store";
import { seedToHex } from "@/lib/gradient";
import { STYLES, type Style } from "@/lib/palettes";
import { Swatches } from "./Swatches";
import { Palettes } from "./Palettes";
import { PillTabs } from "./PillTabs";

const SOURCE_TABS = ["picker", "palettes"] as const satisfies readonly SourceTab[];
const sourceLabel = (t: SourceTab) => (t === "picker" ? "Color picker" : "Palettes");

export function ControlsPanel() {
  const { style, blur, grain, seed, setStyle, setBlur, setGrain, reshuffle } = useConfigStore(
    useShallow((s) => ({
      style: s.style,
      blur: s.blur,
      grain: s.grain,
      seed: s.seed,
      setStyle: s.setStyle,
      setBlur: s.setBlur,
      setGrain: s.setGrain,
      reshuffle: s.reshuffle,
    })),
  );
  const { activeTab, setActiveTab } = useUIStore(
    useShallow((s) => ({ activeTab: s.activeTab, setActiveTab: s.setActiveTab })),
  );

  return (
    <div className="liquid p-7 flex flex-col gap-7">
      <div className="flex flex-col gap-3.5">
        <h3 className="m-0 font-serif font-normal italic text-[22px] tracking-[-0.01em] text-white">Source</h3>
        <PillTabs options={SOURCE_TABS} value={activeTab} onChange={setActiveTab} labelFor={sourceLabel} />
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

      <div className="flex flex-col gap-3.5">
        <LabelRow left="Style" right={style} />
        <PillTabs options={STYLES} value={style} onChange={(s: Style) => setStyle(s)} />
      </div>

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
