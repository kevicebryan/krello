import confetti from "canvas-confetti";

/** Celebration burst when a ticket moves into a Done list. */
export function celebrateDone() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const defaults = {
    startVelocity: 35,
    spread: 360,
    ticks: 70,
    zIndex: 2000,
    disableForReducedMotion: true,
  } as const;

  confetti({
    ...defaults,
    particleCount: 80,
    origin: { x: 0.5, y: 0.55 },
  });

  // Side cannons for a bit more punch
  confetti({
    ...defaults,
    particleCount: 40,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
  });
  confetti({
    ...defaults,
    particleCount: 40,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
  });
}
