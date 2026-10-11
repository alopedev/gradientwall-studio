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
import type { PixelRect } from "./backdrop";
import { resolveV2Uniforms, type V2Params } from "./params";

/** Rows per draw call when exporting large sizes; keeps each draw under the GPU watchdog. */
export const EXPORT_STRIP_ROWS = 512;

export interface DrawOptions {
  /** Render in horizontal strips of this many rows (0 = one draw). */
  strip?: number;
  /** Seconds, for a renderer created with `animated: true`; ignored by the still shader. */
  time?: number;
  /**
   * Shade only these rectangles (GL pixels, origin bottom left); the rest of
   * the buffer keeps its previous frame. For a backdrop partly hidden under
   * opaque boxes (see `visibleRegions`). Takes precedence over `strip`.
   */
  regions?: readonly PixelRect[];
}

export interface RendererOptions {
  /** Use the drifting shader (`shader-animated.ts`): for backgrounds that move. */
  animated?: boolean;
}

export interface V2Renderer {
  readonly canvas: HTMLCanvasElement;
  draw(params: V2Params, w: number, h: number, opts?: DrawOptions): void;
  isContextLost(): boolean;
  /**
   * False while the browser is still compiling the shader in the background
   * (KHR_parallel_shader_compile). A draw before then still works, but waits
   * on the GPU; a caller that can wait (the backdrop) checks this first.
   */
  isReady(): boolean;
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

function createShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new WebGL2UnavailableError("Could not create shader");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

function checkCompiled(gl: WebGL2RenderingContext, sh: WebGLShader): void {
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed: ${log}`);
  }
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

  // With KHR_parallel_shader_compile the driver compiles off the main thread,
  // as long as nothing asks for the result early: status checks and uniform
  // lookups wait for it. So they happen in `link()`, on the first draw.
  const parallel = gl.getExtension("KHR_parallel_shader_compile") as {
    COMPLETION_STATUS_KHR: number;
  } | null;

  const prog = gl.createProgram();
  if (!prog) throw new WebGL2UnavailableError("Could not create program");
  const vs = createShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, animated ? FRAG_ANIMATED : FRAG);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.linkProgram(prog);

  // One oversized triangle covers the viewport.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  let linked: Record<UniformName, WebGLUniformLocation | null> | null = null;
  function link(): Record<UniformName, WebGLUniformLocation | null> {
    if (linked) return linked;
    checkCompiled(gl, vs);
    checkCompiled(gl, fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(prog)}`);
    }
    const found = {} as Record<UniformName, WebGLUniformLocation | null>;
    for (const n of UNIFORMS) found[n] = gl.getUniformLocation(prog, n);
    linked = found;
    return found;
  }
  // Without the extension there is nothing to wait for: fail fast, as before.
  if (!parallel) link();

  const isReady = () =>
    linked !== null ||
    !parallel ||
    gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR) === true;

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
    const loc = link();
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
    if (opts.regions) {
      gl.enable(gl.SCISSOR_TEST);
      for (const r of opts.regions) {
        gl.scissor(r.x, r.y, r.width, r.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      gl.disable(gl.SCISSOR_TEST);
    } else if (strip > 0 && strip < h) {
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

  return { canvas, draw, isContextLost: () => gl.isContextLost(), isReady };
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

/** Test-only. */
export function __resetWebGL2ProbeForTests(): void {
  supported = null;
}

/** Cached WebGL2 probe. False in jsdom and on browsers without WebGL2. */
export function isWebGL2Supported(): boolean {
  if (supported !== null) return supported;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    supported = !!gl;
    // Give the probe's context back at once: browsers cap live contexts per page.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
