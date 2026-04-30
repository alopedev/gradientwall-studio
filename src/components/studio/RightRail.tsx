import { useShallow } from "zustand/react/shallow";
import { useConfigStore, useUIStore, type SourceTab } from "@/store";
import { STYLES, type Style } from "@/lib/palettes";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/shadcn/accordion";
import { Slider } from "@/components/ui/shadcn/slider";
import { Swatches } from "./Swatches";
import { Palettes } from "./Palettes";
import { ImageSource } from "./ImageSource";
import { PillTabs } from "./PillTabs";
import { LightDial } from "./LightDial";

/**
 * Right rail of the Studio. Three accordion sections (Source / Style /
 * Effects), all open by default, individually collapsible. Each section is
 * indexed (01–03) with a numeric chip on the trigger; the active accordion
 * gets a hair-thin accent stripe on the leading edge to anchor focus.
 *
 * Output (device, download) lives in the BottomBar under the canvas — not
 * duplicated here. The seed and reshuffle also live in BottomBar.
 */
const SOURCE_TABS = ["picker", "palettes", "image"] as const satisfies readonly SourceTab[];
const sourceLabel = (t: SourceTab) =>
  t === "picker" ? "Picker" : t === "palettes" ? "Palettes" : "Image";

const COLOR_COUNT_LABEL: Record<2 | 3 | 4, string> = {
  2: "Two colors",
  3: "Three colors",
  4: "Four colors",
};

export function RightRail() {
  const { active, style, blur, grain, lightAngle, setStyle, setBlur, setGrain, setLightAngle } = useConfigStore(
    useShallow((s) => ({
      active: s.active,
      style: s.style,
      blur: s.blur,
      grain: s.grain,
      lightAngle: s.lightAngle,
      setStyle: s.setStyle,
      setBlur: s.setBlur,
      setGrain: s.setGrain,
      setLightAngle: s.setLightAngle,
    })),
  );
  const { activeTab, setActiveTab } = useUIStore(
    useShallow((s) => ({ activeTab: s.activeTab, setActiveTab: s.setActiveTab })),
  );
  const activeCount = active.filter(Boolean).length as 2 | 3 | 4;

  return (
    <aside
      aria-label="Studio controls"
      className="rounded-[2px] border border-white/10 bg-[color:var(--color-surface-1)] shadow-[0_24px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col overflow-hidden"
    >
      <Accordion type="multiple" defaultValue={["source", "style", "effects"]} className="w-full">
        <Section index="01" value="source" title="Source">
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
        </Section>

        <Section index="02" value="style" title="Style">
          <div className="flex flex-col gap-3.5">
            <LabelRow left="Composition" right={style} />
            <PillTabs options={STYLES} value={style} onChange={(s: Style) => setStyle(s)} />
          </div>
        </Section>

        <Section index="03" value="effects" title="Effects">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <LabelRow left="Softness" right={`${blur}px`} />
              <Slider value={[blur]} min={10} max={120} step={1} onValueChange={(v) => setBlur(v[0]!)} />
            </div>
            <div className="flex flex-col gap-3">
              <LabelRow left="Grain" right={`${grain}%`} />
              <Slider value={[grain]} min={0} max={100} step={1} onValueChange={(v) => setGrain(v[0]!)} />
            </div>
            <div className="flex items-start justify-between gap-4 pt-1">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-white/40">
                  Light direction
                </span>
                <span className="font-serif italic text-white/65 text-[15px] leading-tight">
                  {compassLabel(lightAngle)}
                </span>
                <span className="font-sans text-[10px] text-white/40 mt-1 tracking-wider">{lightAngle}°</span>
              </div>
              <LightDial value={lightAngle} onChange={setLightAngle} />
            </div>
          </div>
        </Section>
      </Accordion>
    </aside>
  );
}

function Section({
  index,
  value,
  title,
  children,
}: {
  index: string;
  value: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="border-b border-white/8 last:border-b-0 px-4 data-[state=open]:bg-[color:var(--color-surface-2)]/40"
    >
      <AccordionTrigger className="py-4 px-0">
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-[2px] border border-white/12 bg-[color:var(--color-surface-3)] font-sans text-[9px] tracking-[0.06em] text-white/55">
            {index}
          </span>
          <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-white/55 group-data-[state=open]:text-white">
            {title}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5 pt-1 px-0">{children}</AccordionContent>
    </AccordionItem>
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

/**
 * Map a compass-style angle to a human-friendly cardinal label. The renderer
 * uses the numeric value; the label is purely UX glue so the user can read
 * the direction at a glance ("North-East" feels different from "247°").
 */
function compassLabel(deg: number): string {
  const labels = [
    "North",
    "Northeast",
    "East",
    "Southeast",
    "South",
    "Southwest",
    "West",
    "Northwest",
  ];
  const idx = Math.round(deg / 45) % 8;
  return labels[idx] ?? "North";
}
