import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { getPackBySlug } from "@/lib/packs";
import type { Pack } from "@/lib/packs";
import { PackShowcase } from "./PackShowcase";

const dessau = () => getPackBySlug("dessau")!;
const impasto = () => getPackBySlug("acrylic")!;

/** The wallpaper shown on the device in the stage (the thumbnails are outside it). */
function stageSrc(): string | null {
  return (
    screen
      .getByTestId("showcase-stage")
      .querySelector("img[alt]:not([alt=''])")
      ?.getAttribute("src") ?? null
  );
}

describe("PackShowcase", () => {
  it("opens on the first piece, on a phone, with a counter", () => {
    render(<PackShowcase pack={dessau()} />);
    expect(screen.getByText("01 / 6")).toBeInTheDocument();
    expect(stageSrc()).toBe("/assets/packs/dessau/01_kreise.png");
    expect(screen.getByRole("button", { name: "Phone" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Desktop" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("goes to the next and previous piece, wrapping at both ends", () => {
    render(<PackShowcase pack={dessau()} />);
    fireEvent.click(screen.getByRole("button", { name: /next wallpaper/i }));
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
    expect(stageSrc()).toBe("/assets/packs/dessau/02_rot.png");
    fireEvent.click(screen.getByRole("button", { name: /previous wallpaper/i }));
    fireEvent.click(screen.getByRole("button", { name: /previous wallpaper/i }));
    expect(screen.getByText("06 / 6")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next wallpaper/i }));
    expect(screen.getByText("01 / 6")).toBeInTheDocument();
  });

  it("switches the frame to the composed desktop render and keeps the piece", () => {
    render(<PackShowcase pack={dessau()} />);
    fireEvent.click(screen.getByRole("button", { name: /next wallpaper/i }));
    fireEvent.click(screen.getByRole("button", { name: "Desktop" }));
    expect(stageSrc()).toBe("/assets/packs/dessau/02_rot-desktop.png");
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desktop" })).toHaveAttribute("aria-pressed", "true");
  });

  it("lists every piece as a thumbnail and marks the current one", () => {
    render(<PackShowcase pack={dessau()} />);
    const rail = screen.getByRole("group", { name: /dessau wallpapers/i });
    const thumbs = within(rail).getAllByRole("button");
    expect(thumbs).toHaveLength(6);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
    fireEvent.click(thumbs[3]);
    expect(screen.getByText("04 / 6")).toBeInTheDocument();
    expect(within(rail).getAllByRole("button")[3]).toHaveAttribute("aria-current", "true");
    expect(within(rail).getAllByRole("button")[0]).not.toHaveAttribute("aria-current");
  });

  it("moves with the arrow keys", () => {
    render(<PackShowcase pack={dessau()} />);
    const region = screen.getByRole("region", { name: /dessau wallpapers/i });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(screen.getByText("01 / 6")).toBeInTheDocument();
  });

  it("moves with a horizontal swipe", () => {
    render(<PackShowcase pack={dessau()} />);
    const stage = screen.getByTestId("showcase-stage");
    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 180, clientY: 110 }] });
    expect(screen.getByText("02 / 6")).toBeInTheDocument();
    fireEvent.touchStart(stage, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 230, clientY: 100 }] });
    expect(screen.getByText("01 / 6")).toBeInTheDocument();
  });

  it("ignores a mostly vertical drag, which is the page scrolling", () => {
    render(<PackShowcase pack={dessau()} />);
    const stage = screen.getByTestId("showcase-stage");
    fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 150, clientY: 260 }] });
    expect(screen.getByText("01 / 6")).toBeInTheDocument();
  });

  it("shows a landscape-only pack on the phone as the same file, cropped", () => {
    render(<PackShowcase pack={impasto()} />);
    expect(stageSrc()).toBe("/assets/packs/acrylic/01.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Desktop" }));
    expect(stageSrc()).toBe("/assets/packs/acrylic/01.jpg");
  });

  it("hides the device switch when the pack has no desktop render", () => {
    const portraitOnly: Pack = {
      ...dessau(),
      previews: [
        { kind: "image", url: "/a.png", alt: "a", width: 1170, height: 2080 },
        { kind: "image", url: "/b.png", alt: "b", width: 1170, height: 2080 },
      ],
    };
    render(<PackShowcase pack={portraitOnly} />);
    expect(screen.queryByRole("button", { name: "Desktop" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Phone" })).toBeNull();
  });

  it("hides the arrows and counter jump for a single piece but still renders it", () => {
    const one: Pack = { ...dessau(), previews: [dessau().previews[0]] };
    render(<PackShowcase pack={one} />);
    expect(screen.queryByRole("button", { name: /next wallpaper/i })).toBeNull();
    expect(stageSrc()).toBe("/assets/packs/dessau/01_kreise.png");
  });

  it("loads the wallpaper in the stage eagerly", () => {
    render(<PackShowcase pack={dessau()} />);
    const img = screen.getByTestId("showcase-stage").querySelector("img[alt]:not([alt=''])");
    expect(img).toHaveAttribute("loading", "eager");
  });
});
