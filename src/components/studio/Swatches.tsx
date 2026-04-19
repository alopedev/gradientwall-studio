import { useRef, useState } from "react";
import { useConfigStore } from "@/store";
import { extractColorsFromFile } from "@/lib/color-extract";

export function Swatches() {
  const colors = useConfigStore((s) => s.colors);
  const setColor = useConfigStore((s) => s.setColor);
  const setColors = useConfigStore((s) => s.setColors);
  const fileRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setExtracting(true);
    try {
      const extracted = await extractColorsFromFile(file);
      setColors(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read image");
    } finally {
      setExtracting(false);
      // Reset so re-uploading the same file fires onChange again
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* From-photo action: extract a starting palette, user refines via swatches below */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={extracting}
          className="inline-flex items-center gap-1.5 text-[11px] font-sans tracking-[0.08em] uppercase text-white/60 hover:text-white transition-colors duration-150 disabled:opacity-60 disabled:cursor-wait"
        >
          {extracting ? (
            <>
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
              Extracting
            </>
          ) : (
            <>↑ From photo</>
          )}
        </button>
        {error && <span className="text-[10px] text-red-400 truncate">{error}</span>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        aria-label="Upload an image to extract its dominant colors"
      />

      <div className="grid grid-cols-4 gap-2.5">
        {colors.map((col, i) => (
          <label
            key={i}
            className="relative aspect-square rounded-[2px] border border-white/14 cursor-pointer overflow-hidden transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-white/30"
            style={{ background: col }}
          >
            <input
              type="color"
              value={col}
              onChange={(e) => setColor(i, e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <span
              className="absolute top-1.5 right-2 font-sans text-[10px] text-white/75"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className="absolute bottom-1.5 left-2 right-2 font-sans text-[10px] tracking-[0.05em] text-white/90 pointer-events-none"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
            >
              {col.toUpperCase()}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
