// Node 22+ ships an experimental native `localStorage` global which shadows
// jsdom's implementation and is unusable without `--localstorage-file=<path>`.
// Install a plain in-memory Storage shim on globalThis so zustand's persist
// middleware sees a working Storage interface in tests.
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
