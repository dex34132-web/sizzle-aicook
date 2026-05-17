import { useEffect } from "react";

interface Options {
  open: boolean;
  setOpen: (v: boolean) => void;
  edgeThreshold?: number; // px from left edge to start an open-swipe
  minDistance?: number; // px to commit a gesture
}

/**
 * Mobile edge-swipe gestures for a left-side hamburger drawer:
 * - Swipe right starting near the LEFT edge of the screen → open.
 * - Swipe left while drawer is OPEN → close.
 */
export function useEdgeSwipeMenu({
  open,
  setOpen,
  edgeThreshold = 28,
  minDistance = 60,
}: Options) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let mode: "open" | "close" | null = null;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      if (!open && startX <= edgeThreshold) {
        tracking = true;
        mode = "open";
      } else if (open) {
        tracking = true;
        mode = "close";
      } else {
        tracking = false;
        mode = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dy > 60) {
        tracking = false;
        return;
      }
      if (mode === "open" && dx > minDistance) {
        setOpen(true);
        tracking = false;
      } else if (mode === "close" && dx < -minDistance) {
        setOpen(false);
        tracking = false;
      }
    };

    const onTouchEnd = () => {
      tracking = false;
      mode = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open, setOpen, edgeThreshold, minDistance]);
}
