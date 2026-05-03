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
const SOURCE_TABS = ["palettes", "picker", "image"] as const satisfies readonly SourceTab[];
const sourceLabel = (t: SourceTab) =>
  t === "picker" ? "Picker" : t === "palettes" ? "Palettes" : "Image";

const COLOR_COUNT_LABEL: Record<2 | 3 | 4, string> = {
  2: "Two colors",
  3: "Three colors",
  4: "Four colors",
};

export function RightRail() {
  const {
    active,
    style,
    blur,
    grain,
    lightAngle,
    brightness,
    contrast,
    vibrance,
    setStyle,
    setBlur,
    setGrain,
    setLightAngle,
    setBrightness,
    setContrast,
    setVibrance,
  } = useConfigStore(
    useShallow((s) => ({
      active: s.active,
      style: s.style,
      blur: s.blur,
      grain: s.grain,
      lightAngle: s.lightAngle,
      brightness: s.brightness,
      contrast: s.contrast,
      vibrance: s.vibrance,
      setStyle: s.setStyle,
      setBlur: s.setBlur,
      setGrain: s.setGrain,
      setLightAngle: s.setLightAngle,
      setBrightness: s.setBrightness,
      setContrast: s.setContrast,
      setVibrance: s.setVibrance,
    })),
  );
  const { activeTab, setActiveTab } = useUIStore(
    useShallow((s) => ({ activeTab: s.activeTab, setActiveTab: s.setActiveTab })),
  );
  const activeCount = active.filter(Boolean).length as 2 | 3 | 4;

  return (
    <aside
      aria-label="Studio controls"
      className="relative flex flex-col gap-3 p-3 rounded-[18px] bg-white/[0.015] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_28px_60px_rgba(0,0,0,0.45)] overflow-hidden"
    >
      {/* Atmosphere bloom — single low-opacity radial behind the tiles, in
          accent hue, very faint. Reads as a distant light source warming
          the rail without competing with the canvas preview. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[20%] left-1/2 -translate-x-1/2 h-[70%] w-[140%] opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(255, 59, 48, 0.05), transparent 70%)",
        }}
      />
      <Accordion
        type="multiple"
        defaultValue={["source", "style", "effects"]}
        className="relative z-[1] flex flex-col gap-2.5"
      >
        <Section
          index="01"
          value="source"
          title="Source"
          hint={sourceLabel(activeTab)}
        >
          <div className="flex flex-col gap-3.5">
            <PillTabs options={SOURCE_TABS} value={activeTab} onChange={setActiveTab} labelFor={sourceLabel} />
            {activeTab === "picker" ? (
              <div className="flex flex-col gap-3.5">
                <LabelRow left={COLOR_COUNT_LABEL[activeCount]} right={`mix · ${activeCount}/4`} />
                <Swatches />
              </div>
            ) : activeTab === "palettes" ? (
              <div className="flex flex-col gap-3.5">
                <LabelRow left="Curated" right="10 in the deck" />
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

        <Section index="02" value="style" title="Style" hint={style}>
          <div className="flex flex-col gap-3.5">
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
            <div className="flex flex-col gap-3">
              <LabelRow left="Brightness" right={`${Math.round(brightness * 100)}%`} />
              <Slider
                value={[brightness]}
                min={0.5}
                max={1.5}
                step={0.01}
                onValueChange={(v) => setBrightness(v[0]!)}
              />
            </div>
            <div className="flex flex-col gap-3">
              <LabelRow left="Contrast" right={`${Math.round(contrast * 100)}%`} />
              <Slider
                value={[contrast]}
                min={0.5}
                max={1.5}
                step={0.01}
                onValueChange={(v) => setContrast(v[0]!)}
              />
            </div>
            <div className="flex flex-col gap-3">
              <LabelRow left="Vibrance" right={`${Math.round(vibrance * 100)}%`} />
              <Slider
                value={[vibrance]}
                min={0.5}
                max={1.5}
                step={0.01}
                onValueChange={(v) => setVibrance(v[0]!)}
              />
            </div>
            <div className="flex items-start justify-between gap-4 pt-1">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-white/40">
                  Light direction
                </span>
                <span className="font-sans text-white/85 text-[14px] font-medium leading-tight tracking-tight">
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
  hint,
  children,
}: {
  index: string;
  value: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="instrument-tile px-4 border-b-0 group/tile data-[state=closed]:pb-0 data-[state=open]:pb-4"
    >
      <AccordionTrigger className="py-3.5 px-0 hover:no-underline">
        <span className="flex flex-1 items-center gap-3 min-w-0">
          <span className="instrument-chip flex-shrink-0">{index}</span>
          <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-white/55 group-data-[state=open]/tile:text-white/95 transition-colors">
            {title}
          </span>
          {hint ? (
            <span className="ml-auto mr-2 font-sans text-white/65 text-[10px] font-medium leading-none tracking-[0.18em] uppercase truncate max-w-[42%]">
              {hint}
            </span>
          ) : null}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pt-1 pb-0 px-0">{children}</AccordionContent>
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
