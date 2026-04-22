import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Gallery } from "./Gallery";
import { GALLERY_SEEDS } from "@/lib/palettes";
import * as store from "@/store";

describe("<Gallery />", () => {
  it("muestra 3 featured y los demás en el grid residual", () => {
    render(<Gallery />);
    // Los 3 primeros seeds aparecen (featured + grid no se solapan: cada nombre
    // aparece en un único sitio porque Gallery hace slice).
    for (const s of GALLERY_SEEDS) {
      expect(screen.getByText(s.name)).toBeInTheDocument();
    }
    // Etiqueta del grid residual presente.
    expect(screen.getByText(/more from the community/i)).toBeInTheDocument();
  });

  it("carga el seed en el studio al hacer click en un featured", async () => {
    const spy = vi.spyOn(store, "loadGallerySeed").mockImplementation(() => {});
    render(<Gallery />);
    const user = userEvent.setup();
    const firstFeatured = GALLERY_SEEDS[0];
    // Click sobre el botón que contiene el nombre del featured.
    await user.click(screen.getByText(firstFeatured.name).closest("button")!);
    expect(spy).toHaveBeenCalledWith(firstFeatured);
    spy.mockRestore();
  });
});
