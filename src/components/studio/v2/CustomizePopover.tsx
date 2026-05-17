import { Settings2 } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { Slider } from "@/components/ui/shadcn/slider";
import { STYLES, type Style } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { LightDial } from "../LightDial";
import { Swatches } from "../Swatches";
import { UseMyPhotoButton } from "../UseMyPhotoButton";
import { StyleThumbnail } from "./StyleThumbnail";

/**
 * CustomizePopover — bandeja de potencia oculta detrás de un solo click en el
 * ActionRow. Filosofía del Studio v2: el usuario que solo quiere descargar
 * un wallpaper bonito no necesita abrir esto; el que quiere control lo abre
 * y ve sólo lo importante, sin sliders técnicos.
 *
 * Contenido (cinco bloques en este orden):
 * 1. **Style** — 4 thumbnails grandes que pintan la paleta actual con cada
 *    style. Click setea style instantáneamente.
 * 2. **Colors** — `<Swatches>` v1 reutilizado tal cual (4 celdas + ColorHUD
 *    al click + toggle +/× para activar/desactivar) y `<UseMyPhotoButton>`
 *    para extraer paleta de una imagen.
 * 3. **Light direction** — `<LightDial>` v1 reutilizado tal cual.
 * 4. **Density** — slider 0..100% que mapea al `density` 0..1 del store.
 * 5. **Softness** — slider 10..120 px (renombrado de "Blur" en v1; nombre
 *    más amigable).
 *
 * **Eliminados respecto al RightRail de v1**: contrast, vibrance, grain.
 * Estos valores se congelan en defaults curados vía `applySurprise()`
 * (Fase 1) y no se exponen para que la superficie del editor sea minimal.
 *
 * Wrapper visual: utilidad `glass-modern` (tokens definidos en Fase 0).
 */

const STYLE_LABELS: Record<Style, string> = {
  mesh: "Mesh",
  liquid: "Liquid",
  aurora: "Aurora",
  nebula: "Nebula",
};

interface Props {
  /** Render slot — el trigger que abre el popover (típicamente el botón Customize del ActionRow). */
  trigger: ReactNode;
}

export function CustomizePopover({ trigger }: Props) {
  const style = useConfigStore((s) => s.style);
  const setStyle = useConfigStore((s) => s.setStyle);
  const blur = useConfigStore((s) => s.blur);
  const setBlur = useConfigStore((s) => s.setBlur);
  const density = useConfigStore((s) => s.density);
  const setDensity = useConfigStore((s) => s.setDensity);
  const lightAngle = useConfigStore((s) => s.lightAngle);
  const setLightAngle = useConfigStore((s) => s.setLightAngle);

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        // Reglas de posicionamiento para que el popover NO tape el canvas
        // Preview (situado encima del trigger):
        //   • side="bottom" + align="end" → sale debajo del Customize, anclado
        //     a la derecha (Customize es el último botón de la fila).
        //   • avoidCollisions={false} → desactiva el flip automático que
        //     Radix haría a "top" cuando el contenido no cabe abajo (el
        //     flip es justo lo que tapaba el canvas).
        //   • max-h + overflow-y-auto → el popover ofrece scroll interno
        //     si la altura disponible es menor que el contenido. El usuario
        //     ve el canvas íntegro y desplaza los controles dentro del
        //     popover si hace falta.
        side="bottom"
        align="end"
        sideOffset={10}
        collisionPadding={16}
        avoidCollisions={false}
        // `--radix-popover-content-available-height` lo expone Radix con el
        // espacio real entre el trigger y el borde inferior del viewport
        // menos `collisionPadding`. Cap a 540 (altura natural del contenido).
        className="glass-modern max-h-[min(540px,var(--radix-popover-content-available-height))] w-[340px] overflow-y-auto rounded-[10px] p-4"
      >
        <div className="flex flex-col gap-5">
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
      </PopoverContent>
    </Popover>
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
 * Trigger por defecto — el mismo botón "Customize" que vivía disabled en
 * ActionRow. `forwardRef` es obligatorio: Radix Popover `<PopoverTrigger
 * asChild>` clona los props y necesita pasar el ref al `<button>` real
 * para gestionar el estado del popover (focus, position, escape).
 */
export const CustomizeTriggerButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function CustomizeTriggerButton(props, ref) {
  return (
    <button
      ref={ref}
      type="button"
      title="Customize style, colors, light, density"
      aria-label="Customize style, colors, light and density"
      className="tactile inline-flex items-center gap-1.5 rounded-[2px] px-3 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-white/85 hover:text-white"
      {...props}
    >
      <Settings2 className="size-3.5" aria-hidden />
      Customize
    </button>
  );
});
