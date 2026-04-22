import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Framed } from "./Framed";

describe("<Framed />", () => {
  it("renderiza 4 corner accents (tl/tr/bl/br) + los children", () => {
    const { container, getByText } = render(
      <Framed>
        <p>content</p>
      </Framed>,
    );
    expect(getByText("content")).toBeInTheDocument();
    for (const corner of ["tl", "tr", "bl", "br"]) {
      expect(container.querySelector(`[data-corner="${corner}"]`)).not.toBeNull();
    }
  });

  it("aplica offset y size custom a cada corner accent", () => {
    const { container } = render(
      <Framed offset={20} size={10}>
        <div />
      </Framed>,
    );
    const tl = container.querySelector('[data-corner="tl"]') as HTMLElement;
    expect(tl.style.width).toBe("10px");
    expect(tl.style.height).toBe("10px");
    expect(tl.style.top).toBe("20px");
    expect(tl.style.left).toBe("20px");
  });
});
