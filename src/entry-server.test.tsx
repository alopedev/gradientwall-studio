// @vitest-environment node
import { describe, expect, it } from "vitest";
import { LANDINGS, landingPath } from "@/lib/seo/landings";
import { render } from "./entry-server";

// The prerender (vite.config.ts) renders every page with this in Node: no
// window, no document, no localStorage. A component that reads them while
// rendering breaks the build, so this guards it.
describe("entry-server render", () => {
  it("renders the home with its hero, headline and phone photo", async () => {
    const html = await render("/");
    expect(html).toContain("make a gradient wallpaper. free, in 5K.");
    expect(html).toContain('src="/assets/hero/phone.webp"');
    expect(html).toContain('id="studio"');
  });

  it("renders a landing and a pack page, lazy routes included", async () => {
    const landing = await render(landingPath(LANDINGS[0].slug));
    expect(landing).toContain(LANDINGS[0].h1);
    const pack = await render("/packs/impasto/");
    expect(pack).toContain("Impasto");
  });

  it("leaves out what only the visitor's browser knows: today's date", async () => {
    const html = await render("/");
    const today = new Date().toLocaleDateString("en-GB", { weekday: "long" });
    expect(html).not.toContain(today);
  });
});

describe("entry-server starting look", () => {
  it("draws a landing's own look into its HTML, and not into the next page's", async () => {
    const aurora = await render("/aurora-gradient-wallpapers/");
    // The Studio's style picker marks the selected style.
    const pressed = (html: string, label: string) =>
      new RegExp(`aria-pressed="true"[^>]*>(?:(?!</button>).)*>${label}</span></button>`).test(
        html,
      );
    expect(pressed(aurora, "Aurora")).toBe(true);
    expect(pressed(aurora, "Mesh")).toBe(false);
    const { useConfigStore } = await import("./store");
    const home = await render("/");
    expect(useConfigStore.getState().style).toBe("mesh");
    expect(pressed(home, "Mesh")).toBe(true);
  });
});
