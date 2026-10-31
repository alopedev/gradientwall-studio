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
  /** Tighter side padding, for five or more options in a narrow panel. */
  dense?: boolean;
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
  dense = false,
}: Props<T>) {
  const id = useId();
  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn(
        "relative m-0 inline-flex min-w-0 rounded-sharp border-0 p-[3px] shadow-[inset_0_0_0_2px_var(--color-ink)]",
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
              "relative inline-flex min-h-[38px] min-w-11 @max-[760px]:min-h-11 items-center justify-center gap-[7px] rounded-[2px] font-sans text-[0.86rem] font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              dense ? "flex-auto px-1.5" : "flex-1 px-3.5",
              selected ? "text-bg" : "text-ink-dim hover:text-ink",
            )}
          >
            {selected && (
              <m.span
                layoutId={`${id}-indicator`}
                aria-hidden
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-[2px] bg-ink"
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
