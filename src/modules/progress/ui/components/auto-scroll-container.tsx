"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function AutoScrollContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  return (
    <div ref={scrollRef} className={className}>
      {children}
    </div>
  );
}
