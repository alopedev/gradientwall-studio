import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { type Device, DEVICE_SIZES } from "@/lib/palettes";
import { useConfigStore } from "@/store";

/**
 * DevicePicker — selector compacto de target device. Vive integrado dentro
 * del botón Download del ActionRow (Studio v2). Click sobre el icono actual
 * abre un Popover con las 3 opciones; selección setea `device` en el store
 * y cierra inmediatamente.
 *
 * Decisión de wrapper: Radix Popover (no DropdownMenu) por consistencia con
 * el resto del Studio v1 — todos los menús flotantes del proyecto usan el
 * mismo wrapper `src/components/ui/shadcn/popover.tsx`. Con sólo 3 opciones
 * estables la diferencia semántica es marginal. Si Fase 5 (polish) decide
 * mover a DropdownMenu por a11y estricta, el cambio es local.
 *
 * Iconos: Lucide React (ya instalada, infrautilizada hoy).
 */

interface DeviceOption {
  device: Device;
  label: string;
  Icon: typeof Monitor;
}

const OPTIONS: readonly DeviceOption[] = [
  { device: "mobile", label: "iPhone", Icon: Smartphone },
  { device: "tablet", label: "iPad", Icon: Tablet },
  { device: "desktop", label: "Desktop", Icon: Monitor },
];

export function DevicePicker() {
  const device = useConfigStore((s) => s.device);
  const setDevice = useConfigStore((s) => s.setDevice);
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((o) => o.device === device) ?? OPTIONS[0];
  const CurrentIcon = current.Icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Change device target (currently ${current.label}, ${DEVICE_SIZES[device].label})`}
          title={`Device: ${current.label} (${DEVICE_SIZES[device].label})`}
          className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/10 bg-white/5 px-2 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-ring"
        >
          <CurrentIcon className="size-3.5" aria-hidden />
          <span>{current.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={6}
        className="glass-modern w-[180px] rounded-[10px] p-1.5"
      >
        <div role="listbox" aria-label="Device target" className="flex flex-col gap-0.5">
          {OPTIONS.map(({ device: d, label, Icon }) => {
            const selected = d === device;
            return (
              <button
                key={d}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setDevice(d);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-[6px] px-2.5 py-2 text-left transition-colors ${
                  selected
                    ? "bg-white/12 text-white"
                    : "text-white/75 hover:bg-white/8 hover:text-white"
                } focus-ring`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="size-3.5" aria-hidden />
                  <span className="font-sans text-[12px] tracking-[0.02em]">{label}</span>
                </span>
                <span className="font-sans text-[10px] tracking-[0.08em] text-white/45">
                  {DEVICE_SIZES[d].label}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
