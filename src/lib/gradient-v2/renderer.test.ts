// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWallpaperV2 } from "./export";
import { createRendererV2, paintV2, WebGL2UnavailableError, type V2Renderer } from "./renderer";

const RAMP = ["#0a0a10", "#3b1a63", "#e2553a", "#f7c890"];

/** Minimal WebGL2 stand-in that records what the renderer asks of it. */
function fakeGl(opts: { clampTo?: [number, number]; compileOk?: boolean } = {}) {
  const calls: { name: string; args: unknown[] }[] = [];
  const canvas = { width: 300, height: 150 } as HTMLCanvasElement;
  const rec =
    (name: string, ret?: unknown) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
      return ret;
    };
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    TRIANGLES: 8,
    SCISSOR_TEST: 9,
    get drawingBufferWidth() {
      return opts.clampTo?.[0] ?? canvas.width;
    },
    get drawingBufferHeight() {
      return opts.clampTo?.[1] ?? canvas.height;
    },
    createShader: rec("createShader", {}),
    shaderSource: rec("shaderSource"),
    compileShader: rec("compileShader"),
    getShaderParameter: () => opts.compileOk ?? true,
    getShaderInfoLog: () => "boom",
    deleteShader: rec("deleteShader"),
    createProgram: rec("createProgram", {}),
    attachShader: rec("attachShader"),
    bindAttribLocation: rec("bindAttribLocation"),
    linkProgram: rec("linkProgram"),
    getProgramParameter: () => true,
    getProgramInfoLog: () => "",
    createBuffer: rec("createBuffer", {}),
    bindBuffer: rec("bindBuffer"),
    bufferData: rec("bufferData"),
    enableVertexAttribArray: rec("enableVertexAttribArray"),
    vertexAttribPointer: rec("vertexAttribPointer"),
    getUniformLocation: (_p: unknown, n: string) => n,
    viewport: rec("viewport"),
    useProgram: rec("useProgram"),
    uniform2f: rec("uniform2f"),
    uniform1ui: rec("uniform1ui"),
    uniform3fv: rec("uniform3fv"),
    uniform1f: rec("uniform1f"),
    uniform1i: rec("uniform1i"),
    enable: rec("enable"),
    disable: rec("disable"),
    scissor: rec("scissor"),
    drawArrays: rec("drawArrays"),
    finish: rec("finish"),
    isContextLost: () => false,
  };
  canvas.getContext = ((type: string) =>
    type === "webgl2" ? gl : null) as HTMLCanvasElement["getContext"];
  return { canvas, gl, calls };
}

const named = (calls: { name: string; args: unknown[] }[], name: string) =>
  calls.filter((c) => c.name === name);

describe("createRendererV2", () => {
  it("throws WebGL2UnavailableError when the browser has no WebGL2", () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(() => createRendererV2(canvas)).toThrow(WebGL2UnavailableError);
  });

  it("surfaces shader compile errors with the driver log", () => {
    const { canvas } = fakeGl({ compileOk: false });
    expect(() => createRendererV2(canvas)).toThrow(/boom/);
  });

  it("sizes the canvas and sets every uniform once per draw", () => {
    const { canvas, calls } = fakeGl();
    const r = createRendererV2(canvas);
    r.draw({ colors: RAMP, style: "aurora", seed: 9, lightAngle: 90 }, 1290, 2796);
    expect([canvas.width, canvas.height]).toEqual([1290, 2796]);
    expect(named(calls, "uniform2f")[0].args).toEqual(["uRes", 1290, 2796]);
    expect(named(calls, "uniform1ui")[0].args).toEqual(["uSeed", 9]);
    expect(named(calls, "uniform1i")[0].args).toEqual(["uStyle", 1]);
    const angle = named(calls, "uniform1f").find((c) => c.args[0] === "uLightAngle");
    expect(angle?.args[1]).toBeCloseTo(0); // compass 90 = right = math 0
    expect(named(calls, "drawArrays")).toHaveLength(1);
    expect(named(calls, "enable")).toHaveLength(0);
  });

  it("renders large exports in strips that cover every row exactly once", () => {
    const { canvas, calls } = fakeGl();
    const r = createRendererV2(canvas);
    r.draw({ colors: RAMP, style: "liquid", seed: 1 }, 5120, 2880, { strip: 512 });
    const strips = named(calls, "scissor").map((c) => c.args as number[]);
    expect(strips).toHaveLength(6);
    expect(strips.reduce((sum, s) => sum + s[3], 0)).toBe(2880);
    expect(strips.at(-1)).toEqual([0, 2560, 5120, 320]);
    expect(named(calls, "drawArrays")).toHaveLength(6);
    expect(named(calls, "disable")[0].args).toEqual([9]);
  });

  it("refuses a drawing buffer the browser clamped, so callers can fall back", () => {
    const { canvas } = fakeGl({ clampTo: [4096, 2304] });
    const r = createRendererV2(canvas);
    expect(() => r.draw({ colors: RAMP, style: "liquid", seed: 1 }, 5120, 2880)).toThrow(
      WebGL2UnavailableError,
    );
  });
});

describe("paintV2", () => {
  it("draws with the renderer and blits the result into the target canvas", () => {
    const drawImage = vi.fn();
    const target = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
    } as unknown as HTMLCanvasElement;
    const draw = vi.fn();
    const renderer = { canvas: {} as HTMLCanvasElement, draw, isContextLost: () => false };
    paintV2(target, { colors: RAMP, style: "liquid", seed: 3 }, 640, 360, {}, renderer);
    expect(draw).toHaveBeenCalledWith({ colors: RAMP, style: "liquid", seed: 3 }, 640, 360, {});
    expect([target.width, target.height]).toEqual([640, 360]);
    expect(drawImage).toHaveBeenCalledWith(renderer.canvas, 0, 0);
  });
});

describe("renderWallpaperV2", () => {
  afterEach(() => vi.restoreAllMocks());

  const target = () =>
    ({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
    }) as unknown as HTMLCanvasElement;
  const params = { colors: RAMP, style: "liquid" as const, seed: 5 };

  it("returns null without WebGL2 so the caller uses the v1 engine", () => {
    expect(renderWallpaperV2(params, 100, 100, { supported: () => false })).toBeNull();
  });

  it("returns null when the GPU can't allocate the size", () => {
    const renderer: V2Renderer = {
      canvas: {} as HTMLCanvasElement,
      draw: () => {
        throw new WebGL2UnavailableError("clamped");
      },
      isContextLost: () => false,
    };
    const out = renderWallpaperV2(params, 5120, 2880, {
      supported: () => true,
      renderer: () => renderer,
      canvasFactory: target,
    });
    expect(out).toBeNull();
  });

  it("returns null and logs on any other GPU error", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const renderer: V2Renderer = {
      canvas: {} as HTMLCanvasElement,
      draw: () => {
        throw new Error("driver says no");
      },
      isContextLost: () => false,
    };
    const out = renderWallpaperV2(params, 100, 100, {
      supported: () => true,
      renderer: () => renderer,
      canvasFactory: target,
    });
    expect(out).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("renders the full size in export strips", () => {
    const draw = vi.fn();
    const renderer: V2Renderer = {
      canvas: {} as HTMLCanvasElement,
      draw,
      isContextLost: () => false,
    };
    const out = renderWallpaperV2(params, 5120, 2880, {
      supported: () => true,
      renderer: () => renderer,
      canvasFactory: target,
    });
    expect(out?.width).toBe(5120);
    expect(draw).toHaveBeenCalledWith(params, 5120, 2880, { strip: 512 });
  });
});
