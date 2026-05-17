import { useGradientCanvas } from "@/lib/useGradientCanvas";
import { activeColors, type Style } from "@/lib/palettes";
import { useConfigStore } from "@/store";

/**
 * StyleThumbnail — chip cuadrado que muestra cómo se vería el wallpaper
 * actual con un `style` distinto. Usado en `CustomizePopover` para que el
 * usuario elija style visualmente en lugar de leer "mesh / liquid / aurora /
 * nebula".
 *
 * Pinta con la misma paleta + seed actuales para que comparar entre las 4
 * miniaturas refleje exclusivamente la diferencia de style. Si el usuario
 * cambia de seed o paleta el thumbnail se re-renderiza solo (deps en
 * useGradientCanvas).
 */

const THUMB_W = 96;
const THUMB_H = 64;

interface Props {
  style: Style;
  label: string;
  selected: boolean;
  onSelect: (s: Style) => void;
}

export function StyleThumbnail({ style, label, selected, onSelect }: Props) {
  const colors = useConfigStore((s) => s.colors);
  const active = useConfigStore((s) => s.active);
  const seed = useConfigStore((s) => s.seed);

  const filteredColors = activeColors(colors, active);

  const ref = useGradientCanvas(
    {
      w: THUMB_W,
      h: THUMB_H,
      colors: filteredColors,
      style,
      blur: 24,
      seed,
    },
    [filteredColors.join(","), style, seed],
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(style)}
      aria-pressed={selected}
      aria-label={`Switch to ${label} style`}
      title={label}
      className={`focus-ring group relative overflow-hidden rounded-[6px] border transition-all duration-150 ${
        selected
          ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.18)]"
          : "border-white/12 hover:border-white/40"
      }`}
      style={{ width: THUMB_W, height: THUMB_H + 18 }}
    >
      <canvas ref={ref} width={THUMB_W} height={THUMB_H} className="block h-[64px] w-full" />
      <span
        className={`block px-1 py-1 font-sans text-[10px] uppercase tracking-[0.12em] ${
          selected ? "bg-white text-[#07070a]" : "bg-black/45 text-white/65 group-hover:text-white"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
