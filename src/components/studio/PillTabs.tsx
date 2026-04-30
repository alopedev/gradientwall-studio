import { useId } from "react";
import { m } from "motion/react";

/**
 * Generic pill-tab group used inside the studio controls (Source, Style).
 * The active-thumb is a shared layoutId element — when `value` changes,
 * Motion animates the pill sliding between options instead of snap-swapping.
 *
 * Layout note: the pillbar takes full container width and each pill claims
 * an equal share via `flex-1 min-w-0` + `whitespace-nowrap`. This avoids the
 * overflow / multi-line label issues that show up when the pillbar lives in
 * a narrow rail (~ 380px). If the labels would still overflow at extreme
 * narrowness, the buttons truncate via `text-ellipsis` rather than wrap.
 */
interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelFor?: (v: T) => string;
}

export function PillTabs<T extends string>({ options, value, onChange, labelFor }: Props<T>) {
  // Each <PillTabs /> instance needs its own layoutId scope so multiple
  // tab groups on the same page don't animate into each other.
  const layoutId = useId();
  return (
    <div className="flex p-1 gap-1 rounded-full liquid-subtle w-full">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`relative flex-1 min-w-0 rounded-full px-2.5 py-1.5 text-[10px] font-sans tracking-[0.06em] uppercase transition-colors duration-150 ${
              active ? "text-[#07070a]" : "text-white/70 hover:text-white"
            }`}
          >
            {active && (
              <m.span
                layoutId={layoutId}
                className="absolute inset-0 bg-white rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative z-10 block whitespace-nowrap text-center">
              {labelFor ? labelFor(opt) : opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}
