import { Map, Mountain, Satellite } from "lucide-react";

export type WorkspaceMapLayer = "street" | "satellite" | "terrain";

type MapLayerSelectorProps = {
  activeLayer: WorkspaceMapLayer;
  onLayerChange: (layer: WorkspaceMapLayer) => void;
};

type LayerTile = {
  key: WorkspaceMapLayer;
  label: string;
};

const tiles: LayerTile[] = [
  { key: "street", label: "Street Map" },
  { key: "satellite", label: "Satellite Map" },
  { key: "terrain", label: "Terrain Map" },
];

function TileIcon({ layer }: { layer: LayerTile["key"] }) {
  if (layer === "street") {
    return (
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#eef4f2] text-[#12212E] sm:h-14 sm:w-14">
        <Map size={27} />
      </span>
    );
  }
  if (layer === "satellite") {
    return (
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#eef4f2] text-[#12212E] sm:h-14 sm:w-14">
        <Satellite size={27} />
      </span>
    );
  }
  return (
    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#EFE7DC] text-[#3A2A22] sm:h-14 sm:w-14">
      <Mountain size={27} />
    </span>
  );
}

export function MapLayerSelector({ activeLayer, onLayerChange }: MapLayerSelectorProps) {
  return (
    <div className="absolute bottom-24 left-2 right-2 z-20 max-w-[calc(100%-1rem)] sm:bottom-28 sm:left-4 sm:right-auto sm:max-w-[calc(100%-2rem)] xl:bottom-4">
      <div className="no-scrollbar flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-[#12212E]/10 bg-white p-1.5 shadow-[0_12px_30px_rgba(18,33,46,0.18)] sm:gap-2 sm:p-2">
        {tiles.map((tile) => {
          const selected = activeLayer === tile.key;
          return (
            <button
              key={tile.key}
              type="button"
              title={tile.label}
              onClick={() => onLayerChange(tile.key)}
              className={`group grid min-w-[4.25rem] justify-items-center gap-1 rounded-xl border p-1 text-[0.68rem] font-semibold transition sm:min-w-[68px] sm:text-xs ${
                selected ? "border-[#12212E] bg-[#12212E]/5 text-[#12212E]" : "border-transparent text-[#6B6B5A] hover:border-[#12212E]/15"
              } cursor-pointer`}
              aria-pressed={selected}
            >
              <span className={`rounded-xl border-2 ${selected ? "border-[#12212E]" : "border-transparent group-hover:border-[#6CA3A2]/40"}`}>
                <TileIcon layer={tile.key} />
              </span>
              <span>{tile.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
