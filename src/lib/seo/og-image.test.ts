// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE } from "./pages";

/** Width and height from the first SOF marker of a baseline or progressive JPEG. */
function jpegSize(buf: Buffer): { width: number; height: number } {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error("not a JPEG marker stream");
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error("no SOF marker");
}

describe("default Open Graph image", () => {
  const file = resolve(__dirname, "../../../public", DEFAULT_OG_IMAGE.replace(/^\//, ""));
  const buf = readFileSync(file);

  it("is a JPEG", () => {
    expect(buf.subarray(0, 3).toString("hex")).toBe("ffd8ff");
  });

  it("is 1200x630, the size social cards crop to", () => {
    expect(jpegSize(buf)).toEqual({ width: 1200, height: 630 });
  });

  it("stays light enough for crawlers (under 300 KB)", () => {
    expect(buf.length).toBeLessThan(300 * 1024);
  });
});
