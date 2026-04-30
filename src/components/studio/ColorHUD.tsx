import { useEffect, useMemo, useState } from "react";
import { hexToHsl, hslToHex } from "@/lib/gradient";
import { useUIStore } from "@/store";
import { Slider } from "@/components/ui/shadcn/slider";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

interface EyeDropperResult {
  sRGBHex: string;
}
interface EyeDropperLike {
  open: () => Promise<EyeDropperResult>;
}
declare global {
  interface Window {
    EyeDropper?: { new (): EyeDropperLike };
  }
}

interface ColorHUDProps {
  /** Current color in `#rrggbb` form. */
  value: string;
  /** Called with a normalized `#RRGGBB` (uppercase) when the user picks. */
  onChange: (hex: string) => void;
}

/**
 * Procreate-style detachable color picker. Hex input as the canonical truth,
 * HSL sliders as a more visual grasp on hue/saturation/lightness, EyeDropper
 * Web API for sampling pixels off the page, and a row of recent picks pulled
 * from `useUIStore.recentColors` so users don't have to retype shared colors
 * across slots.
 *
 * Replaces the native `<input type="color">` everywhere it appeared. Living
 * inside a `<Popover>` is the caller's responsibility.
 */
export function ColorHUD({ value, onChange }: ColorHUDProps) {
  const recents = useUIStore((s) => s.recentColors);
  const pushRecent = useUIStore((s) => s.pushRecentColor);

  const [hexDraft, setHexDraft] = useState(value.toUpperCase());
  // HSL is derived from the *committed* color; the draft only forwards once
  // it parses cleanly. Sliders manipulate HSL directly and write back the
  // hex through `commit()`.
  const [h, s, l] = useMemo(() => hexToHsl(value), [value]);

  // Keep draft synced if value changes externally (e.g. user picked a recent).
  useEffect(() => {
    setHexDraft(value.toUpperCase());
  }, [value]);

  const commit = (next: string) => {
    const norm = "#" + next.trim().replace(/^#/, "").toUpperCase();
    if (norm === value.toUpperCase()) return;
    onChange(norm);
    pushRecent(norm);
  };

  const onHexChange = (raw: string) => {
    setHexDraft(raw);
    if (HEX_RE.test(raw)) {
      commit(raw);
    }
  };

  const setHsl = (channel: "h" | "s" | "l", n: number) => {
    const next = {
      h: channel === "h" ? n : h,
      s: channel === "s" ? n : s,
      l: channel === "l" ? n : l,
    };
    const hex = hslToHex(next.h, next.s, next.l);
    setHexDraft(hex.toUpperCase());
    commit(hex);
  };

  const canEyedrop = typeof window !== "undefined" && "EyeDropper" in window;
  const onEyedrop = async () => {
    if (!window.EyeDropper) return;
    try {
      const picker = new window.EyeDropper();
      const result = await picker.open();
      onHexChange(result.sRGBHex);
    } catch {
      // user dismissed — silent
    }
  };

  return (
    <div className="w-[280px] flex flex-col gap-4">
      {/* Hex row */}
      <div className="flex items-center gap-3">
        <div
          className="h-9 w-9 shrink-0 rounded-[2px] border border-white/14"
          style={{ background: value }}
          aria-hidden
        />
        <label className="flex-1 flex flex-col gap-1">
          <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-white/40">Hex</span>
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => onHexChange(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="w-full rounded-[2px] border border-white/14 bg-[#070709] px-2.5 py-1.5 font-sans text-[13px] tracking-wider text-white outline-none transition-colors duration-150 hover:border-white/25 focus:border-white/50"
          />
        </label>
      </div>

      {/* HSL sliders */}
      <div className="flex flex-col gap-3">
        <HslRow label="Hue" value={h} max={360} unit="°" onChange={(n) => setHsl("h", n)} />
        <HslRow label="Saturation" value={s} max={100} unit="%" onChange={(n) => setHsl("s", n)} />
        <HslRow label="Lightness" value={l} max={100} unit="%" onChange={(n) => setHsl("l", n)} />
      </div>

      {/* Eyedropper + Recents */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-white/8">
        {canEyedrop && (
          <button
            type="button"
            onClick={onEyedrop}
            className="self-start inline-flex items-center gap-2 rounded-[2px] border border-white/14 px-2.5 py-1.5 font-sans text-[10px] tracking-[0.18em] uppercase text-white/75 transition-colors duration-150 hover:border-white/30 hover:text-white"
          >
            ⌖ Eyedropper
          </button>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-white/40">Recents</span>
          {recents.length === 0 ? (
            <span className="font-sans text-[11px] text-white/30 italic">— pick a color to start —</span>
          ) : (
            <div className="grid grid-cols-12 gap-1.5">
              {recents.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onHexChange(r)}
                  title={r}
                  aria-label={`Apply ${r}`}
                  className="aspect-square rounded-[2px] border border-white/10 transition-transform duration-150 hover:scale-110 hover:border-white/40"
                  style={{ background: r }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HslRow({
  label,
  value,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline font-sans text-[10px] tracking-[0.18em] uppercase text-white/40">
        <span>{label}</span>
        <span className="text-white/55 tracking-[0.05em]">
          {value}
          {unit}
        </span>
      </div>
      <Slider value={[value]} min={0} max={max} step={1} onValueChange={(v) => onChange(v[0]!)} />
    </label>
  );
}
