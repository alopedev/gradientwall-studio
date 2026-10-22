// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SectionLink } from "./SectionLink";

type Doc = { startViewTransition?: unknown };

/** A view transition that runs its update at once and finishes straight after. */
function fakeViewTransitions() {
  const start = vi.fn((update: () => Promise<void> | void) => {
    const updateCallbackDone = Promise.resolve().then(update);
    return { updateCallbackDone, finished: updateCallbackDone };
  });
  (document as unknown as Doc).startViewTransition = start;
  return start;
}

function Where() {
  const { pathname, hash } = useLocation();
  return <output data-testid="where">{pathname + hash}</output>;
}

function Studio() {
  return (
    <div id="studio">
      <div data-studio-frame tabIndex={-1}>
        <div data-vt="studio-screen" />
      </div>
    </div>
  );
}

/** Place the section two screens down (jsdom lays nothing out). */
function farBelow(el: HTMLElement) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ top: 1600 } as DOMRect);
}

const scrolls: { id: string; opts: ScrollIntoViewOptions | undefined }[] = [];

beforeEach(() => {
  scrolls.length = 0;
  Element.prototype.scrollIntoView = function (this: Element, opts?: unknown) {
    scrolls.push({ id: this.id, opts: opts as ScrollIntoViewOptions });
  };
});

afterEach(() => {
  delete (document as unknown as Doc).startViewTransition;
});

describe("SectionLink", () => {
  it("keeps a real href, so it still works without JavaScript and opens in a new tab", () => {
    render(
      <MemoryRouter>
        <SectionLink to="studio">Open the Studio</SectionLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link").getAttribute("href")).toBe("/#studio");
  });

  it("moves to the Studio on the same page as a view transition, then focuses it", async () => {
    const start = fakeViewTransitions();
    render(
      <MemoryRouter>
        <SectionLink to="studio">Open the Studio</SectionLink>
        <Studio />
      </MemoryRouter>,
    );
    farBelow(document.getElementById("studio")!);
    fireEvent.click(screen.getByRole("link"));
    expect(start).toHaveBeenCalledOnce();
    await vi.waitFor(() =>
      expect(document.activeElement?.hasAttribute("data-studio-frame")).toBe(true),
    );
    expect(scrolls).toEqual([{ id: "studio", opts: { block: "start", behavior: "instant" } }]);
  });

  it("doesn't replay the transition when the Studio is already on screen", async () => {
    const start = fakeViewTransitions();
    render(
      <MemoryRouter>
        <SectionLink to="studio">Open the Studio</SectionLink>
        <Studio />
      </MemoryRouter>,
    );
    // jsdom lays nothing out: every box sits at the top, as an in-view Studio would.
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
    fireEvent.click(screen.getByRole("link"));
    expect(start).not.toHaveBeenCalled();
    expect(scrolls).toEqual([{ id: "studio", opts: { block: "start", behavior: "smooth" } }]);
    await vi.waitFor(() =>
      expect(document.activeElement?.hasAttribute("data-studio-frame")).toBe(true),
    );
  });

  it("glides to the Studio where view transitions are missing", async () => {
    render(
      <MemoryRouter>
        <SectionLink to="studio">Open the Studio</SectionLink>
        <Studio />
      </MemoryRouter>,
    );
    farBelow(document.getElementById("studio")!);
    fireEvent.click(screen.getByRole("link"));
    expect(scrolls).toEqual([{ id: "studio", opts: { block: "start", behavior: "smooth" } }]);
    await vi.waitFor(() =>
      expect(document.activeElement?.hasAttribute("data-studio-frame")).toBe(true),
    );
  });

  it("glides to the packs instead of jumping", () => {
    const start = fakeViewTransitions();
    render(
      <MemoryRouter>
        <SectionLink to="packs">All packs</SectionLink>
        <section id="packs" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(start).not.toHaveBeenCalled();
    expect(scrolls).toEqual([{ id: "packs", opts: { block: "start", behavior: "smooth" } }]);
  });

  it("opens the home on that section from another page", async () => {
    fakeViewTransitions();
    render(
      <MemoryRouter initialEntries={["/packs/impasto/"]}>
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route
            path="/packs/:slug"
            element={<SectionLink to="studio">Open the Studio</SectionLink>}
          />
        </Routes>
        <Where />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("link"));
    await vi.waitFor(() => expect(screen.getByTestId("where").textContent).toBe("/#studio"));
    await vi.waitFor(() => expect(scrolls.map((s) => s.id)).toContain("studio"));
  });

  it("leaves a modified click (new tab) to the browser", () => {
    const start = fakeViewTransitions();
    render(
      <MemoryRouter>
        <SectionLink to="studio">Open the Studio</SectionLink>
        <Studio />
      </MemoryRouter>,
    );
    const notPrevented = fireEvent.click(screen.getByRole("link"), { metaKey: true });
    expect(notPrevented).toBe(true);
    expect(start).not.toHaveBeenCalled();
  });
});
