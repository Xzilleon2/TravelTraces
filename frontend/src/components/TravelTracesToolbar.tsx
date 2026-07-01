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
          <div className="absolute bottom-[calc(100%+0.7rem)] left-1/2 max-h-[min(58dvh,28rem)] w-[min(96vw,29rem)] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-[1.55rem] border border-[#3A2A22]/14 bg-[#FBF7F0]/95 p-3 text-[#1A1A1A] shadow-[0_24px_70px_rgba(58,42,34,0.2)] ring-1 ring-white/60 backdrop-blur-xl [scrollbar-gutter:stable] sm:bottom-[calc(100%+0.9rem)] sm:max-h-[min(62dvh,30rem)] sm:p-4">
            {activeButton.panel}
          </div>
        ) : null}

        <div className="mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-[1.45rem] border border-[#3A2A22]/15 bg-[#FBF7F0]/92 p-1.5 shadow-[0_18px_48px_rgba(58,42,34,0.18)] backdrop-blur-xl sm:gap-2 sm:p-2">
          {buttons.map((button) => {
            const selected = activeMenu === button.id || button.active;
            return (
              <button
                key={button.id}
                type="button"
                aria-expanded={activeMenu === button.id}
                aria-pressed={selected}
                onClick={() => onActiveMenuChange(activeMenu === button.id ? null : button.id)}
                className={`group relative grid h-[4.25rem] w-[4.65rem] shrink-0 place-items-center overflow-hidden rounded-[1rem] border px-2 text-center text-[0.58rem] font-bold uppercase tracking-[0.04em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4713A]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] sm:h-[4.65rem] sm:w-[5.2rem] sm:px-3 sm:text-[0.64rem] ${
                  selected
                    ? "border-[#3A2A22] bg-[#3A2A22] text-[#FBF7F0] shadow-[0_10px_26px_rgba(58,42,34,0.24)]"
                    : "border-[#3A2A22]/10 bg-[#EFE7DC] text-[#3A2A22] hover:-translate-y-0.5 hover:border-[#C4713A]/35 hover:bg-[#F5E6D8] hover:text-[#2C211C]"
                }`}
              >
                <span className={`pointer-events-none absolute inset-x-2 top-1 h-px rounded-full ${selected ? "bg-[#FBF7F0]/35" : "bg-white/70"}`} />
                <span className="flex items-center gap-1.5">
                  <span className={`grid h-5 w-5 place-items-center rounded-full transition [&>svg]:h-4 [&>svg]:w-4 [&>img]:h-4 [&>img]:w-4 ${
                    selected ? "bg-[#C4713A] text-[#FBF7F0]" : "bg-[#FBF7F0] text-[#9E6B5C] group-hover:bg-[#C4713A]/12"
                  }`}>
                    {button.icon}
                  </span>
                  <ChevronDown size={13} aria-hidden />
                </span>
                <span className="mt-1 leading-tight">{button.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
