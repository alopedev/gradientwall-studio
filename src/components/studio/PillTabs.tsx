/**
 * Generic pill-tab group used inside the studio controls (Source, Style).
 * Uses `liquid-subtle` glass for the track, solid-white thumb for the active option,
 * and Barlow uppercase tracking for the labels.
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
              className={`rounded-full px-3.5 py-2 text-xs font-sans tracking-[0.08em] uppercase transition-colors duration-150 ${
                active ? "bg-white text-[#07070a]" : "text-white/75 hover:text-white"
              }`}
            >
              {labelFor ? labelFor(opt) : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
