import { afterEach, vi } from "vitest";

// Functions tests run in environment "node" — DOM-aware setup must early-out
// or we crash importing @testing-library/jest-dom (which probes window).
if (typeof window === "undefined") {
  // Nothing to set up in pure-Node tests.
} else {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");

  // RTL auto-cleanup between tests (required when `globals: false`).
  afterEach(() => cleanup());

  installDomShims();
}

function installDomShims(): void {
  // ─────────────────────────────────────────────────────────────────────────────
  // localStorage shim
  // Node 22+ ships an experimental native `localStorage` global which shadows
  // jsdom's implementation and is unusable without `--localstorage-file=<path>`.
  // Install a plain in-memory Storage shim on globalThis so zustand's persist
  // middleware sees a working Storage interface in tests.
  // ─────────────────────────────────────────────────────────────────────────────
  const memStore = new Map<string, string>();
  const memStorage: Storage = {
    get length() {
      return memStore.size;
    },
    clear: () => memStore.clear(),
    getItem: (k) => memStore.get(k) ?? null,
    key: (i) => [...memStore.keys()][i] ?? null,
    removeItem: (k) => void memStore.delete(k),
    setItem: (k, v) => void memStore.set(k, String(v)),
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memStorage,
    writable: true,
    configurable: true,
  });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      value: memStorage,
      writable: true,
      configurable: true,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Canvas 2D context mock
  // jsdom returns null from HTMLCanvasElement.getContext("2d") — renderGradient
  // and noise-tile creation early-return on null, so components that mount a
  // canvas would fail the paint step silently but without crashing. We install
  // a no-op-enough 2D context so code can exercise fill/gradient calls during
  // tests without exploding.
  // ─────────────────────────────────────────────────────────────────────────────
  const fakeContext = {
    fillStyle: "",
    filter: "",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(() => ({})),
    createImageData: vi.fn((w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    })),
    putImageData: vi.fn(),
    getImageData: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => fakeContext,
  ) as unknown as HTMLCanvasElement["getContext"];
  HTMLCanvasElement.prototype.toBlob = vi.fn((cb: BlobCallback, type?: string) => {
    cb(new Blob(["mock"], { type: type ?? "image/png" }));
  }) as unknown as HTMLCanvasElement["toBlob"];
  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => "data:image/png;base64,mock",
  ) as unknown as HTMLCanvasElement["toDataURL"];

  // jsdom doesn't implement Web Animations API — stub Element.animate so the
  // locked-palette shake animation doesn't throw when clicked.
  Element.prototype.animate = vi.fn(() => ({
    finished: Promise.resolve(),
    cancel: vi.fn(),
    finish: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    reverse: vi.fn(),
    onfinish: null,
    oncancel: null,
    onremove: null,
    currentTime: 0,
    effect: null,
    id: "",
    pending: false,
    playState: "finished",
    playbackRate: 1,
    ready: Promise.resolve(),
    replaceState: "active",
    startTime: 0,
    timeline: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  })) as unknown as Element["animate"];

  // jsdom doesn't implement IntersectionObserver — stub so lazy Gallery tests work.
  class IOStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: IOStub,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "IntersectionObserver", {
    value: IOStub,
    writable: true,
    configurable: true,
  });

  // jsdom doesn't implement ResizeObserver — stub so fitted-canvas hooks don't throw.
  class ROStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ROStub,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "ResizeObserver", {
    value: ROStub,
    writable: true,
    configurable: true,
  });

  // jsdom doesn't implement matchMedia — stub returning "no match" so
  // prefers-reduced-motion checks in motion-aware code don't throw during tests.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  });
}
