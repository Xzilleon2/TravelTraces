import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { X } from "lucide-react";

type ImageCropDialogProps = {
  open: boolean;
  src: string;
  title?: string;
  aspect?: number;
  onCancel: () => void;
  onSave: (result: { dataUrl: string; x: number; y: number; zoom: number }) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cropImage(src: string, aspect: number, x: number, y: number, zoom: number) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const naturalAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      const baseCropWidth = naturalAspect > aspect ? image.naturalHeight * aspect : image.naturalWidth;
      const baseCropHeight = naturalAspect > aspect ? image.naturalHeight : image.naturalWidth / aspect;
      const cropWidth = baseCropWidth / zoom;
      const cropHeight = baseCropHeight / zoom;
      const centerX = (image.naturalWidth * x) / 100;
      const centerY = (image.naturalHeight * y) / 100;
      const sx = clamp(centerX - cropWidth / 2, 0, image.naturalWidth - cropWidth);
      const sy = clamp(centerY - cropHeight / 2, 0, image.naturalHeight - cropHeight);
      const outputWidth = 900;
      const outputHeight = Math.round(outputWidth / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Image crop could not be created."));
        return;
      }
      context.drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
      resolve(canvas.toDataURL("image/jpeg", 0.76));
    };
    image.onerror = () => reject(new Error("Image could not be loaded for cropping."));
    image.src = src;
  });
}

export function ImageCropDialog({ open, src, title = "Adjust photo", aspect = 1, onCancel, onSave }: ImageCropDialogProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1.15);
  const [dragging, setDragging] = useState(false);
  const frameStyle = useMemo(() => ({ aspectRatio: `${aspect}`, maxHeight: "58vh" }), [aspect]);

  useEffect(() => {
    if (!open) return;
    setPosition({ x: 50, y: 50 });
    setZoom(1.15);
    setDragging(false);
  }, [open, src]);

  if (!open) return null;

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setPosition({
      x: Math.round(clamp(((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 100, 0, 100) * 10) / 10,
      y: Math.round(clamp(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 100, 0, 100) * 10) / 10,
    });
  };

  const saveCrop = async () => {
    const dataUrl = await cropImage(src, aspect, position.x, position.y, zoom);
    onSave({ dataUrl, x: position.x, y: position.y, zoom });
  };

  return (
    <div className="fixed inset-0 z-[1300] grid place-items-center bg-[#1A1A1A]/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="image-crop-title">
      <section className="w-full max-w-2xl rounded-xl border border-[#3A2A22]/15 bg-[#FBF7F0] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="m-0 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9E4F27]">Photo crop</p>
            <h2 id="image-crop-title" className="m-0 mt-1 font-[var(--font-display)] text-3xl font-semibold text-[#3A2A22]">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} className="grid h-10 w-10 place-items-center rounded-full bg-[#3A2A22]/10 text-[#3A2A22]" aria-label="Close crop editor">
            <X size={18} />
          </button>
        </div>
        <div
          ref={frameRef}
          className="mx-auto w-full overflow-hidden rounded-lg border border-[#3A2A22]/15 bg-[#EFE7DC]"
          style={{ ...frameStyle, cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
          onPointerDown={(event) => {
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            updateFromPointer(event);
          }}
          onPointerMove={(event) => dragging && updateFromPointer(event)}
          onPointerUp={(event) => {
            setDragging(false);
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => setDragging(false)}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="h-full w-full object-cover select-none"
            style={{ objectPosition: `${position.x}% ${position.y}%`, transform: `scale(${zoom})`, transformOrigin: `${position.x}% ${position.y}%`, pointerEvents: "none" }}
          />
        </div>
        <label className="mt-4 grid gap-2">
          <span className="font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5E4B40]">Zoom</span>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </label>
        <p className="m-0 mt-3 text-sm leading-6 text-[#5B4A40]">Drag the photo to choose the visible area. The saved image uses exactly this crop.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-full border border-[#3A2A22]/15 px-5 text-sm font-bold text-[#3A2A22]">Cancel</button>
          <button type="button" onClick={() => void saveCrop()} className="min-h-11 rounded-full bg-[#3A2A22] px-5 text-sm font-bold text-[#FFF9F0]">Save Crop</button>
        </div>
      </section>
    </div>
  );
}
