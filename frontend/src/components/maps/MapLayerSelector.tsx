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
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FBF7F0] text-[#3A2A22] shadow-inner shadow-white/70 sm:h-12 sm:w-12">
        <Map size={22} />
      </span>
    );
  }
  if (layer === "satellite") {
    return (
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FBF7F0] text-[#3A2A22] shadow-inner shadow-white/70 sm:h-12 sm:w-12">
        <Satellite size={22} />
      </span>
    );
  }
  return (
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FBF7F0] text-[#3A2A22] shadow-inner shadow-white/70 sm:h-12 sm:w-12">
      <Mountain size={22} />
    </span>
  );
}

export function MapLayerSelector({ activeLayer, onLayerChange }: MapLayerSelectorProps) {
  return (
    <div className="absolute bottom-24 left-2 right-2 z-20 max-w-[calc(100%-1rem)] sm:bottom-28 sm:left-4 sm:right-auto sm:max-w-[calc(100%-2rem)] xl:bottom-4">
      <div className="no-scrollbar flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-[1.35rem] border border-[#3A2A22]/14 bg-[#FBF7F0]/92 p-1.5 shadow-[0_18px_44px_rgba(58,42,34,0.16)] backdrop-blur-xl sm:gap-2 sm:p-2">
        {tiles.map((tile) => {
          const selected = activeLayer === tile.key;
          return (
            <button
              key={tile.key}
              type="button"
              title={tile.label}
              onClick={() => onLayerChange(tile.key)}
              className={`group grid min-w-[4.25rem] justify-items-center gap-1 rounded-[1rem] border p-1.5 text-[0.68rem] font-bold transition duration-200 sm:min-w-[72px] sm:text-xs ${
                selected
                  ? "border-[#3A2A22] bg-[#3A2A22] text-[#FBF7F0] shadow-[0_10px_24px_rgba(58,42,34,0.22)]"
                  : "border-[#3A2A22]/8 bg-[#EFE7DC] text-[#5B4A40] hover:-translate-y-0.5 hover:border-[#C4713A]/35 hover:bg-[#F5E6D8] hover:text-[#3A2A22]"
              } cursor-pointer`}
              aria-pressed={selected}
            >
              <span className={`rounded-[0.9rem] border p-0.5 transition ${selected ? "border-[#C4713A] bg-[#C4713A]" : "border-transparent group-hover:border-[#C4713A]/25"}`}>
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
