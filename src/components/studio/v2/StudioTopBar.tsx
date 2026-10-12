import { Monitor, Smartphone, Tablet } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { SegmentedControl, type SegmentOption } from "@/components/ui/SegmentedControl";
import { paletteName } from "@/lib/palette-name";
import { type Device, DEVICE_SIZES } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { useWallpaperEngine } from "../engine";

const DEVICE_OPTIONS: readonly SegmentOption<Device>[] = [
  {
    value: "mobile",
    label: "Phone",
    icon: <Smartphone className="size-[18px]" aria-hidden />,
    iconOnlyWhenNarrow: true,
  },
  {
    value: "tablet",
    label: "Tablet",
    icon: <Tablet className="size-[18px]" aria-hidden />,
    iconOnlyWhenNarrow: true,
  },
  {
    value: "desktop",
    label: "Desktop",
    icon: <Monitor className="size-[18px]" aria-hidden />,
    iconOnlyWhenNarrow: true,
  },
];

/** Studio name + current look on the left, device switch on the right. */
export function StudioTopBar() {
  const engine = useWallpaperEngine();
  const colors = useConfigStore((s) => s.colors);
  const style = useConfigStore((s) => s.style);
  const device = useConfigStore((s) => s.device);
  const setDevice = useConfigStore((s) => s.setDevice);
  const name = paletteName(colors);
  const styleLabel = engine.styles.find((o) => o.id === style)?.label ?? style;

  return (
    <header className="relative z-[5] flex items-center justify-between gap-3 px-[18px] pb-1.5 pt-4 @max-[760px]:px-3.5 @max-[760px]:pb-1 @max-[760px]:pt-3.5">
      <div className="grid min-w-0 gap-0.5">
        <span className="truncate font-sans text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-dim">
          Gradientwall · Studio
        </span>
        <div className="relative h-[1.9rem] overflow-hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={`${name}-${style}`}
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -22, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 flex items-baseline gap-2 whitespace-nowrap"
            >
              <b className="font-display text-[1.6rem] font-medium lowercase leading-[1.15] text-ink @max-[760px]:text-[1.4rem]">
                {name}
              </b>
              <em className="font-sans text-[0.72rem] font-medium not-italic uppercase tracking-[0.16em] text-ink-dim">
                {styleLabel}
              </em>
            </m.span>
          </AnimatePresence>
        </div>
      </div>
      <SegmentedControl
        ariaLabel="Device"
        value={device}
        onChange={setDevice}
        options={DEVICE_OPTIONS}
      />
      <span className="sr-only">Export size {DEVICE_SIZES[device].label}</span>
    </header>
  );
}
