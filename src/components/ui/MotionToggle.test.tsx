import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useMotionStore } from "@/store/useMotionStore";
import { MotionToggle } from "./MotionToggle";

describe("MotionToggle", () => {
  beforeEach(() => act(() => useMotionStore.setState({ paused: false })));

  it("pauses the moving wallpaper and plays it again", async () => {
    const user = userEvent.setup();
    render(<MotionToggle />);
    await user.click(screen.getByRole("button", { name: "Pause motion" }));
    expect(useMotionStore.getState().paused).toBe(true);
    await user.click(screen.getByRole("button", { name: "Play motion" }));
    expect(useMotionStore.getState().paused).toBe(false);
  });
});
