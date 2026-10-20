import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FavoriteConfig } from "@/lib/look";
import type { ActiveMask } from "@/lib/palettes";

/**
 * useFavoritesStore — galería persistente del Studio v2.
 *
 * Sucesor con propósito redefinido de `useHistoryStore` (v1). Mientras que el
 * historial v1 era "auto-snapshot de lo que vas mirando" (max 12, sin orden
 * editable), favoritos v2 es "lo que YO he pineado explícitamente"
 * (max 24, drag-reorder, click carga, X elimina). Persistido en localStorage
 * con schema versionado para que cambios futuros del shape no corrompan los
 * datos del usuario.
 *
 * Key namespace: `gw:favorites:v1`. El `v1` del nombre deja sitio a futuras
 * versiones del shape. El `gw_history` del Studio antiguo no se importa
 * (decidido 2026-10-20: la web no tuvo usuarios reales con ese historial).
 *
 * Cap 24 con drop FIFO (al pinear cuando ya hay 24, el más antiguo cae). El
 * número se elige para que la tira muestre 6-8 thumbnails simultáneos con
 * scroll horizontal cómodo en pantallas comunes.
 */

/**
 * Item de la galería de favoritos. `id` se genera en `pin()` con crypto.randomUUID
 * (fallback timestamp si la API no está disponible). `createdAt` para mostrar
 * "hace 2h" en hover o para futura ordenación por fecha.
 */
export interface FavoriteItem {
  id: string;
  config: FavoriteConfig;
  createdAt: number;
}

export interface FavoritesState {
  items: FavoriteItem[];
  /** Pinea la config actual al inicio de la lista. Cap 24 con drop FIFO. */
  pin: (config: FavoriteConfig) => void;
  /** Elimina un item por id. No-op si el id no existe. */
  unpin: (id: string) => void;
  /** Reordena la lista al orden dado. Ignora ids desconocidos. */
  reorder: (ids: string[]) => void;
  /** Vacía la lista. */
  clear: () => void;
}

export const MAX_FAVORITES = 24;
export const FAVORITES_SCHEMA_VERSION = 1;
export const FAVORITES_STORAGE_KEY = "gw:favorites:v1";

const generateId = (): string => {
  // crypto.randomUUID está disponible en navegadores modernos y Node ≥16.7.
  // Fallback determinista por timestamp + random — bueno suficiente para
  // entornos sin la API (entornos viejos, jsdom muy stripped).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fav_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Storage idiomático con fallback in-memory para SSR / jsdom. Mismo patrón que
 * `useHistoryStore` para que ambos stores se comporten igual fuera del browser.
 */
const storage = createJSONStorage(() => {
  if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
    return localStorage;
  }
  const mem = new Map<string, string>();
  return {
    get length() {
      return mem.size;
    },
    clear: () => mem.clear(),
    getItem: (k) => mem.get(k) ?? null,
    key: (i) => [...mem.keys()][i] ?? null,
    removeItem: (k) => void mem.delete(k),
    setItem: (k, v) => void mem.set(k, String(v)),
  } satisfies Storage;
});

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      items: [],
      pin: (config) =>
        set((state) => {
          const newItem: FavoriteItem = {
            id: generateId(),
            config: {
              ...config,
              active: config.active ? ([...config.active] as ActiveMask) : undefined,
            },
            createdAt: Date.now(),
          };
          // Cap FIFO drop — pinear cuando ya hay MAX_FAVORITES elimina el más antiguo.
          const next = [newItem, ...state.items].slice(0, MAX_FAVORITES);
          return { items: next };
        }),
      unpin: (id) => set((state) => ({ items: state.items.filter((it) => it.id !== id) })),
      reorder: (ids) =>
        set((state) => {
          const byId = new Map(state.items.map((it) => [it.id, it] as const));
          const reordered = ids.map((id) => byId.get(id)).filter((it): it is FavoriteItem => !!it);
          // Garantiza que items no listados (race condition con pin paralelo)
          // se preservan al final en su orden original. Casi siempre será
          // empty pero defiende el caso degradado.
          const seen = new Set(ids);
          const leftover = state.items.filter((it) => !seen.has(it.id));
          return { items: [...reordered, ...leftover] };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      storage,
      version: FAVORITES_SCHEMA_VERSION,
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
