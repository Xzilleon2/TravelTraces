import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type TravelTracesToolbarMenu = "map" | "travel" | "mode";

export type TravelTracesToolbarButton = {
  id: TravelTracesToolbarMenu;
  label: string;
  icon: ReactNode;
  panel: ReactNode;
  active?: boolean;
};

type TravelTracesToolbarProps = {
  activeMenu: TravelTracesToolbarMenu | null;
  buttons: TravelTracesToolbarButton[];
  onActiveMenuChange: (menu: TravelTracesToolbarMenu | null) => void;
};

export function TravelTracesToolbar({ activeMenu, buttons, onActiveMenuChange }: TravelTracesToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const activeButton = buttons.find((button) => button.id === activeMenu);

  useEffect(() => {
    if (!activeMenu) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        onActiveMenuChange(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onActiveMenuChange(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenu, onActiveMenuChange]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-2 sm:bottom-6 sm:px-3">
      <div ref={toolbarRef} className="pointer-events-auto relative w-full max-w-[calc(100vw-1rem)] sm:w-auto sm:max-w-none">
        {activeButton ? (
          <div className="absolute bottom-[calc(100%+0.6rem)] left-1/2 max-h-[min(72dvh,34rem)] w-[min(96vw,28rem)] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-[#2D4A2D]/10 bg-white p-3 text-[#1A1A1A] shadow-[0_20px_45px_rgba(27,37,38,0.18)] sm:bottom-[calc(100%+0.85rem)] sm:p-4">
            {activeButton.panel}
          </div>
        ) : null}

        <div className="mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#1A2838]/20 bg-[#ECE7D7]/95 p-1.5 shadow-[0_12px_30px_rgba(27,37,38,0.2)] backdrop-blur sm:gap-2 sm:p-2">
          {buttons.map((button) => {
            const selected = activeMenu === button.id || button.active;
            return (
              <button
                key={button.id}
                type="button"
                aria-expanded={activeMenu === button.id}
                aria-pressed={selected}
                onClick={() => onActiveMenuChange(activeMenu === button.id ? null : button.id)}
                className={`grid h-14 min-w-[4.35rem] place-items-center rounded-2xl px-2 text-center text-[0.58rem] font-bold uppercase tracking-[0.03em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8A9E] focus-visible:ring-offset-2 sm:h-16 sm:min-w-20 sm:px-3 sm:text-[0.66rem] ${
                  selected ? "bg-[#5C8A9E] text-white" : "bg-[#102437] text-white hover:bg-[#17344e]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="grid h-5 w-5 place-items-center [&>svg]:h-5 [&>svg]:w-5 [&>img]:h-5 [&>img]:w-5">
                    {button.icon}
                  </span>
                  <ChevronDown size={13} aria-hidden />
                </span>
                <span className="mt-1 leading-none">{button.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
