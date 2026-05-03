import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColorEditing } from "./useColorEditing";
import { useRecentColorsStore } from "@/store";

describe("useColorEditing", () => {
  beforeEach(() => {
    // Recents store is module-level zustand state — reset it between tests
    // so prior pushes don't leak into the recents array we assert against.
    useRecentColorsStore.setState({ items: [] });
  });

  it("commits a valid hex through onChange and pushes to recents", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useColorEditing("#000000", onChange));

    act(() => result.current.setHex("#aabbcc"));
    expect(onChange).toHaveBeenCalledWith("#AABBCC");
    expect(useRecentColorsStore.getState().items[0]).toBe("#AABBCC");
  });

  it("does not commit while the hex draft is incomplete", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useColorEditing("#000000", onChange));

    act(() => result.current.setHex("#aab"));
    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.hexDraft).toBe("#aab");
  });

  it("HSL slider commits immediately and pushes to recents", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useColorEditing("#FF0000", onChange));

    act(() => result.current.setHslChannel("h", 120));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toMatch(/^#[0-9A-F]{6}$/);
    expect(useRecentColorsStore.getState().items.length).toBe(1);
  });

  it("eco guard — committing the same value via setHex does not call onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useColorEditing("#AABBCC", onChange));
    act(() => result.current.setHex("#AABBCC"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("resyncs hexDraft when value changes externally (e.g. recent pick / undo)", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useColorEditing(value, onChange),
      { initialProps: { value: "#000000" } },
    );
    expect(result.current.hexDraft).toBe("#000000");
    rerender({ value: "#112233" });
    expect(result.current.hexDraft).toBe("#112233");
  });

  it("canEyedrop reflects window.EyeDropper presence at hook time", () => {
    const original = window.EyeDropper;
    delete (window as unknown as Record<string, unknown>).EyeDropper;
    const { result: noEd } = renderHook(() => useColorEditing("#000", vi.fn()));
    expect(noEd.current.canEyedrop).toBe(false);

    class FakeEyeDropper {
      open() {
        return Promise.resolve({ sRGBHex: "#abcdef" });
      }
    }
    (window as unknown as { EyeDropper: typeof FakeEyeDropper }).EyeDropper = FakeEyeDropper;
    const { result: hasEd } = renderHook(() => useColorEditing("#000", vi.fn()));
    expect(hasEd.current.canEyedrop).toBe(true);

    if (original) {
      (window as unknown as { EyeDropper: typeof original }).EyeDropper = original;
    } else {
      delete (window as unknown as Record<string, unknown>).EyeDropper;
    }
  });
});
