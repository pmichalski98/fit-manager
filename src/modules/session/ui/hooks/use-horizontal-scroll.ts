import { useCallback, useEffect, useRef, useState } from "react";

/** px tolerance for sub-pixel rounding at scroll edges */
const SCROLL_EDGE_THRESHOLD = 1;
/** Number of cards to advance per arrow click (matches 2-up visible layout) */
const CARDS_PER_SCROLL = 2;

type ScrollState = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  visibleRange: [number, number];
};

const INITIAL_STATE: ScrollState = {
  canScrollLeft: false,
  canScrollRight: false,
  visibleRange: [0, 1],
};

export function useHorizontalScroll(enabled: boolean) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>(INITIAL_STATE);
  const rafRef = useRef(0);

  const updateScrollIndicators = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const totalCards = el.children.length;
    if (totalCards === 0) return;

    // Use DOM-based stride (accounts for gaps correctly)
    const first = el.children[0] as HTMLElement;
    const second = el.children[1] as HTMLElement | undefined;
    const cardStride = second
      ? second.offsetLeft - first.offsetLeft
      : first.offsetWidth;

    if (cardStride === 0) return;

    const firstVisibleIndex = Math.floor(el.scrollLeft / cardStride);
    const lastVisibleIndex = Math.min(
      Math.floor((el.scrollLeft + el.clientWidth - 1) / cardStride),
      totalCards - 1,
    );

    setScrollState({
      canScrollLeft: el.scrollLeft > SCROLL_EDGE_THRESHOLD,
      canScrollRight:
        el.scrollLeft + el.clientWidth < el.scrollWidth - SCROLL_EDGE_THRESHOLD,
      visibleRange: [firstVisibleIndex, lastVisibleIndex],
    });
  }, []);

  const throttledUpdate = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateScrollIndicators);
  }, [updateScrollIndicators]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !enabled) return;

    updateScrollIndicators();
    el.addEventListener("scroll", throttledUpdate, { passive: true });
    const ro = new ResizeObserver(throttledUpdate);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener("scroll", throttledUpdate);
      ro.disconnect();
    };
  }, [enabled, updateScrollIndicators, throttledUpdate]);

  const scrollCards = useCallback((direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el || el.children.length === 0) return;

    const first = el.children[0] as HTMLElement;
    const second = el.children[1] as HTMLElement | undefined;
    const cardStride = second
      ? second.offsetLeft - first.offsetLeft
      : first.offsetWidth;

    const maxIndex = Math.max(0, el.children.length - 1);
    const currentIndex = Math.round(el.scrollLeft / cardStride);
    const targetIndex =
      direction === "left"
        ? Math.max(0, currentIndex - CARDS_PER_SCROLL)
        : Math.min(maxIndex, currentIndex + CARDS_PER_SCROLL);

    el.scrollTo({
      left: targetIndex * cardStride,
      behavior: "smooth",
    });
  }, []);

  return { scrollContainerRef, ...scrollState, scrollCards };
}
