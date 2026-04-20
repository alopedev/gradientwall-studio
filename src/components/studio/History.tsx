import { useHistoryStore, loadHistoryItem, type HistoryItem } from "@/store";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { activeColors } from "@/lib/palettes";

export function History() {
  const history = useHistoryStore((s) => s.history);

  return (
    <div className="mt-14">
      <div className="flex justify-between items-baseline mb-4">
        <h3 className="m-0 font-sans font-semibold uppercase tracking-[0.02em] text-[18px] text-white">Your history</h3>
        <span className="font-sans text-[11px] tracking-[0.18em] uppercase text-white/40">{history.length} saved</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {history.length === 0 ? (
          <div className="col-span-full rounded-[2px] border border-dashed border-white/14 p-10 text-center font-sans text-[11px] tracking-[0.18em] uppercase text-white/40">
            Nothing here yet — save your first gradient ↑
          </div>
        ) : (
          history.map((h, i) => <HistoryCard key={i} item={h} onClick={() => loadHistoryItem(h)} />)
        )}
      </div>
    </div>
  );
}

function HistoryCard({ item, onClick }: { item: HistoryItem; onClick: () => void }) {
  // History doesn't persist device — thumbnails use a 9:16 aspect.
  // Canvas resolution is driven by the card's CSS box × DPR, capped at 2400 px.
  // `item.active` may be undefined for items saved before the per-slot mask
  // landed — `activeColors` treats that as all four active.
  const ref = useFittedGradientCanvas(
    {
      nativeW: 1440,
      nativeH: 2560,
      colors: activeColors(item.colors, item.active),
      style: item.style,
      blur: item.blur,
      seed: item.seed,
    },
    [item],
  );

  return (
    <button
      onClick={onClick}
      className="aspect-[9/16] rounded-[2px] liquid-subtle overflow-hidden cursor-pointer transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-white/30 p-0"
    >
      <canvas ref={ref} className="block w-full h-full" />
    </button>
  );
}
