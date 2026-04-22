import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Gallery } from "./Gallery";
import { FEATURED_TAGLINES, GALLERY_SEEDS } from "@/lib/palettes";
import * as store from "@/store";

describe("<Gallery />", () => {
  it("renderiza todos los seeds (featured + residual) y la etiqueta 'More from the community'", () => {
    render(<Gallery />);
    // Featured duplican el nombre (mobile block + sidecar desktop) — por eso
    // getAllByText. El grid residual sólo lo emite una vez.
    for (const s of GALLERY_SEEDS) {
      expect(screen.getAllByText(s.name).length).toBeGreaterThanOrEqual(1);
    }
    expect(screen.getByText(/more from the community/i)).toBeInTheDocument();
  });

  it("muestra los taglines editoriales en el sidecar de cada featured", () => {
    render(<Gallery />);
    for (const t of FEATURED_TAGLINES) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
  });

  it("click en el canvas de un featured carga el seed en el studio", async () => {
    const spy = vi.spyOn(store, "loadGallerySeed").mockImplementation(() => {});
    render(<Gallery />);
    const user = userEvent.setup();
    const firstFeatured = GALLERY_SEEDS[0];
    // El 'Open in Studio' link del sidecar es el CTA editorial — único por featured.
    const links = screen.getAllByRole("button", { name: /open in studio/i });
    await user.click(links[0]);
    expect(spy).toHaveBeenCalledWith(firstFeatured);
    spy.mockRestore();
  });
});
