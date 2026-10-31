/**
 * GLSL sources for the material pass: a second draw that reads the finished
 * wallpaper (`uBase`, drawn by the signed-off `FRAG` into a texture) and
 * redraws it as a material. `FRAG` itself is never touched, and "none" skips
 * this pass, so a wallpaper without a material is the same pixels as before.
 *
 * Sizes scale with the short side (`S()` = 1 at 720 px), so the live preview,
 * the thumbnails and the 5K download show the same pattern.
 *
 * Calibrated on the mockups Àlex chose on 2026-10-31
 * (`/mnt/project-files/features/texturas-2026-10-31/`), after Paper Shaders
 * (fluted glass, dithering, halftone) and Raycast's Glaze wallpapers.
 */

import type { Material } from "../palettes";

export type DrawnMaterial = Exclude<Material, "none">;
/** A program of the second pass: a material, or "tone" alone over a wallpaper without one. */
export type SecondPass = DrawnMaterial | "tone";

const HEAD = `#version 300 es
precision highp float;
uniform sampler2D uBase;
uniform vec2 uRes;
uniform vec3 uCol[4];
uniform float uTone;
out vec4 outColor;
// Lighter / darker (lib/tone.ts): per-channel gamma; uTone = 1 leaves the pixels exactly as they are.
vec3 tone(vec3 c){ return uTone == 1.0 ? c : pow(clamp(c, 0.0, 1.0), vec3(uTone)); }
vec3 base(vec2 px){ return texture(uBase, clamp(px, vec2(0.5), uRes - 0.5) / uRes).rgb; }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// Brightness relative to the look's own darkest..lightest colour.
float lnorm(vec3 c){
  float lo = 1.0, hi = 0.0;
  for (int i = 0; i < 4; i++) { float l = luma(uCol[i]); lo = min(lo, l); hi = max(hi, l); }
  return clamp((luma(c) - lo) / max(hi - lo, 0.05), 0.0, 1.0);
}
float S(){ return min(uRes.x, uRes.y) / 720.0; }
`;

export const MATERIAL_FRAG: Record<DrawnMaterial, string> = {
  // Fluted glass: vertical reeds, each a small cylinder lens that bends and softens the image.
  fluted: `${HEAD}
void main(){
  vec2 fc = gl_FragCoord.xy;
  float w = 40.0 * S();
  float n = (fract(fc.x / w) - 0.5) * 2.0;   // -1..1 across the reed
  float bend = n * abs(n) * w * 1.15;         // stronger towards the edges
  vec3 c = vec3(0.0);
  for (int i = -3; i <= 3; i++) c += base(vec2(fc.x - bend, fc.y + float(i) * 6.0 * S()));
  c /= 7.0;
  float rim = smoothstep(0.80, 1.0, abs(n));
  float hi = smoothstep(0.55, 0.0, abs(n + 0.45)) * 0.10;
  c = c * (1.0 - rim * 0.14) + hi + rim * 0.04;
  c += (h21(fc) - 0.5) / 255.0;
  outColor = vec4(tone(clamp(c, 0.0, 1.0)), 1.0);
}`,

  // Rippled glass: soft diagonal waves bend the image like poured glass.
  ripple: `${HEAD}
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 p = fc / (90.0 * S());
  vec2 d = vec2(cos(0.62), sin(0.62));
  float ph = dot(p, d) + sin(dot(p, vec2(-d.y, d.x)) * 0.55) * 1.6;
  float wv = sin(ph * 3.14159);
  float sl = cos(ph * 3.14159);
  vec2 off = d * wv * 60.0 * S();
  vec3 c = (base(fc + off) + base(fc + off * 1.06 + vec2(2.0))) * 0.5;
  c += pow(max(sl, 0.0), 3.0) * 0.07;
  c *= 1.0 - pow(max(-sl, 0.0), 3.0) * 0.07;
  c += (h21(fc) - 0.5) / 255.0;
  outColor = vec4(tone(clamp(c, 0.0, 1.0)), 1.0);
}`,

  // Ordered dither: Bayer 8×8 on chunky pixels, 4 levels per channel so hues survive.
  dither: `${HEAD}
float bayer(ivec2 p){
  int m[64] = int[64](0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
    3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21);
  return (float(m[(p.y & 7) * 8 + (p.x & 7)]) + 0.5) / 64.0;
}
void main(){
  float px = max(1.0, floor(4.0 * S() + 0.5));
  vec2 cell = floor(gl_FragCoord.xy / px);
  vec3 c = base((cell + 0.5) * px);
  vec3 q = floor(c * 3.0 + bayer(ivec2(cell))) / 3.0;
  outColor = vec4(tone(clamp(q, 0.0, 1.0)), 1.0);
}`,

  // Halftone: a 30° dot screen, each dot in its own colour, on a darkened first colour.
  halftone: `${HEAD}
void main(){
  vec2 fc = gl_FragCoord.xy;
  float cs = 15.0 * S();
  float a = 0.5236;
  mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 q = R * fc / cs;
  vec2 id = floor(q) + 0.5;
  vec3 c = base(transpose(R) * id * cs);
  float r = sqrt(0.08 + 0.92 * lnorm(c)) * 0.64;
  float aa = 1.2 / cs;
  float m = 1.0 - smoothstep(r - aa, r + aa, length(q - id));
  outColor = vec4(tone(clamp(mix(uCol[0] * 0.55, c * 1.08, m), 0.0, 1.0)), 1.0);
}`,
};

/** The tone curve alone, for a wallpaper without a material: the pixels through `tone()`. */
export const TONE_FRAG = `${HEAD}
void main(){
  outColor = vec4(tone(base(gl_FragCoord.xy)), 1.0);
}`;
