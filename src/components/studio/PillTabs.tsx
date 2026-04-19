import { useId } from "react";
import { m } from "motion/react";

/**
 * Generic pill-tab group used inside the studio controls (Source, Style).
 * The active-thumb is a shared layoutId element — when `value` changes,
 * Motion animates the pill sliding between options instead of snap-swapping.
 */
interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelFor?: (v: T) => string;
  alignMobile?: "center" | "start";
}

export function PillTabs<T extends string>({
  options,
  value,
  onChange,
  labelFor,
  alignMobile = "center",
}: Props<T>) {
  // Each <PillTabs /> instance needs its own layoutId scope so multiple
  // tab groups on the same page don't animate into each other.
  const layoutId = useId();
  const outerJustify = alignMobile === "center" ? "justify-center md:justify-start" : "justify-start";
  return (
    <div className={`flex ${outerJustify}`}>
      <div className="inline-flex p-1 gap-1 rounded-full liquid-subtle">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`relative rounded-full px-3.5 py-2 text-xs font-sans tracking-[0.08em] uppercase transition-colors duration-150 ${
                active ? "text-[#07070a]" : "text-white/75 hover:text-white"
              }`}
            >
              {active && (
                <m.span
                  layoutId={layoutId}
                  className="absolute inset-0 bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative z-10">{labelFor ? labelFor(opt) : opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
