import { useEffect, useRef, type ReactNode } from "react";
import { Bookmark, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  itemPreview?: {
    title: string;
    subtitle?: string;
    image?: string;
  };
  safetyText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  itemPreview,
  safetyText = "This can't be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) cancelButtonRef.current?.focus();
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-[#1A1A1A]/45 px-4 py-6 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
      <div className="w-full max-w-md rounded-2xl border border-[#3A2A22]/12 bg-[#FFF9F0] p-5 text-[#2C211C] shadow-[0_28px_80px_rgba(26,26,26,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#7A2D24]/10 text-[#7A2D24]" aria-hidden="true">
            {icon ?? <Bookmark size={22} strokeWidth={2.15} />}
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#FFF9F0] bg-[#FFF4E8] text-[#7A2D24]">
              <Trash2 size={12} strokeWidth={2.3} />
            </span>
          </span>
          <button type="button" onClick={onCancel} className="grid h-10 w-10 place-items-center rounded-full border border-[#3A2A22]/10 text-[#5B4A40] transition hover:border-[#3A2A22]/20 hover:bg-[#EFE7DC]" aria-label="Cancel and close confirmation">
            <X size={17} />
          </button>
        </div>
        <h2 id="confirm-dialog-title" className="m-0 mt-4 font-[var(--font-display)] text-[1.55rem] font-semibold leading-tight text-[#2C211C]">{title}</h2>
        <p id="confirm-dialog-description" className="m-0 mt-2 text-sm leading-6 text-[#5B4A40]">{description}</p>
        {itemPreview ? (
          <div className="mt-4 flex gap-3 rounded-xl border border-[#3A2A22]/10 bg-[#EFE7DC]/65 p-3">
            {itemPreview.image ? (
              <img src={itemPreview.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-[#FFF9F0] text-[#7A2D24]">
                <Bookmark size={22} />
              </span>
            )}
            <div className="min-w-0">
              <p className="m-0 font-[var(--font-label)] text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[#7A4B32]">Selected item</p>
              <p className="m-0 mt-1 font-[var(--font-display)] text-lg font-semibold leading-snug text-[#2C211C]">&ldquo;{itemPreview.title}&rdquo;</p>
              {itemPreview.subtitle ? <p className="m-0 mt-1 text-xs leading-5 text-[#5B4A40]">{itemPreview.subtitle}</p> : null}
            </div>
          </div>
        ) : null}
        <p className="m-0 mt-4 rounded-xl border border-[#7A2D24]/14 bg-[#FFF4E8] px-3 py-2 text-xs font-semibold leading-5 text-[#5B2A23]">{safetyText}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button ref={cancelButtonRef} type="button" onClick={onCancel} className="min-h-11 rounded-full bg-[#3A2A22] px-5 text-sm font-bold text-[#FFF9F0] shadow-[0_10px_22px_rgba(58,42,34,0.16)] transition hover:bg-[#2C211C] focus:outline-none focus:ring-2 focus:ring-[#C4713A] focus:ring-offset-2 focus:ring-offset-[#FFF9F0]">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="min-h-11 rounded-full border border-[#7A2D24]/35 bg-transparent px-5 text-sm font-bold text-[#7A2D24] transition hover:bg-[#7A2D24]/8 focus:outline-none focus:ring-2 focus:ring-[#7A2D24]/35 focus:ring-offset-2 focus:ring-offset-[#FFF9F0]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
