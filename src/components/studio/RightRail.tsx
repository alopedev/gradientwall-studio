import { useShallow } from "zustand/react/shallow";
import { useConfigStore, useUIStore, type SourceTab } from "@/store";
import { STYLES, type Style } from "@/lib/palettes";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/shadcn/accordion";
import { Slider } from "@/components/ui/shadcn/slider";
import { Swatches } from "./Swatches";
import { Palettes } from "./Palettes";
import { ImageSource } from "./ImageSource";
import { PillTabs } from "./PillTabs";

/**
 * Right rail of the Studio — replaces the old monolithic ControlsPanel.
 * Three accordion sections (Source / Style / Effects), all open by default,
 * collapsible individually so power users can hide what they don't need.
 *
 * Output (device, download) lives in the BottomBar under the canvas, so it's
 * not duplicated here. The seed editor and reshuffle also live in BottomBar.
 */
const SOURCE_TABS = ["picker", "palettes", "image"] as const satisfies readonly SourceTab[];
const sourceLabel = (t: SourceTab) =>
  t === "picker" ? "Color picker" : t === "palettes" ? "Palettes" : "From image";

const COLOR_COUNT_LABEL: Record<2 | 3 | 4, string> = {
  2: "Two colors",
  3: "Three colors",
  4: "Four colors",
};

export function RightRail() {
  const { active, style, blur, grain, setStyle, setBlur, setGrain } = useConfigStore(
    useShallow((s) => ({
      active: s.active,
      style: s.style,
      blur: s.blur,
      grain: s.grain,
      setStyle: s.setStyle,
      setBlur: s.setBlur,
      setGrain: s.setGrain,
    })),
  );
  const { activeTab, setActiveTab } = useUIStore(
    useShallow((s) => ({ activeTab: s.activeTab, setActiveTab: s.setActiveTab })),
  );
  const activeCount = active.filter(Boolean).length as 2 | 3 | 4;

  return (
    <aside
      aria-label="Studio controls"
      className="liquid-subtle rounded-[2px] border border-white/8 px-6 py-2 flex flex-col"
    >
      <Accordion type="multiple" defaultValue={["source", "style", "effects"]} className="w-full">
        <AccordionItem value="source">
          <AccordionTrigger>01 · Source</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3.5">
              <PillTabs options={SOURCE_TABS} value={activeTab} onChange={setActiveTab} labelFor={sourceLabel} />
              {activeTab === "picker" ? (
                <div className="flex flex-col gap-3.5">
                  <LabelRow left={COLOR_COUNT_LABEL[activeCount]} right={`mix · ${activeCount}/4`} />
                  <Swatches />
                </div>
              ) : activeTab === "palettes" ? (
                <div className="flex flex-col gap-3.5">
                  <LabelRow left="Curated" right="6 in the deck" />
                  <Palettes />
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <LabelRow left="Upload" right="k-means · 4 colors" />
                  <ImageSource />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="style">
          <AccordionTrigger>02 · Style</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3.5">
              <LabelRow left="Composition" right={style} />
              <PillTabs options={STYLES} value={style} onChange={(s: Style) => setStyle(s)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="effects">
          <AccordionTrigger>03 · Effects</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <LabelRow left="Softness" right={`${blur}px`} />
                <Slider value={[blur]} min={10} max={120} step={1} onValueChange={(v) => setBlur(v[0]!)} />
              </div>
              <div className="flex flex-col gap-3">
                <LabelRow left="Grain" right={`${grain}%`} />
                <Slider value={[grain]} min={0} max={100} step={1} onValueChange={(v) => setGrain(v[0]!)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
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
