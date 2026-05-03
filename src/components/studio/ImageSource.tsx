import { useRef, useState } from "react";
import { useConfigStore, useUIStore } from "@/store";
import { extractColorsFromFile } from "@/lib/color-extract";

interface ImageSourceProps {
  onComplete?: () => void;
}

/**
 * Image-to-palette helper. Drops uploads through k-means to seed the four
 * color slots; does not persist the file. By default it auto-switches to the
 * picker tab so the user can refine. When `onComplete` is supplied (e.g.
 * inside the "Use my photo" popover), the caller drives what happens next
 * instead of the global tab switch.
 */
export function ImageSource({ onComplete }: ImageSourceProps = {}) {
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
      if (onComplete) onComplete();
      else setActiveTab("picker");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read image");
    } finally {
      setExtracting(false);
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
