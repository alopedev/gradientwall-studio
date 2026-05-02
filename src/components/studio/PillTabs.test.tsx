import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PillTabs } from "./PillTabs";

describe("<PillTabs />", () => {
  const OPTIONS = ["apple", "banana", "cherry"] as const;

  it("renders every option, with the active button carrying the dark-ink text color + sliding white thumb", () => {
    const { container } = render(<PillTabs options={OPTIONS} value="banana" onChange={() => {}} />);
    const btns = screen.getAllByRole("button");
    expect(btns.map((b) => b.textContent?.trim())).toEqual(["apple", "banana", "cherry"]);
    // Active button gets the dark ink color; inactive keeps the muted white.
    const bananaBtn = btns[1];
    expect(bananaBtn.className).toContain("text-[#07070a]");
    expect(btns[0]!.className).toContain("text-white/70");
    // Exactly one sliding-thumb element exists — under the active option.
    // The thumb is the aria-hidden absolute span injected only when active.
    const thumbs = container.querySelectorAll('button > span[aria-hidden="true"].absolute.inset-0');
    expect(thumbs).toHaveLength(1);
  });

  it("calls onChange with the clicked option value", () => {
    const onChange = vi.fn();
    render(<PillTabs options={OPTIONS} value="apple" onChange={onChange} />);
    fireEvent.click(screen.getByText("cherry"));
    expect(onChange).toHaveBeenCalledWith("cherry");
  });

  it("uses labelFor() to customise displayed text", () => {
    render(
      <PillTabs
        options={OPTIONS}
        value="apple"
        onChange={() => {}}
        labelFor={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
      />,
    );
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });
});
