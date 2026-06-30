export const buttonBase =
  "flex items-center justify-center gap-2 w-full min-h-12 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.04em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D4A2D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const primaryButton = `${buttonBase} bg-[#C4713A] text-[#F5F0E8] hover:bg-[#A85F31]`;

export const secondaryButton = `${buttonBase} bg-[#2D4A2D] text-[#F5F0E8] hover:bg-[#234023]`;

export const neutralButton = `${buttonBase} border border-[#2D4A2D]/20 bg-[#F5F0E8] text-[#2D4A2D] hover:bg-[#EDEAE0]`;

export const accentButton = `${buttonBase} bg-[#5C8A9E] text-[#F5F0E8] hover:bg-[#4c7688]`;

export const toggleActiveButton = `${buttonBase} bg-[#C4713A] text-[#F5F0E8]`;

export const toggleInactiveButton = `${buttonBase} bg-[#F5F0E8] text-[#2D4A2D] hover:bg-[#EDEAE0]`;

export const toggleActiveDarkButton = `${buttonBase} bg-[#2D4A2D] text-[#F5F0E8]`;

export const iconButton =
  "inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-[#2D4A2D]/20 bg-[#F5F0E8] text-[#2D4A2D] transition hover:bg-[#EDEAE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D4A2D] focus-visible:ring-offset-2";

export const inputField =
  "min-h-11 w-full rounded-lg border border-[#2D4A2D]/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2D4A2D] focus-visible:ring-2 focus-visible:ring-[#2D4A2D]/30";

export const sidebarScroll = "overflow-y-auto overscroll-contain scroll-smooth [scrollbar-gutter:stable]";

export const sectionCard = "rounded border border-[#2D4A2D]/15 bg-[#EDEAE0] p-5";

export const sectionTitle = "m-0 font-[var(--font-display)] text-xl font-semibold text-[#2D4A2D]";

export const fieldLabel = "font-[var(--font-label)] text-sm font-bold uppercase tracking-[0.04em] text-[#2D4A2D]";

export const toggleGrid = "grid grid-cols-1 sm:grid-cols-2 gap-3";
