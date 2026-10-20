import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getPackBySlug } from "@/lib/packs";
import { PackCard } from "./PackCard";

const pack = getPackBySlug("dessau")!;

function renderCard() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<PackCard pack={pack} />} />
        <Route path="/packs/:slug" element={<p>pack page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return screen.getAllByRole("link").find((a) => a.getAttribute("href") === "/packs/dessau")!;
}

/** jsdom has no view transitions; tests add and remove a fake. */
const doc = document as unknown as Record<string, unknown>;

afterEach(() => {
  delete doc.startViewTransition;
});

describe("PackCard", () => {
  it("navigates as a plain link where the browser has no view transitions", () => {
    fireEvent.click(renderCard());
    expect(screen.getByText("pack page")).toBeInTheDocument();
  });

  it("morphs into the pack page through a view transition", async () => {
    const start = vi.fn((update: () => Promise<void>) => {
      const done = Promise.resolve().then(update);
      return { finished: done, updateCallbackDone: done };
    });
    doc.startViewTransition = start;

    fireEvent.click(renderCard());

    expect(start).toHaveBeenCalledOnce();
    expect(await screen.findByText("pack page")).toBeInTheDocument();
  });

  it("leaves cmd-click to the browser (new tab)", () => {
    const start = vi.fn();
    doc.startViewTransition = start;
    // jsdom can't open a tab: stop the browser's default after the card has had its say.
    window.addEventListener("click", (e) => e.preventDefault(), { once: true });
    fireEvent.click(renderCard(), { metaKey: true });
    expect(start).not.toHaveBeenCalled();
  });
});
