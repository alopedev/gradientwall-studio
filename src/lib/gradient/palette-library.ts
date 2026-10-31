import { clamp, hexToOklch, lerp, oklchToHex, wrapAngle } from "../color";
import type { Colors4 } from "../palettes";

/**
 * Palettes for the Shuffle (Àlex chose option C, 2026-10-31): a hand-made
 * palette from the library below, turned a little each time.
 *
 * Why: the old generator (`randomHarmonicColors`) kept every colour at HSL
 * lightness 42–78 and saturation 55–92, so no Shuffle had a dark or a light
 * and they all came out flat neon. The palettes that look good — the 10 of the
 * Studio and the landing galleries — have a dark base, a light that reads as
 * the light, and an accent. Each one is turned in OKLCH, which keeps that
 * value structure where HSL would not.
 *
 * The library is a copy (made 2026-10-31) of the 10 Studio palettes plus the
 * landing galleries (`lib/seo/gallery.ts`), deduplicated. A copy, so the
 * render layer doesn't import the SEO layer; add new palettes here by hand.
 * The pack palettes (Marble) stay out so the free Shuffle doesn't hand out a
 * pack's looks.
 */

/** Most a Shuffle turns a palette's hues, each way, in degrees. */
export const DESIGNER_HUE_SHIFT = 30;
/** Lightness is scaled by 1/x..x (1.06 = ±6 %): a palette can come a bit darker or lighter. */
export const DESIGNER_LIGHT_SCALE = 1.06;
/**
 * Least OKLCH lightness gap between a palette's darkest and lightest colour for
 * the Shuffle to use it. Below it a palette is all one value: a near-blank
 * pastel or flat neon, the problem this module fixes. (Those palettes still
 * suit their landings, where they sit beside darker ones.)
 */
export const MIN_LIGHT_SPREAD = 0.15;
/** Ceiling for a scaled lightness, so a near-white stays a colour and doesn't clip. */
const LIGHT_CEILING = 0.97;

export const PALETTE_LIBRARY: readonly Colors4[] = [
  ["#2b1055", "#7597de", "#ff6e7f", "#ffd86e"],
  ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"],
  ["#0d0d0d", "#7a1b2e", "#ff5a36", "#ffd166"],
  ["#0b3d2e", "#1f8a70", "#bedb39", "#fff275"],
  ["#0a0a1a", "#1e1b4b", "#8b5cf6", "#f0abfc"],
  ["#012a4a", "#2a9df4", "#caf0f8", "#fefae0"],
  ["#3a2618", "#7c5a3f", "#c9a982", "#f4e8d8"],
  ["#1a0b2e", "#5b21b6", "#c026d3", "#fb7185"],
  ["#0f172a", "#475569", "#cbd5e1", "#f8fafc"],
  ["#2b0a0a", "#9f1239", "#f43f5e", "#fecdd3"],
  ["#a93b2f", "#e17e36", "#f1d859", "#e0e580"],
  ["#be232e", "#de633d", "#f3b66a", "#eee89e"],
  ["#b7ce40", "#54d1e9", "#f86ae1", "#8cefbd"],
  ["#b62522", "#f39b3e", "#60f8ae", "#66a4e7"],
  ["#2cb8dd", "#e734c1", "#cbe470", "#c180eb"],
  ["#344ab4", "#f43455", "#6aed4e", "#e378e4"],
  ["#c034c1", "#e73566", "#5cf85b", "#81e5ca"],
  ["#3e2add", "#a94fe2", "#f0bf71", "#95e95f"],
  ["#3560c0", "#502ceb", "#f17b60", "#daed86"],
  ["#c57d34", "#c6f140", "#50a3f7", "#896fdc"],
  ["#bfdc23", "#87e15f", "#5e42f3", "#cd94e7"],
  ["#d5af3e", "#acef4e", "#5077ed", "#b790ee"],
  ["#d43e56", "#f3b83e", "#60f6df", "#96b1ea"],
  ["#bf1e42", "#f63b38", "#e28d54", "#f0da91"],
  ["#4858cb", "#b341ed", "#ebd84f", "#b3e799"],
  ["#3499c1", "#e556bd", "#c1f441", "#a468ea"],
  ["#2dce6a", "#61e3bd", "#64e6e7", "#9ccfeb"],
  ["#c530b1", "#eb3d9f", "#ec6882", "#ea795e"],
  ["#d13123", "#f1ba2c", "#64dde8", "#99b0ea"],
  ["#42ce56", "#5a42ea", "#e37e6e", "#68a8e7"],
  ["#f7c6d9", "#f9a8b8", "#ffd3a5", "#fff1e0"],
  ["#1b1f4b", "#5b6ee1", "#c3a6ff", "#f3e8ff"],
  ["#2a0f3d", "#7b2cbf", "#ff7a3d", "#ffd6a5"],
  ["#d8f3ec", "#9ee6cf", "#8ecae6", "#f1faff"],
  ["#ff6f61", "#ff9a76", "#ffd166", "#fff4d6"],
  ["#5e4b8b", "#a594f9", "#cdc1ff", "#f5efff"],
  ["#0b3c49", "#1f8a8a", "#ff8fab", "#ffe5ec"],
  ["#3d0c11", "#d1495b", "#f79256", "#fbd1a2"],
  ["#03256c", "#2541b2", "#1768ac", "#06bee1"],
  ["#b5838d", "#e5989b", "#ffb4a2", "#ffcdb2"],
  ["#14342b", "#3aa17e", "#c7f9cc", "#fff3b0"],
  ["#10002b", "#5a189a", "#e0aaff", "#ff6fb5"],
  ["#0d1b2a", "#1b263b", "#e0a100", "#fcd581"],
  ["#2d0a31", "#7b2d8b", "#b5e48c", "#f1ffc4"],
  ["#1a0f0a", "#7f3b1d", "#d9822b", "#f6c28b"],
  ["#10002b", "#f72585", "#4cc9f0", "#b8f2e6"],
  ["#3e1f2b", "#b56576", "#e8a598", "#ffe5d9"],
  ["#03045e", "#0077b6", "#00b4d8", "#f0f3bd"],
  ["#003844", "#006c67", "#ff9f1c", "#ffd8a8"],
  ["#240046", "#7b2cbf", "#80ffdb", "#e0fff6"],
  ["#05030f", "#120d2e", "#3b2a8a", "#8b5cf6"],
  ["#020617", "#0b1d3a", "#1e3a8a", "#60a5fa"],
  ["#0d0d0d", "#3b0d0d", "#b4361e", "#ff8c42"],
  ["#0a0a0a", "#1f2937", "#4b5563", "#9ca3af"],
  ["#020c0c", "#04302f", "#0f766e", "#5eead4"],
  ["#0a0204", "#2b0510", "#7f1d3a", "#e11d48"],
  ["#020805", "#06180f", "#0f3d24", "#2f855a"],
  ["#050403", "#120e05", "#3d2d0a", "#b8860b"],
  ["#07000f", "#1a0533", "#5b21b6", "#c084fc"],
  ["#03071e", "#0d1b4c", "#1f2a6b", "#ff6b6b"],
  ["#000000", "#0a0f1f", "#13315c", "#2a6f97"],
  ["#0b0410", "#2a0c2e", "#6d1b5f", "#f472b6"],
  ["#1a0508", "#4a0e1c", "#7b1e34", "#c2566b"],
  ["#2b0a12", "#6b1530", "#a8325a", "#f2a7b8"],
  ["#120304", "#3d0a0f", "#6e1320", "#a33b3b"],
  ["#1f050b", "#5c0f22", "#8f2340", "#e3b04b"],
  ["#24060f", "#5e1229", "#9b2c4a", "#ffd1dc"],
  ["#1a0612", "#4c0f2e", "#7a1f4b", "#c06c84"],
  ["#2a0808", "#6b1a1a", "#b23a3a", "#f6b49a"],
  ["#000000", "#1c0408", "#4f0c1d", "#8a1c3a"],
  ["#1c0109", "#5a0420", "#9e0b3a", "#ff4d6d"],
  ["#1b0716", "#4a1240", "#7d2463", "#d48bb5"],
  ["#2b0a0a", "#7b1e34", "#c2566b", "#fbe8e3"],
  ["#1a0508", "#5b1323", "#a43d2c", "#e08e45"],
  ["#1a0a03", "#7a2e0b", "#f26a1b", "#ffb36b"],
  ["#ff5f00", "#ff8c1a", "#ffb347", "#ffe0b2"],
  ["#ff6b35", "#f7a072", "#ff8fab", "#ffe5ec"],
  ["#2b0f05", "#8a3008", "#d35400", "#f39c12"],
  ["#0b132b", "#1c2541", "#ff7f11", "#ffbf69"],
  ["#fb8b24", "#fcb07e", "#ffd6a5", "#fff4e6"],
  ["#3a1206", "#7f2b0a", "#b5451b", "#e98a4b"],
  ["#240046", "#5a189a", "#ff6d00", "#ff9e00"],
  ["#ff9e5e", "#f25c54", "#c9184a", "#ffd29d"],
  ["#000000", "#2a0e03", "#ea580c", "#fdba74"],
  ["#6a2c00", "#c45a00", "#f59e0b", "#fde68a"],
  ["#003c43", "#135d66", "#ff7b00", "#ffc078"],
  ["#0c1a2b", "#3d6a8f", "#a9cbe3", "#eef6fb"],
  ["#1b2a3a", "#7fa6c4", "#cfe3f1", "#f7fbfe"],
  ["#1e2a36", "#4f6b82", "#b7cfe0", "#e9f2f8"],
  ["#041526", "#0f3b5c", "#6fa3c8", "#dcecf7"],
  ["#2a323b", "#8696a6", "#c9d6e2", "#f2f5f8"],
  ["#06222a", "#1f6f7f", "#9fd6de", "#eaf8f9"],
  ["#020814", "#0b2340", "#3e78a8", "#bcd9ee"],
  ["#1c1f33", "#5d6c9a", "#b9c6e6", "#eef1fb"],
  ["#050d1f", "#1b3566", "#8fb4dc", "#f0f6fc"],
  ["#11161c", "#3a4855", "#93a8b8", "#dfe7ee"],
  ["#0a2233", "#2c6e8f", "#8ccbe0", "#e6f6fb"],
  ["#18222c", "#5f7d95", "#c2d4e2", "#fbfcfd"],
  ["#0d1f17", "#2f5d46", "#8fb39a", "#e3eee2"],
  ["#03120a", "#0f3d24", "#2f7a4a", "#9fd1a8"],
  ["#123326", "#3f8f6e", "#a8e0c5", "#f6f3e4"],
  ["#020d08", "#0b3324", "#1f6b4d", "#7fbf9f"],
  ["#1a1f08", "#4f5b1a", "#a3b23a", "#eef0a6"],
  ["#021a12", "#06573a", "#1fa37a", "#8ee8c4"],
  ["#1b2a22", "#6f8f78", "#c8d8c0", "#f6d2b8"],
  ["#03161a", "#0f4a4f", "#5b8f4a", "#cfe3a3"],
  ["#06140d", "#1c4a33", "#6f8f3a", "#e8cf7a"],
  ["#14231f", "#4d7468", "#9fbfb2", "#e8f1ec"],
  ["#07140a", "#1d4a1f", "#5fbf3a", "#d9f7a3"],
  ["#0a1f1a", "#2a6b5c", "#7fc4ae", "#e3f4ee"],
  ["#1a1206", "#6b4a12", "#c9962e", "#f6e2a8"],
  ["#2a2218", "#8a7556", "#d9c39a", "#fbf3e2"],
  ["#06070b", "#1c1f2b", "#a8802e", "#f0d48a"],
  ["#1f0e03", "#7a3e0b", "#d98a1f", "#ffd27a"],
  ["#04120b", "#123d26", "#b08a2e", "#f2dc93"],
  ["#2a1416", "#8a4f4f", "#d9a08a", "#f8e1d2"],
  ["#14100a", "#4f3f22", "#a88a4f", "#e8d6a8"],
  ["#1a0508", "#5a1020", "#b8862e", "#f3d690"],
  ["#3a3020", "#a89062", "#e8d8b0", "#fdf8ec"],
  ["#160b04", "#5a3112", "#a86a2e", "#e8b77a"],
  ["#030a1a", "#0f2550", "#b8923a", "#f6e0a0"],
  ["#2b1a04", "#a86a0b", "#f2b632", "#fff1b8"],
  ["#1b2e25", "#4f772d", "#90a955", "#ecf39e"],
  ["#020617", "#0b1d3a", "#0f766e", "#5eead4"],
  ["#ffcdb2", "#ffb4a2", "#e5989b", "#b5838d"],
  ["#03045e", "#0077b6", "#00b4d8", "#90e0ef"],
  ["#e2e8f0", "#94a3b8", "#64748b", "#1e3a8a"],
  ["#1c1608", "#6b4f12", "#d4a017", "#fdf0c2"],
  ["#1d3557", "#457b9d", "#a8dadc", "#f1c0a0"],
  ["#14213d", "#3a0ca3", "#f72585", "#ffc8dd"],
  ["#283618", "#606c38", "#dda15e", "#fefae0"],
  ["#004e64", "#00a5cf", "#ff7f51", "#ffe5d9"],
  ["#22223b", "#4a4e69", "#9a8c98", "#f2e9e4"],
  ["#370617", "#9d0208", "#f48c06", "#ffba08"],
  ["#073b4c", "#118ab2", "#06d6a0", "#e9fff9"],
  ["#432818", "#99582a", "#bb9457", "#ffe6a7"],
  ["#03045e", "#3a0ca3", "#4cc9f0", "#e0fbfc"],
  ["#3c1642", "#86275d", "#e8a0bf", "#fde2e4"],
  ["#0b090a", "#161a1d", "#2b9348", "#d4f700"],
  ["#5fa8d3", "#a9d6e5", "#f6f7d7", "#ffe66d"],
  ["#020b1f", "#0b3a75", "#2a7de1", "#9fd3ff"],
  ["#0a2540", "#1e6fd9", "#a8d8ff", "#f0f8ff"],
  ["#01030d", "#0a1a3f", "#1d4ed8", "#60a5fa"],
  ["#03213a", "#0e6ba8", "#20b2aa", "#b2f7ef"],
  ["#0b1b5e", "#1f3fbf", "#3d7bff", "#c7d8ff"],
  ["#0d2b5c", "#3f78c9", "#f7c6a3", "#fde9dc"],
  ["#9cc9f5", "#bfe0ff", "#e3f1ff", "#f7fbff"],
  ["#050d24", "#13285c", "#3359a8", "#f2c14e"],
  ["#003049", "#0077b6", "#00b4d8", "#caf0f8"],
  ["#1b2838", "#3d5a80", "#98c1d9", "#e0fbfc"],
  ["#0a0f3c", "#2b3fd6", "#7b5cff", "#d6ccff"],
  ["#001219", "#005f73", "#0a9396", "#94d2bd"],
  ["#12051f", "#3b0f6b", "#8b5cf6", "#e9d5ff"],
  ["#9d84d6", "#b8a4e3", "#d8c8f0", "#efe6ff"],
  ["#14030f", "#4a0d3a", "#8e2a6d", "#d58bc0"],
  ["#0c0420", "#3a0ca3", "#b5179e", "#f72585"],
  ["#1a0b2e", "#5b2a86", "#9a6fd6", "#e2d4f7"],
  ["#0b0a2a", "#3c1f8b", "#5b6cff", "#b9c6ff"],
  ["#09020f", "#2d0a4e", "#6a1fb0", "#c084fc"],
  ["#6d4fa3", "#b79be0", "#f4c9b8", "#fff1e8"],
  ["#05031a", "#1e1b4b", "#4338ca", "#a5b4fc"],
  ["#2a0036", "#7a0f8f", "#c026d3", "#f5a3ff"],
  ["#3a2433", "#7d5a72", "#b897ad", "#ecdde6"],
  ["#030008", "#240046", "#7b2cbf", "#e0aaff"],
  ["#f48fb1", "#f7a8b8", "#ffd1c1", "#ffeef0"],
  ["#3d0a24", "#c2185b", "#ff4f9a", "#ffc2dd"],
  ["#b8486b", "#e88aa6", "#f9d5df", "#fff7f0"],
  ["#2b0612", "#d6336c", "#ff7a59", "#ffd29d"],
  ["#ff8fc7", "#ffc4e1", "#fbe3ff", "#c9b6ff"],
  ["#4a2530", "#9c5b6b", "#d4a5ad", "#f3e1e3"],
  ["#3b0a45", "#a4288f", "#f06bb3", "#ffd0ea"],
  ["#0a0208", "#4a0636", "#ff2d95", "#ff9ad5"],
  ["#8f1f3c", "#ff5c7a", "#ffa8a8", "#ffe5e0"],
  ["#f78fb3", "#ffd3e2", "#c8f5e3", "#8ee3c8"],
  ["#2e0516", "#7a0c3a", "#c9184a", "#ff8fab"],
  ["#1d0b2e", "#7b2d6b", "#f2637e", "#ffc8a2"],
  ["#ffd6e0", "#c8e7ff", "#fdf2f8", "#b9d8ff"],
  ["#c7f9e5", "#e3d4ff", "#f4fff9", "#b8a9ff"],
  ["#ffd8be", "#e6d3ff", "#fff4ec", "#c7b3f5"],
  ["#fff3b0", "#cde8ff", "#fffbe6", "#a9d3ff"],
  ["#f9c6e8", "#c6d8ff", "#fdeefb", "#a7c7ff"],
  ["#cfe3c9", "#f6f1de", "#a9c9a4", "#fffdf5"],
  ["#e4d0ff", "#ffd1e8", "#f9f0ff", "#d1a8f0"],
  ["#bff3f0", "#ffd3dc", "#effffd", "#9ee6e0"],
  ["#ffc2b3", "#ffd1a9", "#ffe9d6", "#fff6ee"],
  ["#ffc8dd", "#bde0fe", "#caffbf", "#fdffb6"],
  ["#a8b4ff", "#c3cbff", "#e5e9ff", "#f6f7ff"],
  ["#b5ead7", "#ffdac1", "#e2f0cb", "#ffb7b2"],
  ["#050308", "#1b0b2e", "#5b21b6", "#a78bfa"],
  ["#ffc6d9", "#c3d9ff", "#fbe7ff", "#9fc0ff"],
  ["#3a0f00", "#c2410c", "#fb923c", "#ffedd5"],
  ["#000000", "#0a1630", "#1e40af", "#60a5fa"],
  ["#ffcfb3", "#dcc8ff", "#fff1e6", "#b9a3f0"],
  ["#050505", "#2a2a2a", "#9a9a9a", "#f2f2f2"],
  ["#02130f", "#065f46", "#10b981", "#a7f3d0"],
  ["#2b0306", "#9f1239", "#f43f5e", "#fecdd3"],
  ["#0b1e4d", "#2563eb", "#a3e635", "#ecfccb"],
  ["#3f3f46", "#a1a1aa", "#ddd6fe", "#f5f3ff"],
  ["#030303", "#2a1a05", "#b7791f", "#f6d365"],
  ["#7dd3fc", "#e0f2fe", "#fda4af", "#fff1f2"],
  ["#449ac7", "#ec59b2", "#bef784", "#af68e3"],
  ["#07080a", "#ff2136", "#ff6363", "#ffa2a2"],
];

export function lightSpread(colors: readonly string[]): number {
  const ls = colors.map((hex) => hexToOklch(hex)[0]);
  return Math.max(...ls) - Math.min(...ls);
}

/** The palettes the Shuffle draws from: the library minus the one-value ones. */
export const SHUFFLE_PALETTES: readonly Colors4[] = PALETTE_LIBRARY.filter(
  (p) => lightSpread(p) >= MIN_LIGHT_SPREAD,
);

/**
 * 4 colours for a Shuffle: a {@link SHUFFLE_PALETTES} palette with all its hues turned by the
 * same amount (≤ {@link DESIGNER_HUE_SHIFT}°) and its lightness scaled by the
 * same factor, so the colours keep their relation to each other. Order of rng
 * draws: palette, hue, lightness (`rng` 0.5 for both = the palette unchanged).
 */
export function designerColors(rng: () => number = Math.random): Colors4 {
  const source = SHUFFLE_PALETTES[Math.floor(rng() * SHUFFLE_PALETTES.length)];
  const turn = lerp(-DESIGNER_HUE_SHIFT, DESIGNER_HUE_SHIFT, rng());
  const t = rng();
  if (turn === 0 && t === 0.5) return [...source] as Colors4;
  const scale = DESIGNER_LIGHT_SCALE ** lerp(-1, 1, t);
  return source.map((hex) => {
    const [l, c, h] = hexToOklch(hex);
    return oklchToHex(clamp(l * scale, 0, Math.max(l, LIGHT_CEILING)), c, wrapAngle(h + turn));
  }) as Colors4;
}
