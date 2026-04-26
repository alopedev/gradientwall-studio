/**
 * Lemon Squeezy hosted-checkout integration.
 *
 * Loads `lemon.js` lazily (first call only) so the home / Studio bundle
 * stays small. Opens the overlay with `pack_slug` in `custom_data` so the
 * webhook can route the order to the correct pack on the way out.
 */

declare global {
  interface Window {
    LemonSqueezy?: {
      Url: { Open: (url: string) => void };
    };
    createLemonSqueezy?: () => void;
  }
}

const STORE = import.meta.env.VITE_LEMONSQUEEZY_STORE as string | undefined;
const SCRIPT_URL = "https://app.lemonsqueezy.com/js/lemon.js";

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.LemonSqueezy) return resolve();
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.defer = true;
    s.onload = () => {
      window.createLemonSqueezy?.();
      resolve();
    };
    s.onerror = () => reject(new Error("Failed to load Lemon Squeezy script"));
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export interface CheckoutInput {
  variantId: string;
  packSlug: string;
}

export async function openCheckout({ variantId, packSlug }: CheckoutInput): Promise<void> {
  if (!STORE) {
    throw new Error("VITE_LEMONSQUEEZY_STORE env var is not set");
  }
  await loadScript();
  // The bracketed `checkout[custom][pack_slug]` syntax mirrors LS docs;
  // encodeURIComponent the slug only — the brackets are part of the contract.
  const url = `https://${STORE}/buy/${variantId}?embed=1&checkout[custom][pack_slug]=${encodeURIComponent(packSlug)}`;
  window.LemonSqueezy?.Url.Open(url);
}

/** True when the env var is configured — drives the disabled/enabled state of the Buy button. */
export function isCheckoutConfigured(): boolean {
  return !!STORE;
}
