/**
 * WebGL2 renderer for the v2 engine. The only file under `gradient-v2/` that
 * touches the GPU — the counterpart of `gradient/canvas2d.ts`.
 *
 * One renderer owns one WebGL2 context. Callers that paint into several
 * canvases (preview, thumbnails, export) share one renderer through
 * `paintV2`, which draws off-screen and blits into a 2D canvas, so the page
 * never holds more than one GPU context for wallpapers.
 */

import { FRAG, VERT } from "./shader";
import { FRAG_ANIMATED } from "./shader-animated";
import { resolveV2Uniforms, type V2Params } from "./params";

/** Rows per draw call when exporting large sizes; keeps each draw under the GPU watchdog. */
export const EXPORT_STRIP_ROWS = 512;

export interface DrawOptions {
  /** Render in horizontal strips of this many rows (0 = one draw). */
  strip?: number;
  /** Seconds, for a renderer created with `animated: true`; ignored by the still shader. */
  time?: number;
}

export interface RendererOptions {
  /** Use the drifting shader (`shader-animated.ts`): for backgrounds that move. */
  animated?: boolean;
}

export interface V2Renderer {
  readonly canvas: HTMLCanvasElement;
  draw(params: V2Params, w: number, h: number, opts?: DrawOptions): void;
  isContextLost(): boolean;
}

const UNIFORMS = [
  "uRes",
  "uSeed",
  "uCol",
  "uWarp",
  "uScale",
  "uGrain",
  "uLight",
  "uLightAngle",
  "uStyle",
  "uDither",
  "uTime",
] as const;
type UniformName = (typeof UNIFORMS)[number];

export class WebGL2UnavailableError extends Error {
  constructor(message = "WebGL2 is not available") {
    super(message);
    this.name = "WebGL2UnavailableError";
  }
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new WebGL2UnavailableError("Could not create shader");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return sh;
}

export function createRendererV2(
  canvas: HTMLCanvasElement,
  { animated = false }: RendererOptions = {},
): V2Renderer {
  const maybeGl = canvas.getContext("webgl2", {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: false,
    premultipliedAlpha: false,
    // Pixels are read back (blit / encode) after the draw returns.
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  }) as WebGL2RenderingContext | null;
  if (!maybeGl) throw new WebGL2UnavailableError();
  const gl = maybeGl;

  const prog = gl.createProgram();
  if (!prog) throw new WebGL2UnavailableError("Could not create program");
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, animated ? FRAG_ANIMATED : FRAG));
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(prog)}`);
  }

  // One oversized triangle covers the viewport.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const loc = {} as Record<UniformName, WebGLUniformLocation | null>;
  for (const n of UNIFORMS) loc[n] = gl.getUniformLocation(prog, n);

  function draw(params: V2Params, w: number, h: number, opts: DrawOptions = {}): void {
    if (!(w > 0 && h > 0)) throw new RangeError(`Invalid size ${w}×${h}`);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    // Browsers may silently clamp a drawing buffer they can't allocate.
    if (gl.drawingBufferWidth !== w || gl.drawingBufferHeight !== h) {
      throw new WebGL2UnavailableError(
        `Drawing buffer clamped to ${gl.drawingBufferWidth}×${gl.drawingBufferHeight} (wanted ${w}×${h})`,
      );
    }
    const u = resolveV2Uniforms(params);
    gl.viewport(0, 0, w, h);
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook.
    gl.useProgram(prog);
    gl.uniform2f(loc.uRes, w, h);
    gl.uniform1ui(loc.uSeed, u.seed);
    gl.uniform3fv(loc.uCol, new Float32Array(u.colors));
    gl.uniform1f(loc.uWarp, u.warp);
    gl.uniform1f(loc.uScale, u.scale);
    gl.uniform1f(loc.uGrain, u.grain);
    gl.uniform1f(loc.uLight, u.light);
    gl.uniform1f(loc.uLightAngle, u.lightAngleRad);
    gl.uniform1i(loc.uStyle, u.style);
    gl.uniform1f(loc.uDither, u.dither);
    if (animated) gl.uniform1f(loc.uTime, opts.time ?? 0);

    const strip = opts.strip ?? 0;
    if (strip > 0 && strip < h) {
      gl.enable(gl.SCISSOR_TEST);
      for (let y = 0; y < h; y += strip) {
        gl.scissor(0, y, w, Math.min(strip, h - y));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.finish();
      }
      gl.disable(gl.SCISSOR_TEST);
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  return { canvas, draw, isContextLost: () => gl.isContextLost() };
}

let shared: V2Renderer | null = null;

/** Lazily creates (or re-creates after a context loss) the page-wide renderer. */
export function getSharedRendererV2(
  canvasFactory: () => HTMLCanvasElement = () => document.createElement("canvas"),
): V2Renderer {
  if (!shared || shared.isContextLost()) shared = createRendererV2(canvasFactory());
  return shared;
}

/** Test-only. */
export function __resetSharedRendererV2ForTests(): void {
  shared = null;
}

let supported: boolean | null = null;

/** Cached WebGL2 probe. False in jsdom and on browsers without WebGL2. */
export function isWebGL2Supported(): boolean {
  if (supported !== null) return supported;
  try {
    const c = document.createElement("canvas");
    supported = !!c.getContext("webgl2");
  } catch {
    supported = false;
  }
  return supported;
}

/**
 * Paint a v2 wallpaper into `target` (a 2D canvas) at w×h. Draws with the
 * shared renderer and copies the pixels across. Throws
 * `WebGL2UnavailableError` when the GPU path can't run, so callers can fall
 * back to the v1 engine.
 */
export function paintV2(
  target: HTMLCanvasElement,
  params: V2Params,
  w: number,
  h: number,
  opts: DrawOptions = {},
  renderer: V2Renderer = getSharedRendererV2(),
): void {
  renderer.draw(params, w, h, opts);
  if (target.width !== w) target.width = w;
  if (target.height !== h) target.height = h;
  const ctx = target.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable on target canvas");
  ctx.drawImage(renderer.canvas, 0, 0);
}
