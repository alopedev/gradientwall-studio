/**
 * Cookieless visit counting with Umami Cloud: page views (the tracker follows
 * route changes on its own) plus three events, the numbers the launch plan
 * measures: `download` (Studio), `etsy-click` (any link to Etsy) and
 * `email-signup`. No cookies and no personal data, so no consent banner.
 *
 * The tracker posts to gateway.umami.is; both hosts are allowed in the CSP
 * (public/_headers).
 */

/** Umami Cloud website id (not a secret: it is in every page). Empty = analytics off. */
export const UMAMI_WEBSITE_ID = "4ecc4386-7200-482f-b0bb-4b37ec3f8a9f";

/** Only visits on this host count, so deploy previews and localhost don't. */
export const ANALYTICS_DOMAIN = "gradientwall.app";

const SCRIPT_SRC = "https://cloud.umami.is/script.js";

export type AnalyticsEvent = "download" | "etsy-click" | "email-signup";

type Umami = { track: (name: string, data?: Record<string, string | number>) => void };

function umami(): Umami | undefined {
  return (window as Window & { umami?: Umami }).umami;
}

/** Sends an event; a no-op while the tracker hasn't loaded or is blocked. */
export function track(name: AnalyticsEvent, data?: Record<string, string | number>): void {
  if (typeof window === "undefined") return;
  try {
    umami()?.track(name, data);
  } catch {
    // Counting must never break the page.
  }
}

export function isEtsyLink(href: string): boolean {
  try {
    const host = new URL(href).hostname;
    return host === "etsy.com" || host.endsWith(".etsy.com");
  } catch {
    return false;
  }
}

/**
 * Loads the tracker and starts counting Etsy clicks. Call from an effect,
 * never while rendering: the page is prerendered and hydrated. Returns the
 * cleanup for the click listener.
 */
export function startAnalytics({
  websiteId = UMAMI_WEBSITE_ID,
  domain = ANALYTICS_DOMAIN,
}: {
  websiteId?: string;
  domain?: string;
} = {}): () => void {
  if (!websiteId) return () => {};

  if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.defer = true;
    s.dataset.websiteId = websiteId;
    s.dataset.domains = domain;
    document.head.appendChild(s);
  }

  const onClick = (e: MouseEvent) => {
    const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (link && isEtsyLink(link.href)) {
      track("etsy-click", { href: link.href, page: window.location.pathname });
    }
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}
