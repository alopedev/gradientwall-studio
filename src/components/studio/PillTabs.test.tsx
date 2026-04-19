import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PillTabs } from "./PillTabs";

describe("<PillTabs />", () => {
  const OPTIONS = ["apple", "banana", "cherry"] as const;

  it("renders every option, uppercased, with only the active one styled", () => {
    render(<PillTabs options={OPTIONS} value="banana" onChange={() => {}} />);
    const btns = screen.getAllByRole("button");
    expect(btns.map((b) => b.textContent)).toEqual(["apple", "banana", "cherry"]);
    // active has bg-white / text-[#07070a]
    const banana = screen.getByText("banana");
    expect(banana.className).toContain("bg-white");
    const apple = screen.getByText("apple");
    expect(apple.className).not.toContain("bg-white");
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
