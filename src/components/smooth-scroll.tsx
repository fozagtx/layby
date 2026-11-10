"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * Smooths mouse-wheel and trackpad scrolling on desktop. Touch scrolling stays native
 * (syncTouch off), so inside Nimiq Pay on a phone nothing changes. Off for reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.12, smoothWheel: true, syncTouch: false }}>
      {children}
    </ReactLenis>
  );
}
