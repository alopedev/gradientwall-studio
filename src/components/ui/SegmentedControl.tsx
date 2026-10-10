import { m } from "motion/react";
import { type ReactNode, useId } from "react";
import { cn } from "./shadcn/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Hide the text below the `@[760px]` container width, keeping only the icon. */
  iconOnlyWhenNarrow?: boolean;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  ariaLabel: string;
  className?: string;
}

/**
 * Pill segmented control. The selected indicator is one shared element that
 * springs between options (motion `layoutId`), so it slides instead of
 * jumping. Buttons use `aria-pressed`, which is what a plain group of
 * toggles needs.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: Props<T>) {
  const id = useId();
  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn(
        "relative m-0 inline-flex min-w-0 rounded-full border-0 bg-white/5 p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]",
        className,
      )}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            aria-label={o.iconOnlyWhenNarrow ? o.label : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative inline-flex min-h-[38px] min-w-11 flex-1 items-center justify-center gap-[7px] rounded-full px-3.5 font-sans text-[0.86rem] font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
              selected ? "text-white" : "text-white/60 hover:text-white",
            )}
          >
            {selected && (
              <m.span
                layoutId={`${id}-indicator`}
                aria-hidden
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_3px_rgba(0,0,0,0.4)]"
              />
            )}
            <span className="relative inline-flex items-center gap-[7px]">
              {o.icon}
              <span className={cn(o.iconOnlyWhenNarrow && "@max-[760px]:hidden")}>{o.label}</span>
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
