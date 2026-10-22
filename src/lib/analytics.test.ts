// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { isEtsyLink, startAnalytics, track } from "./analytics";

type UmamiWindow = Window & { umami?: { track: (name: string, data?: object) => void } };

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  delete (window as UmamiWindow).umami;
});

describe("startAnalytics", () => {
  it("does nothing without a website id", () => {
    const stop = startAnalytics({ websiteId: "", domain: "gradientwall.app" });
    expect(document.querySelector("script")).toBeNull();
    stop();
  });

  it("loads the Umami Cloud tracker once, counting only the real domain", () => {
    const stop = startAnalytics({ websiteId: "abc-123", domain: "gradientwall.app" });
    startAnalytics({ websiteId: "abc-123", domain: "gradientwall.app" })();
    const scripts = document.querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    const s = scripts[0];
    expect(s.src).toBe("https://cloud.umami.is/script.js");
    expect(s.defer).toBe(true);
    expect(s.dataset.websiteId).toBe("abc-123");
    expect(s.dataset.domains).toBe("gradientwall.app");
    stop();
  });

  it("counts a click on any Etsy link, with the page it came from", () => {
    const spy = vi.fn();
    (window as UmamiWindow).umami = { track: spy };
    const stop = startAnalytics({ websiteId: "abc-123", domain: "gradientwall.app" });
    document.body.innerHTML =
      '<a id="etsy" href="https://www.etsy.com/listing/1/impasto"><span>Get it</span></a><a id="other" href="/privacy/">x</a>';
    document.querySelector<HTMLElement>("#etsy span")?.click();
    document.querySelector<HTMLElement>("#other")?.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("etsy-click", {
      href: "https://www.etsy.com/listing/1/impasto",
      page: window.location.pathname,
    });
    stop();
    document.querySelector<HTMLElement>("#etsy")?.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("track", () => {
  it("is a no-op until the tracker has loaded", () => {
    expect(() => track("download", { device: "phone" })).not.toThrow();
  });

  it("forwards to Umami once it is there", () => {
    const spy = vi.fn();
    (window as UmamiWindow).umami = { track: spy };
    track("email-signup", { source: "footer" });
    expect(spy).toHaveBeenCalledWith("email-signup", { source: "footer" });
  });
});

describe("isEtsyLink", () => {
  it("matches Etsy hosts only", () => {
    expect(isEtsyLink("https://www.etsy.com/listing/1")).toBe(true);
    expect(isEtsyLink("https://gradientwall.etsy.com")).toBe(true);
    expect(isEtsyLink("https://notetsy.com")).toBe(false);
    expect(isEtsyLink("/packs/impasto/")).toBe(false);
  });
});
