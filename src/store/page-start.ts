import { pickLook, withSharedLook } from "@/lib/look";
import { decodeLookParam, LOOK_PARAM } from "@/lib/look-url";
import { ALL_ACTIVE } from "@/lib/palettes";
import { LANDINGS, landingPath } from "@/lib/seo/landings";
import { loadLook } from "./coordinator";
import { useConfigStore } from "./useConfigStore";
import { useFavoritesStore } from "./useFavoritesStore";
import { useMotionStore } from "./useMotionStore";

/**
 * Put the Studio on the look a page starts with (a landing's style, device,
 * grain or colours) before it renders. The prerender calls it per page and `main.tsx`
 * before hydrating, so both render the same wallpaper.
 */
export function startLookFor(pathname: string): void {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const look = LANDINGS.find((l) => landingPath(l.slug) === path)?.look;
  if (!look) return;
  // New colours bring every slot back on, as picking a palette does.
  useConfigStore.setState(look.colors ? { ...look, active: [...ALL_ACTIVE] } : look);
}

/** After the page has loaded and gone idle: React has hydrated by then. */
function whenSettled(cb: () => void): void {
  const idle = () =>
    typeof requestIdleCallback === "function"
      ? requestIdleCallback(cb, { timeout: 3000 })
      : setTimeout(cb, 500);
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}

/**
 * Load the saved favorites and motion pause. Not at startup: an update that
 * reaches a part of the page React is still hydrating makes it throw that part
 * away and draw it again (error #421). So only stores with something saved,
 * and only once the page has `later` settled.
 */
export function loadSavedPrefs(later: (cb: () => void) => void = whenSettled): void {
  const saved = [useFavoritesStore, useMotionStore].filter((store) => {
    try {
      return localStorage.getItem(store.persist.getOptions().name ?? "") !== null;
    } catch {
      return false;
    }
  });
  if (!saved.length) return;
  later(() => {
    for (const store of saved) void store.persist.rehydrate();
  });
}

/**
 * Open the wallpaper a link carries (`?w=`, see `lib/look-url`), e.g. from a
 * gallery image or a pin. Only once the page has settled, like the saved
 * prefs: the prerendered HTML can't know the query string.
 */
export function loadLinkedLook(
  search: string = window.location.search,
  later: (cb: () => void) => void = whenSettled,
): void {
  const shared = decodeLookParam(new URLSearchParams(search).get(LOOK_PARAM) ?? "");
  if (!shared) return;
  later(() => loadLook(withSharedLook(pickLook(useConfigStore.getState()), shared)));
}
