import { Settings2, X } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { Slider } from "@/components/ui/shadcn/slider";
import { useConfigStore } from "@/store";
import { HarmonicWheel } from "../HarmonicWheel";
import { PaletteCards } from "../PaletteCards";
import { UseMyPhotoButton } from "../UseMyPhotoButton";

/**
 * CustomizePanel — bandeja de potencia del Studio v2 (rediseño).
 *
 * Layout single column (panel 420px wide tras feedback v4):
 *
 *  ┌── header ─────────────────────────┐
 *  │  CUSTOMIZE                   [×]  │
 *  ├───────────────────────────────────┤
 *  │  COLORS                           │
 *  │  • HarmonicWheel (circular)       │
 *  │    + anillo de luz + bullets +    │
 *  │    eyedropper + ColorSelector     │
 *  │    dots                           │
 *  │                                   │
 *  │  PALETTES                         │
 *  │  • PaletteCards stack vertical    │
 *  │    (4 cards featured)             │
 *  │  • Use my photo                   │
 *  ├───────────────────────────────────┤
 *  │  SOFTNESS slider                  │
 *  │  GRAIN slider                     │
 *
 * Eliminados del CustomizePanel v1/v2 anterior:
 * - Style picker (style hardcoded a "liquid" en surprise/remix).
 * - Light direction (LightDial absorbido por el anillo del HarmonicWheel).
 * - Density (no producía cambio visual en Canvas2D, solo en Nebula WebGL).
 * - Swatches grid + ColorHUD popover (reemplazado por HarmonicWheel).
 * - Palettes legacy chip list (reemplazado por PaletteCards).
 *
 * Añadido:
 * - Grain slider (antes existía en el store con default 18 pero no se exponía).
 */

interface Props {
  /** Handler para cerrar el panel — disparado por el botón X interno y Escape. */
  onClose: () => void;
}

export function CustomizePanel({ onClose }: Props) {
  const blur = useConfigStore((s) => s.blur);
  const setBlur = useConfigStore((s) => s.setBlur);
  const grain = useConfigStore((s) => s.grain);
  const setGrain = useConfigStore((s) => s.setGrain);

  return (
    <div
      role="dialog"
      aria-label="Customize colors, light, softness and grain"
      className="glass-modern flex h-full w-full flex-col overflow-y-auto rounded-[10px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/6 px-5 py-3.5">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-white/55">
          Customize
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close customize panel"
          className="focus-ring inline-flex size-7 items-center justify-center rounded-[4px] text-white/55 transition-colors hover:bg-white/8 hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Body: stack vertical (single column) */}
      <div className="flex flex-col gap-6 px-5 py-5">
        <Section title="Colors">
          <HarmonicWheel />
        </Section>

        <Section title="Palettes">
          <PaletteCards />
          <div className="mt-3 flex justify-center">
            <UseMyPhotoButton />
          </div>
        </Section>
      </div>

      {/* Footer fullwidth: sliders */}
      <div className="flex flex-col gap-4 border-t border-white/6 px-5 py-4">
        <SliderSection
          title="Softness"
          metric={`${blur}px`}
          value={blur}
          min={10}
          max={120}
          step={1}
          onChange={setBlur}
        />
        <SliderSection
          title="Grain"
          metric={`${grain}%`}
          value={grain}
          min={0}
          max={100}
          step={1}
          onChange={setGrain}
        />
      </div>
    </div>
  );
}

/** Sección con label uppercase consistente. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/45">
        {title}
      </span>
      {children}
    </div>
  );
}

interface SliderSectionProps {
  title: string;
  metric: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}

function SliderSection({ title, metric, value, min, max, step, onChange }: SliderSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/45">
          {title}
        </span>
        <span className="font-sans text-[11px] tabular-nums text-white/65">{metric}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0]!)}
        aria-label={title}
      />
    </div>
  );
}

/**
 * Trigger button del panel. `forwardRef` se mantiene por si en futuro vuelve a
 * usarse como child de un Slot (Radix DropdownMenu). Para el flujo actual basta
 * como botón controlado por su onClick.
 *
 * `pressed` activa el estado "is open" visualmente (botón hundido), para que
 * el usuario sepa que ese click es el que abrió la bandeja.
 */
interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
}

export const CustomizeTriggerButton = forwardRef<HTMLButtonElement, TriggerProps>(
  function CustomizeTriggerButton({ pressed = false, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        title="Customize colors, light, softness, grain"
        aria-label="Customize colors, light, softness and grain"
        className={`tactile inline-flex items-center gap-1.5 rounded-[2px] px-3 py-2 font-sans text-[11px] uppercase tracking-[0.14em] transition-colors ${
          pressed ? "text-white" : "text-white/85 hover:text-white"
        } ${className ?? ""}`}
        {...props}
      >
        <Settings2 className="size-3.5" aria-hidden />
        Customize
      </button>
    );
  },
);
