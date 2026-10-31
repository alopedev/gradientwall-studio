// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  type FavoriteConfig,
  fromFavorite,
  isSameLook,
  type Look,
  pickLook,
  toFavoriteConfig,
  toRenderParams,
  withSharedLook,
} from "./look";

const look: Look = {
  engine: "v2",
  colors: ["#111111", "#222222", "#333333", "#444444"],
  active: [true, true, true, true],
  style: "liquid",
  blur: 48,
  grain: 45,
  seed: 1234,
  lightAngle: 315,
  density: 0.5,
  contrast: 1,
  vibrance: 1,
  material: "fluted",
};

describe("toRenderParams", () => {
  it("applies the color mask to build the ramp", () => {
    const p = toRenderParams({ ...look, active: [true, false, true, false] });
    expect(p.colors).toEqual(["#111111", "#333333"]);
  });

  it("carries every other field through", () => {
    const { colors: _c, ...rest } = toRenderParams(look);
    const { colors: _l, active: _a, ...expected } = look;
    expect(rest).toEqual(expected);
  });
});

describe("toFavoriteConfig / fromFavorite", () => {
  it("round-trips a look", () => {
    expect(fromFavorite(toFavoriteConfig(look))).toEqual(look);
  });

  it("copies the arrays so later edits don't leak into the favorite", () => {
    const saved = toFavoriteConfig(look);
    expect(saved.colors).not.toBe(look.colors);
    expect(saved.active).not.toBe(look.active);
  });

  it("fills in the fields old favorites don't have and treats a missing engine as v1", () => {
    const legacy: FavoriteConfig = {
      colors: look.colors,
      style: "mesh",
      blur: 40,
      grain: 20,
      seed: 7,
    };
    expect(fromFavorite(legacy)).toEqual({
      engine: "v1",
      colors: look.colors,
      active: [true, true, true, true],
      style: "mesh",
      blur: 40,
      grain: 20,
      seed: 7,
      lightAngle: 135,
      density: 0.5,
      contrast: 1,
      vibrance: 1,
      material: "none",
    });
  });
});

describe("pickLook", () => {
  it("drops everything that isn't part of the look", () => {
    expect(pickLook({ ...look, device: "mobile", setDevice() {} } as Look)).toEqual(look);
  });
});

describe("isSameLook", () => {
  it("is true for a copy and ignores hex case", () => {
    const copy = fromFavorite(toFavoriteConfig(look));
    expect(isSameLook(look, copy)).toBe(true);
    expect(
      isSameLook(look, {
        ...copy,
        colors: look.colors.map((c) => c.toUpperCase()) as Look["colors"],
      }),
    ).toBe(true);
  });

  it.each<[string, Partial<Look>]>([
    ["engine", { engine: "v1" }],
    ["colors", { colors: ["#111111", "#222222", "#333333", "#555555"] }],
    ["active mask", { active: [true, true, false, true] }],
    ["style", { style: "aurora" }],
    ["blur", { blur: 49 }],
    ["grain", { grain: 46 }],
    ["seed", { seed: 1235 }],
    ["lightAngle", { lightAngle: 316 }],
    ["density", { density: 0.6 }],
    ["contrast", { contrast: 1.1 }],
    ["vibrance", { vibrance: 1.1 }],
    ["material", { material: "halftone" }],
  ])("is false when %s differs", (_name, patch) => {
    expect(isSameLook(look, { ...look, ...patch })).toBe(false);
  });
});

describe("withSharedLook", () => {
  const shared = {
    style: "mesh" as const,
    seed: 9,
    colors: ["#010101", "#020202", "#030303", "#040404"] as Look["colors"],
    lightAngle: 90,
    grain: 10,
  };

  it("drops the current material when the link names none", () => {
    expect(withSharedLook(look, shared).material).toBe("none");
  });

  it("takes the link's material", () => {
    expect(withSharedLook(look, { ...shared, material: "dither" }).material).toBe("dither");
  });
});
