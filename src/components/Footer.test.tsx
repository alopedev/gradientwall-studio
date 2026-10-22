// @vitest-environment jsdom
import { render as rtlRender, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AI_DISCLOSURE, ETSY_SHOP_URL } from "@/lib/copy";
import { Footer } from "./Footer";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

/** The links in it navigate, so it renders inside a router, as in the app. */
const render = (ui: ReactElement) => rtlRender(ui, { wrapper: MemoryRouter });

describe("Footer", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("links the privacy page", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe("/privacy/");
  });

  it("groups the links under Make and Help", () => {
    render(<Footer />);
    const make = screen.getByRole("navigation", { name: "Make" });
    const help = screen.getByRole("navigation", { name: "Help" });
    expect(make.textContent).toMatch(/Studio.*Packs.*Etsy shop/);
    expect(help.textContent).toMatch(/Find your download.*Privacy/);
  });

  it("links every landing under a title that says what they are", () => {
    render(<Footer />);
    const col = screen.getByRole("navigation", { name: "Free gradient wallpapers" });
    const links = [...col.querySelectorAll("a")].map((a) => [
      a.textContent,
      a.getAttribute("href"),
    ]);
    expect(links).toEqual([
      ["iPhone wallpapers", "/iphone-gradient-wallpapers/"],
      ["4K desktop wallpapers", "/4k-gradient-wallpapers/"],
      ["Mesh gradients", "/mesh-gradient-wallpapers/"],
      ["Aurora gradients", "/aurora-gradient-wallpapers/"],
      ["Grainy gradients", "/grainy-gradient-wallpapers/"],
    ]);
  });

  it("opens the Etsy shop in a new tab", () => {
    render(<Footer />);
    const etsy = screen.getByRole("link", { name: /Etsy shop/ });
    expect(etsy.getAttribute("href")).toBe(ETSY_SHOP_URL);
    expect(etsy.getAttribute("target")).toBe("_blank");
    expect(etsy.getAttribute("rel")).toContain("noopener");
  });

  it("asks for the email with the next-pack promise when the newsletter is on", () => {
    vi.stubEnv("VITE_NEWSLETTER_ENABLED", "true");
    render(<Footer />);
    const promise = screen.getByText(/the next pack, before anyone else\./);
    expect(promise.querySelector("em, [class*='serif']")).toBeNull();
    expect(screen.getByLabelText("Email address")).toBeTruthy();
  });

  it("keeps the brand line instead of an empty slot when the newsletter is off", () => {
    vi.stubEnv("VITE_NEWSLETTER_ENABLED", "");
    render(<Footer />);
    expect(screen.queryByLabelText("Email address")).toBeNull();
    const line = screen.getByText("colour for the screen you look at most.");
    expect(line.className).toMatch(/display-head/);
  });

  it("says how the pack artwork was made", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(AI_DISCLOSURE.slice(1, 30)))).toBeTruthy();
  });
});
