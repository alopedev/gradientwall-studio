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
  return screen.getAllByRole("link").find((a) => a.getAttribute("href") === "/packs/dessau/")!;
}

/** jsdom has no view transitions; tests add and remove a fake. */
const doc = document as unknown as Record<string, unknown>;

afterEach(() => {
  delete doc.startViewTransition;
});

describe("PackCard", () => {
  it("offers two ways on: see the pack here, or buy it on Etsy", () => {
    const see = renderCard();
    expect(see).toHaveAccessibleName("See the pack: Dessau");

    const buy = screen.getByRole("link", { name: /^Buy · €5\.99/ });
    expect(buy).toHaveAttribute("href", pack.etsyUrl);
    expect(buy).toHaveAttribute("target", "_blank");
    expect(buy.getAttribute("rel")).toContain("noopener");
    expect(buy).toHaveAttribute("data-etsy-source", "pack-card");
    // An icon from the icon set, never a text arrow.
    expect(buy.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Checkout on Etsy. Instant download.")).toBeInTheDocument();
  });

  it("keeps the two links apart: neither sits inside the other", () => {
    const see = renderCard();
    const buy = screen.getByRole("link", { name: /^Buy/ });
    expect(see.contains(buy)).toBe(false);
    expect(buy.closest("a")).toBe(buy);
    expect(buy.parentElement?.closest("a")).toBeNull();
  });

  it("buying on Etsy does not open the pack page", () => {
    const start = vi.fn();
    doc.startViewTransition = start;
    renderCard();
    window.addEventListener("click", (e) => e.preventDefault(), { once: true });
    fireEvent.click(screen.getByRole("link", { name: /^Buy/ }));
    expect(start).not.toHaveBeenCalled();
    expect(screen.queryByText("pack page")).toBeNull();
  });

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
