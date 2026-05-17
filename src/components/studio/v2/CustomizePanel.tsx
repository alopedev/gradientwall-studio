import { Settings2, X } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { Slider } from "@/components/ui/shadcn/slider";
import { STYLES, type Style } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { LightDial } from "../LightDial";
import { Swatches } from "../Swatches";
import { UseMyPhotoButton } from "../UseMyPhotoButton";
import { StyleThumbnail } from "./StyleThumbnail";

/**
 * CustomizePanel — bandeja de potencia que vive **inline** dentro del
 * StudioShell, NO como overlay. Cuando el usuario aprieta Customize en el
 * ActionRow, el shell reordena su layout para que el canvas Preview se
 * encoja a la izquierda y el panel aparezca a la derecha — animado con
 * `motion` layout. El feedback visual de cada control sigue siendo
 * inmediato sobre el wallpaper porque ambos viven en el mismo viewport,
 * sin tapado.
 *
 * Diferencia con la versión anterior (`CustomizePopover` con Radix
 * Popover): el state `open` se subió al StudioShell para que pueda
 * coreografiar el layout del canvas. Aquí solo se renderiza el contenido.
 *
 * Cinco bloques verticales en utilidad glass-modern:
 * 1. Style — 4 thumbnails grandes (paleta actual + cada style).
 * 2. Colors — Swatches + UseMyPhotoButton (centrado).
 * 3. Light direction — dial + lectura de ángulo.
 * 4. Density — slider 0..1.
 * 5. Softness — slider 10..120 (renombrado de "Blur" en v1).
 *
 * Eliminados respecto al RightRail v1: contrast, vibrance, grain.
 */

const STYLE_LABELS: Record<Style, string> = {
  mesh: "Mesh",
  liquid: "Liquid",
  aurora: "Aurora",
  nebula: "Nebula",
};

interface Props {
  /** Handler para cerrar el panel — disparado por el botón X interno y Escape. */
  onClose: () => void;
}

export function CustomizePanel({ onClose }: Props) {
  const style = useConfigStore((s) => s.style);
  const setStyle = useConfigStore((s) => s.setStyle);
  const blur = useConfigStore((s) => s.blur);
  const setBlur = useConfigStore((s) => s.setBlur);
  const density = useConfigStore((s) => s.density);
  const setDensity = useConfigStore((s) => s.setDensity);
  const lightAngle = useConfigStore((s) => s.lightAngle);
  const setLightAngle = useConfigStore((s) => s.setLightAngle);

  return (
    <div
      role="dialog"
      aria-label="Customize style, colors, light and density"
      className="glass-modern flex h-full flex-col gap-5 overflow-y-auto rounded-[10px] p-4"
    >
      {/* Header bar con título + close. El close vive aquí (no en ActionRow)
          para que el panel sea autocontenido. */}
      <div className="flex items-center justify-between">
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

      {/* Style picker */}
      <Section title="Style">
        <div className="grid grid-cols-4 gap-1.5">
          {STYLES.map((s) => (
            <StyleThumbnail
              key={s}
              style={s}
              label={STYLE_LABELS[s]}
              selected={s === style}
              onSelect={setStyle}
            />
          ))}
        </div>
      </Section>

      {/* Colors + image source */}
      <Section title="Colors">
        <div className="flex flex-col gap-2.5">
          <Swatches />
          {/* UseMyPhotoButton tiene `self-start` interno (alineado a la
              izquierda para el RightRail de v1). En v2 lo centramos
              envolviéndolo con `justify-center` sin tocar el componente. */}
          <div className="flex justify-center">
            <UseMyPhotoButton />
          </div>
        </div>
      </Section>

      {/* Light direction */}
      <Section title="Light direction">
        <div className="flex items-center gap-3">
          <LightDial value={lightAngle} onChange={setLightAngle} size={64} />
          <div className="flex flex-col font-sans">
            <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">Angle</span>
            <span className="text-[13px] tabular-nums text-white/85">{lightAngle}°</span>
          </div>
        </div>
      </Section>

      {/* Density */}
      <Section title="Density" right={`${Math.round(density * 100)}%`}>
        <Slider
          value={[density]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => setDensity(v[0]!)}
          aria-label="Density"
        />
      </Section>

      {/* Softness (renombrado de Blur) */}
      <Section title="Softness" right={`${blur}px`}>
        <Slider
          value={[blur]}
          min={10}
          max={120}
          step={1}
          onValueChange={(v) => setBlur(v[0]!)}
          aria-label="Softness"
        />
      </Section>
    </div>
  );
}

/** Etiqueta de sección consistente — title a la izquierda + métrica a la derecha. */
function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/45">
          {title}
        </span>
        {right ? (
          <span className="font-sans text-[11px] tabular-nums text-white/65">{right}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * Trigger button del panel. `forwardRef` mantenido por si en futuro vuelve
 * a usarse como child de un Slot (Radix DropdownMenu, etc.) — para el flujo
 * actual basta como botón controlado por su onClick.
 *
 * `pressed` activa el estado "is open" visualmente: el botón se hunde
 * (active-like) mientras el panel está abierto, para que el usuario sepa
 * que ese click es el que abrió la bandeja.
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
        title="Customize style, colors, light, density"
        aria-label="Customize style, colors, light and density"
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
