"use client";

import { useEffect } from "react";

/**
 * Works around a WebKit bug in standalone ("Add to Home Screen") PWAs on
 * iOS 17+: the first time the software keyboard opens, the layout viewport
 * shrinks by the status-bar height and never recovers until the app is
 * force-quit. Fixed elements (bottom nav) then float above a black band.
 *
 * The fix: after the keyboard closes, if the viewport is still smaller than
 * the largest height we've seen, force a full reflow of the body so WebKit
 * recomputes the viewport.
 */
export function ViewportHealer() {
  useEffect(() => {
    if (!window.matchMedia("(display-mode: standalone)").matches) return;

    let maxHeight = window.innerHeight;
    let healTimeout: ReturnType<typeof setTimeout> | null = null;

    const onResize = () => {
      maxHeight = Math.max(maxHeight, window.innerHeight);
    };

    const heal = () => {
      if (maxHeight - window.innerHeight <= 4) return;
      const scroller = document.querySelector("[data-app-scroller]");
      const scrollTop = scroller?.scrollTop ?? 0;
      const body = document.body;
      body.style.display = "none";
      void body.offsetHeight; // force synchronous reflow
      body.style.display = "";
      if (scroller) scroller.scrollTop = scrollTop;
    };

    const onFocusOut = (e: FocusEvent) => {
      const target = e.target;
      if (
        !(target instanceof HTMLElement) ||
        !target.matches("input, textarea, select, [contenteditable]")
      ) {
        return;
      }
      if (healTimeout) clearTimeout(healTimeout);
      // Wait for the keyboard-dismiss animation before measuring.
      healTimeout = setTimeout(heal, 250);
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("focusout", onFocusOut);
      if (healTimeout) clearTimeout(healTimeout);
    };
  }, []);

  return null;
}
