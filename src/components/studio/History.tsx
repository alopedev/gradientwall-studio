import { useStudioStore, type HistoryItem } from "@/store/useStudioStore";
import { useGradientCanvas } from "@/lib/useGradientCanvas";

export function History() {
  const history = useStudioStore((s) => s.history);
  const loadHistory = useStudioStore((s) => s.loadHistory);

  return (
    <div className="mt-14">
      <div className="flex justify-between items-baseline mb-4">
        <h3 className="m-0 font-serif font-normal italic text-[22px] text-white">Your history</h3>
        <span className="font-sans text-[11px] tracking-[0.18em] uppercase text-white/40">{history.length} saved</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {history.length === 0 ? (
          <div className="col-span-full rounded-[2px] border border-dashed border-white/14 p-10 text-center font-sans text-[11px] tracking-[0.18em] uppercase text-white/40">
            Nothing here yet — save your first gradient ↑
          </div>
        ) : (
          history.map((h, i) => <HistoryCard key={i} item={h} onClick={() => loadHistory(h)} />)
        )}
      </div>
    </div>
  );
}

function HistoryCard({ item, onClick }: { item: HistoryItem; onClick: () => void }) {
  const ref = useGradientCanvas(
    { w: 270, h: 480, colors: item.colors, style: item.style, blur: item.blur, seed: item.seed },
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
