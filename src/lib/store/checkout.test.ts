// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Checkout = typeof import("./checkout");

/** Fresh module per test: the script promise is module state, the store is read at import. */
async function load(store = "gradientwall.lemonsqueezy.com"): Promise<Checkout> {
  vi.stubEnv("VITE_LEMONSQUEEZY_STORE", store);
  vi.resetModules();
  return import("./checkout");
}

const scripts = () => [...document.querySelectorAll<HTMLScriptElement>("script[src*='lemon']")];

/** Answer the pending lemon.js `<script>`: load it (with a fake LS global) or fail it. */
function settleScript(outcome: "load" | "error") {
  const s = scripts().at(-1);
  if (!s) throw new Error("no lemon.js script requested");
  if (outcome === "load") {
    window.LemonSqueezy = { Url: { Open: vi.fn() } };
    s.onload?.(new Event("load"));
  } else {
    s.onerror?.(new Event("error"));
  }
}

const input = { variantId: "123", packSlug: "dessau" };

describe("openCheckout", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.LemonSqueezy = undefined;
  });
  afterEach(() => vi.unstubAllEnvs());

  it("loads lemon.js once and opens the overlay on the pack's variant", async () => {
    const { openCheckout } = await load();
    const opening = openCheckout(input);
    settleScript("load");
    await opening;
    await openCheckout(input);

    expect(scripts()).toHaveLength(1);
    expect(window.LemonSqueezy?.Url.Open).toHaveBeenLastCalledWith(
      "https://gradientwall.lemonsqueezy.com/buy/123?embed=1&checkout[custom][pack_slug]=dessau",
    );
  });

  it("tries the script again after a network failure instead of failing forever", async () => {
    const { openCheckout } = await load();
    const first = openCheckout(input);
    settleScript("error");
    await expect(first).rejects.toThrow(/Lemon Squeezy/);

    const second = openCheckout(input);
    settleScript("load");
    await second;
    expect(window.LemonSqueezy?.Url.Open).toHaveBeenCalledOnce();
    // The failed tag is removed, so retries don't pile up dead scripts.
    expect(scripts()).toHaveLength(1);
  });

  it("refuses to open without a configured store", async () => {
    const { openCheckout, isCheckoutConfigured } = await load("");
    expect(isCheckoutConfigured()).toBe(false);
    await expect(openCheckout(input)).rejects.toThrow(/VITE_LEMONSQUEEZY_STORE/);
    expect(scripts()).toHaveLength(0);
  });
});
