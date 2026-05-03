import { hslToHex } from "../gradient";
import { normalizeHex } from "../recent-colors";

export const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export const isValidHex = (s: string): boolean => HEX_RE.test(s);

/**
 * Result of an editor input event. `draft` is the new text the input should
 * show; `commit` is the canonical `#RRGGBB` to push upstream when non-null.
 *
 * Splitting the two lets the input echo every keystroke (so users can type
 * a partial hex without the field bouncing) while only firing `onChange`
 * when the buffer actually parses cleanly.
 */
export interface CommitDecision {
  draft: string;
  /** `null` means the input doesn't parse yet — keep the draft, don't commit. */
  commit: string | null;
}

/**
 * Decide what happens after a hex-input keystroke. Always echoes the raw
 * input as the new draft; commits only when the buffer matches HEX_RE and
 * normalising it yields a different colour from the current value (eco
 * guard — prevents `onChange` loops when upstream resyncs the draft).
 */
export function reduceHexInput(raw: string, currentValue: string): CommitDecision {
  if (!isValidHex(raw)) {
    return { draft: raw, commit: null };
  }
  const norm = normalizeHex(raw);
  if (norm === normalizeHex(currentValue)) {
    return { draft: raw, commit: null };
  }
  return { draft: raw, commit: norm };
}

/**
 * Decide what happens when an HSL slider moves one channel. Always commits
 * (sliders only emit at well-defined values) and snaps the draft to the new
 * canonical hex so the textbox tracks the slider live.
 */
export function reduceHslChannel(
  channel: "h" | "s" | "l",
  n: number,
  current: { h: number; s: number; l: number },
): CommitDecision {
  const next = {
    h: channel === "h" ? n : current.h,
    s: channel === "s" ? n : current.s,
    l: channel === "l" ? n : current.l,
  };
  const hex = normalizeHex(hslToHex(next.h, next.s, next.l));
  return { draft: hex, commit: hex };
}
