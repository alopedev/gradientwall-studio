// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLanding } from "@/lib/seo/landings";
import { useConfigStore } from "@/store";
import { LandingPage } from "./LandingPage";

// The Studio and the packs have their own tests; here they only need to be there.
vi.mock("../studio/v2/StudioShell", () => ({ StudioShell: () => <div data-testid="studio" /> }));
vi.mock("../packs/PacksSection", () => ({ PacksSection: () => <div data-testid="packs" /> }));
vi.mock("../studio/engine/ScreenMotion", () => ({ ScreenMotion: () => null }));

const INITIAL = useConfigStore.getState();
const iphone = getLanding("iphone-gradient-wallpapers")!;

function renderLanding(slug: string) {
  const landing = getLanding(slug)!;
  return render(
    <MemoryRouter>
      <LandingPage landing={landing} />
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  beforeEach(() => act(() => useConfigStore.setState(INITIAL, true)));

  it("is the home's hero with the landing's own headline, then the Studio and the packs", () => {
    renderLanding(iphone.slug);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe(iphone.h1);
    expect(h1s[0].nextElementSibling?.textContent).toBe(iphone.subtitle);
    expect(screen.getByRole("img", { name: /current wallpaper on a phone/i })).toBeTruthy();
    expect(screen.getByTestId("studio")).toBeTruthy();
    expect(screen.getByTestId("packs")).toBeTruthy();
  });

  it("draws the steps as a numbered list", () => {
    renderLanding(iphone.slug);
    const steps = screen.getByRole("list", { name: /set it in two steps/i });
    const items = within(steps).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toMatch(/Save Image/);
  });

  it("keeps the screen sizes folded until asked for", () => {
    const { container } = renderLanding(iphone.slug);
    const details = container.querySelector("details");
    expect(details?.open).toBe(false);
    expect(details?.querySelector("summary")?.textContent).toBe("See every screen size");
    expect(details?.textContent).toContain("1320 × 2868");
  });

  it("starts the Studio on the landing's look", () => {
    renderLanding("4k-gradient-wallpapers");
    expect(useConfigStore.getState().device).toBe("desktop");
    renderLanding("aurora-gradient-wallpapers");
    expect(useConfigStore.getState().style).toBe("aurora");
  });

  it("links to the other landings, not to itself", () => {
    renderLanding(iphone.slug);
    const nav = screen.getByRole("navigation", { name: /more gradient wallpapers/i });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/4k-gradient-wallpapers/");
    expect(hrefs).not.toContain("/iphone-gradient-wallpapers/");
  });
});
