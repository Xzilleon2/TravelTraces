import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";

type HoverType = "none" | "link" | "text" | "card" | "grab";
type ZoomType = "none" | "in" | "out";
type ScrollDirection = "none" | "up" | "down";

type ClickBurst = {
  id: number;
  x: number;
  y: number;
};

export function CustomCursor() {
  const [isTouch, setIsTouch] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [hoverType, setHoverType] = useState<HoverType>("none");
  const [isClicking, setIsClicking] = useState(false);
  const [isDoubleClicking, setIsDoubleClicking] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("none");
  const [zoomType, setZoomType] = useState<ZoomType>("none");
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [clickBursts, setClickBursts] = useState<ClickBurst[]>([]);
  const scrollTimeoutRef = useRef<number | null>(null);
  const zoomTimeoutRef = useRef<number | null>(null);
  const lastScrollTop = useRef(0);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const pointerX = useSpring(mouseX, { stiffness: 950, damping: 40 });
  const pointerY = useSpring(mouseY, { stiffness: 950, damping: 40 });
  const trailX = useSpring(mouseX, { stiffness: 220, damping: 25 });
  const trailY = useSpring(mouseY, { stiffness: 220, damping: 25 });

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const touch = media.matches;
    setIsTouch(touch);
    if (touch) return undefined;
    document.documentElement.classList.add("custom-cursor-active");
    setIsActive(true);

    const setZoomBriefly = (next: Exclude<ZoomType, "none">) => {
      setZoomType(next);
      if (zoomTimeoutRef.current) window.clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = window.setTimeout(() => setZoomType("none"), 420);
    };

    const isGrabTarget = (target: HTMLElement) =>
      Boolean(target.closest(".maplibregl-map, .maplibregl-canvas, [class*='grab'], [style*='grab'], .draggable"));

    const handleMouseMove = (event: MouseEvent) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
      setIsVisible(true);
    };

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (isGrabTarget(target)) {
        setHoverType("grab");
        return;
      }

      const zoomIn = target.closest(".maplibregl-ctrl-zoom-in, .zoom-in, [aria-label*='Zoom in'], [title*='Zoom in']");
      const zoomOut = target.closest(".maplibregl-ctrl-zoom-out, .zoom-out, [aria-label*='Zoom out'], [title*='Zoom out']");
      if (zoomIn) setZoomBriefly("in");
      if (zoomOut) setZoomBriefly("out");

      if (target.closest("input, textarea, [contenteditable='true']")) {
        setHoverType("text");
      } else if (target.closest("article, [data-cursor='card']")) {
        setHoverType("card");
      } else if (target.closest("a, button, [role='button'], select, .cursor-pointer")) {
        setHoverType("link");
      } else {
        setHoverType("none");
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      setIsClicking(true);
      const target = event.target as HTMLElement | null;
      if (target && isGrabTarget(target)) setIsGrabbing(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
      setIsGrabbing(false);
    };

    const handleClick = (event: MouseEvent) => {
      const burst = { id: Date.now() + Math.random(), x: event.clientX, y: event.clientY };
      setClickBursts((current) => [...current, burst]);
      window.setTimeout(() => setClickBursts((current) => current.filter((item) => item.id !== burst.id)), 750);
    };

    const handleDoubleClick = () => {
      setIsDoubleClicking(true);
      window.setTimeout(() => setIsDoubleClicking(false), 600);
    };

    const handleScroll = () => {
      const current = window.pageYOffset || document.documentElement.scrollTop;
      setScrollDirection(current > lastScrollTop.current ? "down" : current < lastScrollTop.current ? "up" : "none");
      lastScrollTop.current = Math.max(0, current);
      setIsScrolling(true);
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
        setScrollDirection("none");
      }, 350);
    };

    const handleWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".maplibregl-map, .maplibregl-canvas")) {
        setZoomBriefly(event.deltaY < 0 ? "in" : "out");
      }
    };

    const handleSelectionChange = () => {
      setIsSelecting(Boolean(window.getSelection()?.toString().trim()));
    };
    const handlePointerLeave = () => setIsVisible(false);
    const handlePointerEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("click", handleClick);
    window.addEventListener("dblclick", handleDoubleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);
    document.addEventListener("mouseenter", handlePointerEnter);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("dblclick", handleDoubleClick);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      document.removeEventListener("mouseleave", handlePointerLeave);
      document.removeEventListener("mouseenter", handlePointerEnter);
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.documentElement.classList.remove("custom-cursor-active");
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      if (zoomTimeoutRef.current) window.clearTimeout(zoomTimeoutRef.current);
    };
  }, [mouseX, mouseY]);

  if (isTouch || !isActive) return null;

  const activeHover = hoverType === "link" || hoverType === "card";
  const trailScale = isClicking ? 0.85 : hoverType === "card" ? 1.6 : hoverType === "link" ? 1.3 : hoverType === "text" ? 0.4 : hoverType === "grab" ? 1.25 : isScrolling ? 1.15 : 1;

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          html.custom-cursor-active,
          html.custom-cursor-active body,
          html.custom-cursor-active #root,
          html.custom-cursor-active *,
          html.custom-cursor-active .maplibregl-canvas,
        }
      `}</style>
      {isVisible ? (
      <div className="pointer-events-none fixed inset-0 z-[999999]">
        <AnimatePresence>
          {clickBursts.map((burst) => (
            <motion.div key={burst.id} initial={{ x: burst.x, y: burst.y, scale: 0.1, opacity: 0.9 }} animate={{ scale: 2.5, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="absolute -left-6 -top-6 h-12 w-12 rounded-full" style={{ border: isDoubleClicking ? "2.5px double #EA9940" : "1.5px solid #EA9940" }} />
          ))}
        </AnimatePresence>
      </div>
      ) : null}

      {isVisible ? (
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[999997]" style={{ x: trailX, y: trailY, translateX: "-50%", translateY: "-50%" }} animate={{ scale: trailScale, opacity: hoverType === "text" ? 0.3 : 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
        <motion.div animate={{ rotate: isDoubleClicking ? [0, 360] : activeHover ? 180 : 0 }} transition={{ duration: isDoubleClicking ? 0.5 : 10, ease: isDoubleClicking ? "easeInOut" : "linear", repeat: isDoubleClicking ? 0 : Infinity }} className="relative grid h-12 w-12 place-items-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
            <circle cx="24" cy="24" r="16" stroke="rgba(108,163,162,0.12)" strokeWidth="1" />
            <circle cx="24" cy="24" r="20" stroke={isSelecting || activeHover ? "#EA9940" : "#307082"} strokeWidth="1.2" strokeDasharray={hoverType === "link" ? "4 4" : "2 4"} />
            <path d="M24 2.5L26 7.5H22L24 2.5Z" fill="#EA9940" />
            <line x1="45.5" y1="24" x2="41.5" y2="24" stroke="#307082" strokeWidth="1.2" />
            <line x1="24" y1="45.5" x2="24" y2="41.5" stroke="#307082" strokeWidth="1.2" />
            <line x1="6.5" y1="24" x2="2.5" y2="24" stroke="#307082" strokeWidth="1.2" />
            {zoomType === "in" ? <path d="M22 24H26M24 22V26" stroke="#EA9940" strokeWidth="1.5" strokeLinecap="round" /> : null}
            {zoomType === "out" ? <path d="M22 24H26" stroke="#EA9940" strokeWidth="1.5" strokeLinecap="round" /> : null}
          </svg>
          {isScrolling && scrollDirection !== "none" ? (
            <div className="absolute grid gap-7">
              <motion.span animate={{ y: scrollDirection === "up" ? [-2, -6, -2] : 0 }} transition={{ repeat: Infinity, duration: 0.6 }} className="mx-auto h-0 w-0 border-x-4 border-b-[6px] border-x-transparent border-b-[#EA9940]" />
              <motion.span animate={{ y: scrollDirection === "down" ? [2, 6, 2] : 0 }} transition={{ repeat: Infinity, duration: 0.6 }} className="mx-auto h-0 w-0 border-x-4 border-t-[6px] border-x-transparent border-t-[#EA9940]" />
            </div>
          ) : null}
        </motion.div>
      </motion.div>
      ) : null}

      {isVisible ? (
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[999998]" style={{ x: pointerX, y: pointerY, translateX: hoverType === "text" ? -4 : -3, translateY: hoverType === "text" ? -10 : -3 }} animate={{ scale: isClicking ? 0.9 : hoverType === "link" ? 1.1 : hoverType === "text" ? 0.85 : 1, rotate: hoverType === "grab" ? (isGrabbing ? -5 : -25) : -12 }} transition={{ type: "spring", stiffness: 550, damping: 32 }}>
        {hoverType === "text" ? (
          <svg width="10" height="20" viewBox="0 0 10 20" fill="none" aria-hidden>
            <path d="M1 2H9M5 2V18M1 18H9" stroke="#12212E" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="5" cy="10" r="2.5" fill="#EA9940" stroke="#ECE7DC" strokeWidth="0.8" />
          </svg>
        ) : hoverType === "grab" ? (
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <path d="M14 2C9.5 2 6 5.5 6 10C6 12.5 7.5 14.5 9 16L14 26L19 16C20.5 14.5 22 12.5 22 10C22 5.5 18.5 2 14 2Z" fill={isGrabbing ? "#12212E" : "#307082"} stroke="#ECE7DC" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="14" cy="10" r={isGrabbing ? 2 : 4} fill={isGrabbing ? "#EA9940" : "#ECE7DC"} stroke="#12212E" strokeWidth="1" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
            <path d="M1 1L9 21.5L12 13L20.5 10L1 1Z" fill="rgba(18,33,46,0.18)" style={{ transform: "translate(1.5px, 2px)" }} />
            <path d="M1 1L12 13L9 21.5L1 1Z" fill="#12212E" stroke="#ECE7DC" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M1 1L20.5 10L12 13L1 1Z" fill={isSelecting ? "#EA9940" : hoverType !== "none" ? "#307082" : "#6CA3A2"} stroke="#ECE7DC" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="2" fill={isSelecting || hoverType !== "none" ? "#EA9940" : "#ECE7DC"} />
          </svg>
        )}
      </motion.div>
      ) : null}
    </>
  );
}
