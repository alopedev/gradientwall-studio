import { useEffect, useMemo, useState } from "react";
import { hexToHsl } from "@/lib/gradient";
import { useRecentColors, usePushRecentColor } from "@/store";
import { reduceHexInput, reduceHslChannel } from "@/lib/colorEditing/state";
import { normalizeHex } from "@/lib/recent-colors";

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

export interface UseColorEditingReturn {
  hexDraft: string;
  /** HSL derived from the *committed* `value`, not the (possibly invalid) draft. */
  hsl: readonly [number, number, number];
  canEyedrop: boolean;
  recents: readonly string[];
  setHex(raw: string): void;
  setHslChannel(ch: "h" | "s" | "l", n: number): void;
  pickRecent(hex: string): void;
  openEyedropper(): Promise<void>;
}

/**
 * Adapter hook around the pure reducers in `src/lib/colorEditing/state.ts`.
 * Owns React-shaped concerns only:
 *
 *  - `hexDraft` local state with upstream-resync effect (so `value` changes
 *    from undo/recent-click flow back into the input)
 *  - HSL memoisation against `value` (NEVER against `hexDraft` — the draft
 *    can be mid-typing and unparseable)
 *  - Single `commit` protocol that fires `onChange + pushRecent` together
 *  - SSR-safe `canEyedrop` capability flag and silent-reject Eyedropper open
 */
export function useColorEditing(
  value: string,
  onChange: (hex: string) => void,
): UseColorEditingReturn {
  const recents = useRecentColors();
  const pushRecent = usePushRecentColor();

  const [hexDraft, setHexDraft] = useState(() => normalizeHex(value));

  // Resync the draft whenever the upstream `value` actually changes. The
  // guard prevents a redundant render when our own commit just bounced
  // back through `value`: norm(value) already equals our draft.
  useEffect(() => {
    const norm = normalizeHex(value);
    setHexDraft((prev) => (normalizeHex(prev) === norm ? prev : norm));
  }, [value]);

  const hsl = useMemo(() => hexToHsl(value) as readonly [number, number, number], [value]);

  const commit = (hex: string) => {
    onChange(hex);
    pushRecent(hex);
  };

  const setHex = (raw: string) => {
    const decision = reduceHexInput(raw, value);
    setHexDraft(decision.draft);
    if (decision.commit) commit(decision.commit);
  };

  const setHslChannel = (ch: "h" | "s" | "l", n: number) => {
    const decision = reduceHslChannel(ch, n, { h: hsl[0], s: hsl[1], l: hsl[2] });
    setHexDraft(decision.draft);
    if (decision.commit) commit(decision.commit);
  };

  const pickRecent = (hex: string) => setHex(hex);

  const canEyedrop = typeof window !== "undefined" && "EyeDropper" in window;
  const openEyedropper = async () => {
    if (typeof window === "undefined" || !window.EyeDropper) return;
    try {
      const picker = new window.EyeDropper();
      const result = await picker.open();
      setHex(result.sRGBHex);
    } catch {
      // user dismissed — silent
    }
  };

  return {
    hexDraft,
    hsl,
    canEyedrop,
    recents,
    setHex,
    setHslChannel,
    pickRecent,
    openEyedropper,
  };
}
