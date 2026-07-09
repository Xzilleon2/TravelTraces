import { useRef, useState, type PointerEvent } from "react";

type DraggablePhotoFrameProps = {
  src: string;
  alt?: string;
  x?: number;
  y?: number;
  className?: string;
  imageClassName?: string;
  onPositionChange: (position: { x: number; y: number }) => void;
  onEdit?: () => void;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function DraggablePhotoFrame({ src, alt = "", x = 50, y = 50, className, imageClassName, onPositionChange, onEdit }: DraggablePhotoFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const nextX = clampPercent(((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 100);
    const nextY = clampPercent(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 100);
    onPositionChange({ x: Math.round(nextX * 10) / 10, y: Math.round(nextY * 10) / 10 });
  };

  return (
    <div
      ref={frameRef}
      className={className}
      onPointerDown={(event) => {
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        updateFromPointer(event);
      }}
      onPointerUp={(event) => {
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={onEdit}
      style={{ touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
    >
      <img
        src={src}
        alt={alt}
        className={imageClassName}
        draggable={false}
        style={{ objectPosition: `${clampPercent(x)}% ${clampPercent(y)}%`, pointerEvents: "none", userSelect: "none" }}
      />
    </div>
  );
}
