import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SurpriseMeHero } from "./SurpriseMeHero";
import { useConfigStore } from "@/store/useConfigStore";
import { resetStores } from "@/test-utils";

describe("<SurpriseMeHero />", () => {
  beforeEach(resetStores);

  it("renders the Surprise me CTA with a Space kbd indicator", () => {
    render(<SurpriseMeHero />);
    const btn = screen.getByRole("button", { name: /surprise me/i });
    expect(btn).toBeInTheDocument();
    // kbd is hidden below sm: breakpoint via classes — assert by text content.
    expect(btn.textContent).toMatch(/space/i);
  });

  it("clicking the CTA randomizes the gradient (palette/style/seed changes)", () => {
    const before = useConfigStore.getState();
    render(<SurpriseMeHero />);
    fireEvent.click(screen.getByRole("button", { name: /surprise me/i }));
    const after = useConfigStore.getState();
    // randomize changes at least seed + colors; assert a meaningful diff.
    expect(after.seed).not.toBe(before.seed);
    expect(after.colors).not.toEqual(before.colors);
  });

  it("pressing Space triggers randomize globally (no focus needed)", () => {
    const before = useConfigStore.getState().seed;
    render(<SurpriseMeHero />);
    fireEvent.keyDown(window, { code: "Space" });
    expect(useConfigStore.getState().seed).not.toBe(before);
  });

  it("Space inside an input is ignored (does not steal typing)", () => {
    const before = useConfigStore.getState().seed;
    render(
      <>
        <input data-testid="dummy" />
        <SurpriseMeHero />
      </>,
    );
    const input = screen.getByTestId("dummy");
    input.focus();
    fireEvent.keyDown(input, { code: "Space" });
    expect(useConfigStore.getState().seed).toBe(before);
  });
});
