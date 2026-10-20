import { afterEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { getPackBySlug } from "@/lib/packs";
import type { Pack } from "@/lib/packs";
import { PackShowcase } from "./PackShowcase";

const dessau = () => getPackBySlug("dessau")!;
const impasto = () => getPackBySlug("impasto")!;

/** The wallpaper on one device in the stage (the thumbnails are outside it), or null when that device is hidden. */
function shownOn(device: "phone" | "laptop"): string | null {
  return (
    screen
      .getByTestId("showcase-stage")
      .querySelector(`[data-device="${device}"] img`)
      ?.getAttribute("src") ?? null
  );
}

function show(pack: Pack) {
  return render(
    <PackShowcase pack={pack} header={<h1>{pack.name}.</h1>} buy={<a href="#buy">Buy</a>} />,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("PackShowcase", () => {
  it("opens on the first piece on a laptop and a phone together", () => {
    show(dessau());
    expect(shownOn("laptop")).toBe("/assets/packs/dessau/01_kreise-desktop.png");
    expect(shownOn("phone")).toBe("/assets/packs/dessau/01_kreise.png");
    expect(screen.getByRole("button", { name: "Both" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("01 / 6")).toBeInTheDocument();
  });

  it("names the design when its file carries a name", () => {
    show(dessau());
    expect(screen.getByText("Kreise")).toBeInTheDocument();
  });

  it("carries the page's title and buy action inside the hero", () => {
    show(dessau());
    const hero = screen.getByRole("region", { name: /dessau wallpapers/i });
    expect(within(hero).getByRole("heading", { name: "Dessau." })).toBeInTheDocument();
    expect(within(hero).getByRole("link", { name: "Buy" })).toBeInTheDocument();
  });

  it("goes to the next and previous piece, wrapping at both ends", () => {
    show(dessau());
    fireEvent.click(screen.getByRole("button", { name: /next wallpaper/i }));
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
    expect(shownOn("phone")).toBe("/assets/packs/dessau/02_rot.png");
    fireEvent.click(screen.getByRole("button", { name: /previous wallpaper/i }));
    fireEvent.click(screen.getByRole("button", { name: /previous wallpaper/i }));
    expect(screen.getByText("06 / 6")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next wallpaper/i }));
    expect(screen.getByText("01 / 6")).toBeInTheDocument();
  });

  it("shuffles to a different piece", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    show(dessau());
    fireEvent.click(screen.getByRole("button", { name: /shuffle/i }));
    expect(screen.queryByText("01 / 6")).toBeNull();
    expect(shownOn("phone")).not.toBe("/assets/packs/dessau/01_kreise.png");
  });

  it("shows one device alone and keeps the piece", () => {
    show(dessau());
    fireEvent.click(screen.getByRole("button", { name: /next wallpaper/i }));
    fireEvent.click(screen.getByRole("button", { name: "Desktop" }));
    expect(shownOn("laptop")).toBe("/assets/packs/dessau/02_rot-desktop.png");
    expect(shownOn("phone")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Phone" }));
    expect(shownOn("phone")).toBe("/assets/packs/dessau/02_rot.png");
    expect(shownOn("laptop")).toBeNull();
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
  });

  it("lists every piece as a thumbnail and marks the current one", () => {
    show(dessau());
    const rail = screen.getByRole("group", { name: /dessau designs/i });
    const thumbs = within(rail).getAllByRole("button");
    expect(thumbs).toHaveLength(6);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
    fireEvent.click(thumbs[3]);
    expect(screen.getByText("04 / 6")).toBeInTheDocument();
    expect(within(rail).getAllByRole("button")[3]).toHaveAttribute("aria-current", "true");
    expect(within(rail).getAllByRole("button")[0]).not.toHaveAttribute("aria-current");
  });

  it("moves with the arrow keys", () => {
    show(dessau());
    const region = screen.getByRole("region", { name: /dessau wallpapers/i });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(screen.getByText("01 / 6")).toBeInTheDocument();
  });

  it("moves with a horizontal swipe and ignores a vertical drag", () => {
    show(dessau());
    const stage = screen.getByTestId("showcase-stage");
    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 180, clientY: 110 }] });
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
    fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 150, clientY: 260 }] });
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
  });

  it("shows a landscape-only pack on both devices as the same file", () => {
    show(impasto());
    expect(shownOn("laptop")).toBe("/assets/packs/acrylic/01.jpg");
    expect(shownOn("phone")).toBe("/assets/packs/acrylic/01.jpg");
  });

  it("shows only the phone, with no switch, when the pack has no desktop render", () => {
    const portraitOnly: Pack = {
      ...dessau(),
      previews: [
        { kind: "image", url: "/a.png", alt: "a", width: 1170, height: 2080 },
        { kind: "image", url: "/b.png", alt: "b", width: 1170, height: 2080 },
      ],
    };
    show(portraitOnly);
    expect(screen.queryByRole("button", { name: "Desktop" })).toBeNull();
    expect(shownOn("laptop")).toBeNull();
    expect(shownOn("phone")).toBe("/a.png");
  });

  it("hides the arrows and shuffle for a single piece but still renders it", () => {
    show({ ...dessau(), previews: [dessau().previews[0]] });
    expect(screen.queryByRole("button", { name: /next wallpaper/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /shuffle/i })).toBeNull();
    expect(shownOn("phone")).toBe("/assets/packs/dessau/01_kreise.png");
  });

  it("loads the wallpapers in the stage eagerly", () => {
    show(dessau());
    for (const img of screen.getByTestId("showcase-stage").querySelectorAll("[data-device] img")) {
      expect(img).toHaveAttribute("loading", "eager");
    }
  });
});
