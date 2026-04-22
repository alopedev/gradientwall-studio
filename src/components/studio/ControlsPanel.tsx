import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { m } from "motion/react";
import { useConfigStore, useUIStore, save, type SourceTab } from "@/store";
import { seedToHex } from "@/lib/gradient";
import { STYLES, type Style } from "@/lib/palettes";
import { EASE } from "@/lib/motion";
import { Swatches } from "./Swatches";
import { Palettes } from "./Palettes";
import { ImageSource } from "./ImageSource";
import { PillTabs } from "./PillTabs";

const SOURCE_TABS = ["picker", "palettes", "image"] as const satisfies readonly SourceTab[];
const sourceLabel = (t: SourceTab) =>
  t === "picker" ? "Color picker" : t === "palettes" ? "Palettes" : "From image";

const COLOR_COUNT_LABEL: Record<2 | 3 | 4, string> = {
  2: "Two colors",
  3: "Three colors",
  4: "Four colors",
};

export function ControlsPanel() {
  const { active, style, blur, grain, seed, setStyle, setBlur, setGrain, reshuffle } = useConfigStore(
    useShallow((s) => ({
      active: s.active,
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

  const activeCount = active.filter(Boolean).length as 2 | 3 | 4;

  return (
    <div className="liquid-subtle rounded-[2px] border border-white/8 p-8 flex flex-col gap-8">
      <div className="flex flex-col gap-3.5">
        <SectionTitle eyebrow="01 · Source" title="Where the colors come from." />
        <PillTabs options={SOURCE_TABS} value={activeTab} onChange={setActiveTab} labelFor={sourceLabel} />
      </div>

      {activeTab === "picker" ? (
        <div className="flex flex-col gap-3.5">
          <LabelRow left={COLOR_COUNT_LABEL[activeCount]} right={`mix · ${activeCount}/4`} />
          <Swatches />
        </div>
      ) : activeTab === "palettes" ? (
        <div className="flex flex-col gap-3.5">
          <LabelRow left="Curated" right="2 free · more on Premium" />
          <Palettes />
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <LabelRow left="Upload" right="k-means · 4 colors" />
          <ImageSource />
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
          <ReshuffleButton onClick={reshuffle} />
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

function ReshuffleButton({ onClick }: { onClick: () => void }) {
  // Track how many times the user has reshuffled — each press adds 360° to
  // the rotation target so Motion animates a full spin every click.
  const [spins, setSpins] = useState(0);
  return (
    <button
      onClick={() => {
        onClick();
        setSpins((s) => s + 1);
      }}
      className="flex-1 inline-flex items-center justify-center gap-2 rounded-[2px] border border-white/14 text-white px-3.5 py-3 text-xs font-sans tracking-[0.14em] uppercase transition-colors duration-150 hover:bg-white/5 hover:border-white/30"
    >
      <m.span
        aria-hidden
        animate={{ rotate: spins * 360 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="inline-block"
      >
        ↻
      </m.span>
      Reshuffle
    </button>
  );
}

function LabelRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between items-baseline font-sans text-[11px] tracking-[0.18em] uppercase text-white/40">
      <span>{left}</span>
      <span className="text-white/55 tracking-[0.08em] text-[10px]">{right}</span>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <span className="block font-sans text-[10px] tracking-[0.22em] uppercase text-white/40">{eyebrow}</span>
      <h3 className="m-0 mt-1.5 font-serif italic font-normal text-[22px] leading-[1.1] text-white">{title}</h3>
    </div>
  );
}
