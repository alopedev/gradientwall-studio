// Screen material: shows wallpaper A, or A → B mid-transition with a Bauhaus
// edge (a band of accent colour on the moving front), plus a soft glass sheen.
// mode 0 iris from `origin` · 1 straight wipe along `dir` · 2 clock sweep ·
// 3 paint smear along `dir` (bristle streaks, dragged pixels, wet highlight).
// `uvRect` (offset.xy, scale.zw) crops the texture, e.g. a 16:9 image on a disc.
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const fragmentShader = /* glsl */ `
  uniform sampler2D texA; uniform sampler2D texB;
  uniform float progress; uniform float mode; uniform float aspect; uniform float sheen;
  uniform vec2 origin; uniform vec2 dir; uniform vec3 accent; uniform vec4 uvRect;
  varying vec2 vUv;
  const float PI = 3.14159265;
  float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 q) {
    vec2 i = floor(q), f = fract(q), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 q) {
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 4; i++) { v += amp * vnoise(q); q *= 2.03; amp *= 0.5; }
    return v;
  }
  vec3 sampleA(vec2 uv) { return texture2D(texA, uvRect.xy + uv * uvRect.zw).rgb; }
  vec3 sampleB(vec2 uv) { return texture2D(texB, uvRect.xy + uv * uvRect.zw).rgb; }
  vec3 smear(vec2 p) {
    vec2 n = normalize(dir), t = vec2(-n.y, n.x);
    float along = dot(p, n), across = dot(p, t);
    float span = abs(n.x) * aspect * 0.5 + abs(n.y) * 0.5;
    float streak = fbm(vec2(along * 1.2, across * 9.0)) - 0.5;
    float bristle = vnoise(vec2(along * 3.0, across * 60.0)) - 0.5;
    float front = -span - 0.2 + progress * (2.0 * span + 0.4);
    float f = along + streak * 0.14 + bristle * 0.025 - front;
    vec2 uvDir = vec2(n.x / aspect, n.y);
    float ramp = smoothstep(0.0, 0.15, progress) * (1.0 - smoothstep(0.85, 1.0, progress));
    float kOld = 0.12 * smoothstep(0.3, 0.0, f) * step(0.0, f) * ramp;
    float kNew = 0.08 * smoothstep(-0.3, 0.0, f) * step(f, 0.0) * ramp;
    vec3 col = mix(sampleA(vUv - uvDir * kOld), sampleB(vUv - uvDir * kNew), smoothstep(0.02, -0.02, f));
    return col + exp(-pow(f / 0.07, 2.0)) * 0.16 * (0.6 + streak) * ramp;
  }
  void main() {
    vec3 a = sampleA(vUv);
    vec3 b = sampleB(vUv);
    vec2 p = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
    float band = 0.045;       // accent edge thickness (screen-height units)
    float f;                  // < 0 new · 0..band accent · > band old
    if (mode < 0.5) {
      vec2 o = vec2(origin.x * aspect * 0.5, origin.y * 0.5);
      float maxR = length(vec2(aspect * 0.5, 0.5)) + length(o);
      f = length(p - o) - progress * (maxR + band) + band;
    } else if (mode < 1.5) {
      vec2 n = normalize(dir);
      float span = abs(n.x) * aspect * 0.5 + abs(n.y) * 0.5;
      f = (dot(p, n) + span) - progress * (2.0 * span + band) + band;
    } else {
      vec2 o = vec2(origin.x * aspect * 0.5, origin.y * 0.5);
      float ang = fract((atan(p.x - o.x, p.y - o.y) + PI) / (2.0 * PI) + 0.5);
      band = 0.035;
      f = ang - progress * (1.0 + band) + band;
    }
    float aa = 0.0025;
    vec3 col = accent;
    col = mix(col, a, smoothstep(band - aa, band + aa, f));
    col = mix(col, b, 1.0 - smoothstep(-aa, aa, f));
    if (mode > 2.5) col = smear(p);
    if (progress <= 0.0) col = a;
    float s = dot(p, normalize(vec2(0.55, 1.0)));
    col += exp(-pow((s - sheen) / 0.11, 2.0)) * 0.085;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export function screenMaterial(aspect) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    toneMapped: false,
    uniforms: {
      texA: { value: null }, texB: { value: null }, progress: { value: 0 }, mode: { value: 0 },
      aspect: { value: aspect }, sheen: { value: -2 },
      origin: { value: new THREE.Vector2() }, dir: { value: new THREE.Vector2(0, 1) },
      accent: { value: new THREE.Color() }, uvRect: { value: new THREE.Vector4(0, 0, 1, 1) },
    },
  });
}

// Where a screen is at time t, given its starting design and its swaps
// ({ t, dur, from, to, mode, origin?, dir?, accent }).
export function screenAt(t, first, swaps, ease) {
  let cur = first;
  for (const sw of swaps) {
    if (t < sw.t) break;
    if (t < sw.t + sw.dur) return { a: sw.from, b: sw.to, p: ease((t - sw.t) / sw.dur), swap: sw };
    cur = sw.to;
  }
  return { a: cur, b: cur, p: 0, swap: null };
}

export function applyScreen(material, state, textures) {
  const u = material.uniforms;
  u.texA.value = textures[state.a];
  u.texB.value = textures[state.b];
  u.progress.value = state.p;
  if (state.swap) {
    u.mode.value = state.swap.mode;
    u.origin.value.set(...(state.swap.origin || [0, 0]));
    u.dir.value.set(...(state.swap.dir || [0, 1]));
    u.accent.value.set(state.swap.accent || "#000000");
  }
}
