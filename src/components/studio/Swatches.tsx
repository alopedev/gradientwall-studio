import { useStudioStore } from "@/store/useStudioStore";

export function Swatches() {
  const colors = useStudioStore((s) => s.colors);
  const setColor = useStudioStore((s) => s.setColor);

  return (
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
  );
}
