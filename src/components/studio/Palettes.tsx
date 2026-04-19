import { useRef } from "react";
import { useUIStore, applyPalette } from "@/store";
import { PALETTES } from "@/lib/palettes";

export function Palettes() {
  const activePalette = useUIStore((s) => s.activePalette);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PALETTES.map((p, i) => {
        const active = i === activePalette;
        return (
          <div
            key={p.name}
            ref={(el) => {
              refs.current[i] = el;
            }}
            onClick={() => {
              if (p.locked) {
                const el = refs.current[i];
                if (el) {
                  el.animate(
                    [
                      { transform: "translateX(0)" },
                      { transform: "translateX(-6px)" },
                      { transform: "translateX(6px)" },
                      { transform: "translateX(0)" },
                    ],
                    { duration: 320 },
                  );
                }
                return;
              }
              applyPalette(i);
            }}
            className={`relative rounded-[2px] p-2.5 liquid-subtle transition-colors duration-150 ${
              p.locked ? "cursor-not-allowed" : "cursor-pointer hover:bg-white/5"
            } ${active ? "!border-white" : ""}`}
          >
            <div
              className="grid grid-cols-4 h-11 rounded overflow-hidden mb-2"
              style={{ gridTemplateColumns: "repeat(4,1fr)" }}
            >
              {p.colors.map((c, j) => (
                <div key={j} style={{ background: c }} />
              ))}
            </div>
            <div className="flex justify-between items-center font-sans text-[11px] tracking-[0.12em] uppercase text-white/75">
              <span>{p.name}</span>
              {p.locked && <span className="text-[10px] tracking-[0.05em] text-[#ffe14d]">◆ PREMIUM</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
