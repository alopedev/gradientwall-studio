// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Google Search shows a favicon from the home page's <link rel="icon">: square,
// in a raster format (BMP, GIF, ICO, PNG, JPEG…; SVG is not on its list), and
// preferably larger than 48×48. https://developers.google.com/search/docs/appearance/favicon-in-search

const root = resolve(__dirname, "../../..");
const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");

/** Width and height from a PNG's IHDR chunk. */
function pngSize(buf: Buffer): { width: number; height: number } {
  expect(buf.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("favicon for Google Search", () => {
  it("links a square PNG icon larger than 48px, a multiple of 48", () => {
    const link = indexHtml.match(
      /<link rel="icon" type="image\/png" sizes="(\d+)x(\d+)" href="([^"]+)"/,
    );
    expect(link).not.toBeNull();
    const [, w, h, href] = link as RegExpMatchArray;
    expect(w).toBe(h);
    const declared = Number(w);
    expect(declared).toBeGreaterThan(48);
    expect(declared % 48).toBe(0);

    const size = pngSize(readFileSync(resolve(root, "public", href.replace(/^\//, ""))));
    expect(size).toEqual({ width: declared, height: declared });
  });
});
