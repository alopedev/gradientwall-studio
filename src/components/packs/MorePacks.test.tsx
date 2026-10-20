// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getPacks } from "@/lib/packs";
import { MorePacks } from "./MorePacks";

function renderMore(slug: string) {
  return render(
    <MemoryRouter>
      <MorePacks currentSlug={slug} />
    </MemoryRouter>,
  );
}

describe("MorePacks", () => {
  it("ends the pack page with the other packs, never the one being viewed", () => {
    renderMore("impasto");
    const section = screen.getByRole("region", { name: /more packs/i });
    const others = getPacks().filter((p) => p.slug !== "impasto");
    for (const p of others) {
      expect(
        within(section).getAllByRole("link", { name: new RegExp(p.name, "i") }).length,
      ).toBeGreaterThan(0);
    }
    expect(within(section).queryByRole("link", { name: /impasto/i })).toBeNull();
  });

  it("offers the free Studio as the way out", () => {
    renderMore("dessau");
    const section = screen.getByRole("region", { name: /more packs/i });
    const studio = within(section).getByRole("link", { name: /open the studio/i });
    expect(studio.getAttribute("href")).toBe("/#studio");
    expect(within(section).getByText(/free, in your browser, no account/i)).toBeInTheDocument();
  });
});
