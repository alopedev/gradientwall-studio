/**
 * GLSL sources for the v2 engine (WebGL2).
 *
 * Ported verbatim from the approved prototype (`web-plan/prototipo/motor-v2.html`):
 * FBM domain warping with a PCG hash, colour mixing in OKLab that preserves
 * chroma, gamut mapping by chroma bisection, two-layer grain that scales with
 * resolution and a ±1 LSB TPDF dither before 8-bit quantisation.
 *
 * Same rule as `src/lib/gradient/spec.ts`: this is signed-off visual math.
 * Don't "clean it up" without a visual regression to fix.
 */

export const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

export const FRAG = `#version 300 es
precision highp float;
precision highp int;

uniform vec2  uRes;        // resolución de salida completa (px)
uniform uint  uSeed;
uniform vec3  uCol[4];     // sRGB 0..1, ordenados de oscuro a claro idealmente
uniform float uWarp;
uniform float uScale;
uniform float uGrain;      // 0..1
uniform float uLight;      // 0..1
uniform float uLightAngle; // radianes
uniform int   uStyle;      // 0 liquid, 1 aurora, 2 grain-mesh
uniform float uDither;     // 1 = on
out vec4 outColor;

// ---------- hash / ruido ----------
uvec3 pcg3d(uvec3 v){
  v = v * 1664525u + 1013904223u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  v ^= v >> 16u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  return v;
}
const float INV_U32 = 1.0 / 4294967295.0;
vec3 hash3(uvec3 v){ return vec3(pcg3d(v)) * INV_U32; }

vec2 grad2(ivec2 c, uint salt){
  uvec3 h = pcg3d(uvec3(uvec2(c), uSeed ^ salt));
  vec2 g = vec2(h.xy) * INV_U32 * 2.0 - 1.0;
  return normalize(g + 1e-5);
}
float gnoise(vec2 p, uint salt){
  ivec2 i = ivec2(floor(p)); vec2 f = fract(p);
  vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  float a = dot(grad2(i, salt), f);
  float b = dot(grad2(i+ivec2(1,0), salt), f-vec2(1,0));
  float c = dot(grad2(i+ivec2(0,1), salt), f-vec2(0,1));
  float d = dot(grad2(i+ivec2(1,1), salt), f-vec2(1,1));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y) * 1.4; // ~[-1,1]
}
const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
float fbm(vec2 p, int oct, float gain, uint salt){
  float s = 0.0, a = 0.5, n = 0.0;
  for (int i = 0; i < 7; i++) {
    if (i >= oct) break;
    s += a * gnoise(p, salt + uint(i) * 101u);
    n += a; a *= gain;
    p = ROT * p * 2.03 + vec2(13.7, 7.1);
  }
  return s / n; // normalizado ~[-1,1], típicamente ±0.5
}

// ---------- color ----------
vec3 srgb2lin(vec3 c){ return mix(c/12.92, pow((c+0.055)/1.055, vec3(2.4)), step(0.04045, c)); }
vec3 lin2srgb(vec3 c){ c = max(c, 0.0); return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(0.0031308, c)); }
vec3 lin2oklab(vec3 c){
  float l = 0.4122214708*c.r + 0.5363325363*c.g + 0.0514459929*c.b;
  float m = 0.2119034982*c.r + 0.6806995451*c.g + 0.1073969566*c.b;
  float s = 0.0883024619*c.r + 0.2817188376*c.g + 0.6299787005*c.b;
  l = pow(max(l,0.0), 1.0/3.0); m = pow(max(m,0.0), 1.0/3.0); s = pow(max(s,0.0), 1.0/3.0);
  return vec3(0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
              1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
              0.0259040371*l + 0.7827717662*m - 0.8086757660*s);
}
vec3 oklab2lin(vec3 c){
  float l = c.x + 0.3963377774*c.y + 0.2158037573*c.z;
  float m = c.x - 0.1055613458*c.y - 0.0638541728*c.z;
  float s = c.x - 0.0894841775*c.y - 1.2914855480*c.z;
  l = l*l*l; m = m*m*m; s = s*s*s;
  return vec3( 4.0767416621*l - 3.3077118913*m + 0.2309699292*s,
              -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
              -0.0041960863*l - 0.7034186147*m + 1.7076147010*s);
}
bool inGamut(vec3 c){ return all(greaterThanEqual(c, vec3(-1e-4))) && all(lessThanEqual(c, vec3(1.0+1e-4))); }
// Mapeo de gamut: conserva L y tono, reduce croma hasta entrar en sRGB.
vec3 oklab2linGamut(vec3 lab){
  lab.x = clamp(lab.x, 0.0, 1.0);
  vec3 c = oklab2lin(lab);
  if (inGamut(c)) return c;
  float lo = 0.0, hi = 1.0;
  for (int i = 0; i < 10; i++) {
    float mid = 0.5*(lo+hi);
    if (inGamut(oklab2lin(vec3(lab.x, lab.yz*mid)))) lo = mid; else hi = mid;
  }
  return clamp(oklab2lin(vec3(lab.x, lab.yz*lo)), 0.0, 1.0);
}

vec3 LAB[4]; float CH[4];
// Mezcla ponderada en OKLab conservando croma (evita el "gris del medio").
vec3 mixLab(vec4 w){
  w /= max(w.x+w.y+w.z+w.w, 1e-6);
  vec3 lab = w.x*LAB[0] + w.y*LAB[1] + w.z*LAB[2] + w.w*LAB[3];
  float cTarget = w.x*CH[0] + w.y*CH[1] + w.z*CH[2] + w.w*CH[3];
  float c = length(lab.yz);
  if (c > 1e-4) {
    float k = mix(1.0, cTarget / c, 0.85);
    lab.yz *= min(k, 3.0);
  }
  return lab;
}
// Rampa suave de 4 paradas en t∈[0,1] → pesos.
vec4 ramp4(float t){
  t = clamp(t, 0.0, 1.0) * 3.0;
  vec4 w = vec4(0.0);
  float s = smoothstep(0.0, 1.0, fract(t));
  if (t < 1.0)      { w.x = 1.0-s; w.y = s; }
  else if (t < 2.0) { w.y = 1.0-s; w.z = s; }
  else if (t < 3.0) { w.z = 1.0-s; w.w = s; }
  else              { w.w = 1.0; }
  return w;
}

// ---------- estilos ----------
vec2 seedOff(uint salt){ return (hash3(uvec3(uSeed, salt, 7u)).xy - 0.5) * 200.0; }

float liquidField(vec2 p, out vec2 q, out vec2 r){
  q = vec2(fbm(p + seedOff(1u), 3, 0.45, 11u), fbm(p + seedOff(2u), 3, 0.45, 23u));
  r = vec2(fbm(p + uWarp*q + seedOff(3u), 3, 0.45, 37u), fbm(p + uWarp*q + seedOff(4u), 3, 0.45, 41u));
  return fbm(p + uWarp*r + seedOff(5u), 4, 0.38, 53u);
}

void main(){
  for (int i = 0; i < 4; i++) { LAB[i] = lin2oklab(srgb2lin(uCol[i])); CH[i] = length(LAB[i].yz); }

  vec2 fc = gl_FragCoord.xy;
  float shortSide = min(uRes.x, uRes.y);
  vec2 p0 = (fc - 0.5*uRes) / shortSide;           // lado corto = 1
  vec2 nrm = (fc - 0.5*uRes) / (0.5*uRes);         // [-1,1] en ambos ejes
  vec3 sh = hash3(uvec3(uSeed, 99u, 3u));
  float ang = sh.x * 6.2831853;
  mat2 rot = mat2(cos(ang), sin(ang), -sin(ang), cos(ang));
  vec2 ldir = vec2(cos(uLightAngle), sin(uLightAngle));

  // grano/dither por píxel
  uvec3 pix = uvec3(uvec2(fc), uSeed * 747796405u + 1u);
  vec3 h1 = hash3(pix);
  vec3 h2 = hash3(pix ^ uvec3(0x9E3779B9u, 0x85EBCA6Bu, 0xC2B2AE35u));

  vec3 lab;
  float grainBoost = 1.0;

  if (uStyle == 0) {
    // LIQUID: warp fuerte, sedoso
    vec2 p = rot * p0 * uScale;
    vec2 q, r;
    float f = liquidField(p, q, r);
    float t = 0.5 + 0.5 * tanh(f * 2.9 + (sh.y - 0.5) * 0.5);
    vec4 w = ramp4(t);
    // empujes secundarios por los campos intermedios (como en IQ): más variedad cromática
    float a1 = smoothstep(0.25, 0.85, length(q));
    float a2 = smoothstep(0.15, 0.7, abs(r.x)) * 0.55;
    w = mix(w, vec4(0,1,0,0), a1 * 0.45 * (1.0 - w.w));
    w = mix(w, vec4(0,0,1,0), a2 * (1.0 - w.x));
    lab = mixLab(w);
    // luz: pendiente del campo en la dirección de la luz (brillo satinado)
    if (uLight > 0.0) {
      float e = 0.02;
      float f2 = fbm(p + e*ldir + uWarp*r + seedOff(5u), 4, 0.38, 53u);
      float slope = clamp((f2 - f) / e * 0.35, -1.0, 1.0);
      lab.x += uLight * (0.085 * slope + 0.06 * dot(nrm, ldir) * 0.5);
    }
  } else if (uStyle == 1) {
    // AURORA: bandas verticales estiradas sobre fondo oscuro
    vec2 p = p0 * uScale;
    float tilt = (sh.y - 0.5) * 0.5;
    p.x += p.y * tilt;
    vec2 pa = vec2(p.x * 1.6, p.y * 0.22);
    float wx = fbm(vec2(pa.x * 0.6, pa.y * 3.0) + seedOff(1u), 4, 0.5, 11u);
    float x = pa.x + uWarp * 0.35 * wx;
    float band = fbm(vec2(x, pa.y) + seedOff(2u), 4, 0.5, 23u);
    float rays = gnoise(vec2(x * 9.0, pa.y * 0.6) + seedOff(3u), 31u) * 0.5 + 0.5;
    // perfil vertical: cortinas que caen desde arriba y se desvanecen
    float yN = fc.y / uRes.y;               // 0 abajo, 1 arriba
    float edge = fbm(vec2(x * 0.8, 3.0) + seedOff(4u), 3, 0.5, 47u);
    float top = 0.62 + 0.22 * edge;
    float vprof = smoothstep(top - 0.7, top, yN) * (1.0 - smoothstep(top, top + 0.4, yN) * 0.6);
    float I = smoothstep(-0.3, 0.45, band) * vprof * (0.65 + 0.35 * rays);
    I = clamp(I * 1.55, 0.0, 1.0);
    float hueT = 0.5 + 0.5 * tanh(fbm(vec2(x * 0.35, pa.y) + seedOff(5u), 3, 0.5, 59u) * 2.5);
    // rampa de 3 paradas sobre c1..c3
    float t3 = clamp(hueT, 0.0, 1.0) * 2.0;
    float s3 = smoothstep(0.0, 1.0, fract(t3));
    vec4 wb = t3 < 1.0 ? vec4(0.0, 1.0-s3, s3, 0.0) : vec4(0.0, 0.0, 1.0-s3, s3);
    vec4 bg = vec4(1.0, 0.0, 0.0, 0.0);
    // brillo extra: cerca del núcleo la cortina tiende al color más claro
    vec4 glow = vec4(0,0,0,1);
    vec4 w = mix(bg, wb, I);
    w = mix(w, glow, smoothstep(0.75, 1.0, I) * 0.35);
    lab = mixLab(w);
    // cielo: leve gradiente del fondo hacia c1 abajo
    lab = mix(lab, mixLab(vec4(0.75, 0.25, 0, 0)), (1.0 - I) * (1.0 - yN) * 0.5);
    if (uLight > 0.0) lab.x += uLight * 0.05 * dot(nrm, ldir);
  } else {
    // GRAIN-MESH: campos de color grandes y suaves (softmax de 4 ruidos) + grain mixer
    vec2 p = rot * p0 * uScale * 0.55;
    vec2 wq = vec2(fbm(p + seedOff(1u), 2, 0.5, 11u), fbm(p + seedOff(2u), 2, 0.5, 23u));
    p += uWarp * 0.3 * wq;
    float gm = (h1.z + h2.z - 1.0) * uGrain * 0.9;  // grain mixer: disuelve las fronteras en grano
    vec4 n = vec4(fbm(p + seedOff(3u), 2, 0.5, 31u), fbm(p + seedOff(4u), 2, 0.5, 37u),
                  fbm(p + seedOff(5u), 2, 0.5, 41u), fbm(p + seedOff(6u), 2, 0.5, 43u));
    n += gm;
    n.x += 0.12; // la base oscura domina un poco: más rango tonal
    vec4 w = exp((n - max(max(n.x,n.y),max(n.z,n.w))) * 5.5);
    lab = mixLab(w);
    if (uLight > 0.0) lab.x += uLight * 0.07 * dot(nrm, ldir);
    grainBoost = 1.7;
  }

  // ---------- grano en dos capas (en L de OKLab) ----------
  float L = clamp(lab.x, 0.0, 1.0);
  float lumResp = 0.45 + 2.2 * L * (1.0 - L);              // más en medios, algo en sombras
  float fine = (h1.x + h1.y - 1.0) * 1.2247;                // ~N(0,0.5)-ish, varianza 1/6*1.5
  float cell = max(1.0, shortSide / 900.0);                 // escala con la resolución
  // grueso: ruido de gradiente (isótropo, sin celdas cuadradas) en dos octavas rotadas
  vec2 gp = fc / (cell * 1.8);
  float coarse = gnoise(gp, 501u) * 0.65 + gnoise(ROT * gp * 1.9 + 3.1, 509u) * 0.35;
  float g = uGrain * grainBoost * lumResp * (0.032 * fine + 0.016 * coarse);
  lab.x += g;
  lab.yz *= 1.0 + g * 0.6; // el grano también toca algo de croma, más orgánico

  vec3 rgb = lin2srgb(oklab2linGamut(lab));
  // ---------- dither TPDF ±1 LSB antes de cuantizar a 8 bits ----------
  vec3 d1 = hash3(pix + uvec3(0x68E31DA4u, 0xB5297A4Du, 0x1B56C4E9u));
  vec3 d2 = hash3(pix + uvec3(0x7FEB352Du, 0x846CA68Bu, 0x2C1B3C6Du));
  rgb += (d1 + d2 - 1.0) / 255.0 * uDither;
  outColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}`;
