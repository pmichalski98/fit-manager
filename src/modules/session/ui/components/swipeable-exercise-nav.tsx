"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

interface SwipeableExerciseNavProps {
  children: ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function SwipeableExerciseNav({
  children,
  currentIndex,
  onIndexChange,
}: SwipeableExerciseNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  // Scroll to the target index when it changes externally (dot click, auto-advance)
  useEffect(() => {
    const target = childRefs.current[currentIndex];
    if (!target || !containerRef.current) return;

    isScrollingProgrammatically.current = true;
    target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });

    // Reset flag after scroll settles
    const timer = setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 400);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Observe which child is in view to sync index on user swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = childRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (idx !== -1) onIndexChange(idx);
          }
        }
      },
      { root: container, threshold: 0.6 },
    );

    for (const child of childRefs.current) {
      if (child) observer.observe(child);
    }
    return () => observer.disconnect();
  }, [children.length, onIndexChange]);

  const setChildRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      childRefs.current[index] = el;
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {children.map((child, i) => (
        <div
          key={i}
          ref={setChildRef(i)}
          className="w-full min-w-full snap-start"
        >
          {child}
        </div>
      ))}
    </div>
  );
}
