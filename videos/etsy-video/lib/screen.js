// Screen material: shows wallpaper A, or A → B mid-transition with a Bauhaus
// edge (a band of accent colour on the moving front), plus a soft glass sheen.
// mode 0 iris from `origin` · 1 straight wipe along `dir` · 2 clock sweep.
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const fragmentShader = /* glsl */ `
  uniform sampler2D texA; uniform sampler2D texB;
  uniform float progress; uniform float mode; uniform float aspect; uniform float sheen;
  uniform vec2 origin; uniform vec2 dir; uniform vec3 accent;
  varying vec2 vUv;
  const float PI = 3.14159265;
  void main() {
    vec3 a = texture2D(texA, vUv).rgb;
    vec3 b = texture2D(texB, vUv).rgb;
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
      accent: { value: new THREE.Color() },
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
    u.accent.value.set(state.swap.accent);
  }
}
