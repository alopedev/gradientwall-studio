import { useRef, useState } from "react";
import { useConfigStore, useUIStore } from "@/store";
import { extractColorsFromFile } from "@/lib/color-extract";

/**
 * Third Source tab. Drops image uploads through a k-means extractor to seed
 * the four color slots, then auto-switches to the picker tab so the user can
 * refine the result. Purely a "seed the palette" action — it does not persist
 * the uploaded image; after extraction the file is forgotten.
 */
export function ImageSource() {
  const setColors = useConfigStore((s) => s.setColors);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
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
      setActiveTab("picker");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read image");
    } finally {
      setExtracting(false);
      // Reset the input so re-uploading the same file fires onChange again.
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={extracting}
        className="relative w-full aspect-[4/1] rounded-[2px] border border-dashed border-white/20 flex items-center justify-center gap-2 font-sans text-[12px] tracking-[0.1em] uppercase text-white/60 hover:text-white hover:border-white/40 transition-colors duration-150 disabled:opacity-60 disabled:cursor-wait"
      >
        {extracting ? (
          <>
            <span className="inline-block h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
            Extracting
          </>
        ) : (
          <>↑&nbsp;&nbsp;Choose an image</>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        aria-label="Upload an image to extract its dominant colors"
      />
      {error && (
        <p role="alert" className="font-sans text-[11px] text-red-400">
          {error}
        </p>
      )}
      <p className="font-sans text-[11px] tracking-[0.02em] text-white/40 leading-[1.5]">
        Drops four dominant colors into the picker. Refine each one from there.
      </p>
    </div>
  );
}
