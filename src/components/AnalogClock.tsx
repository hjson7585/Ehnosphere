import { useEffect, useRef } from "react";

/**
 * Hands that belong to the sky behind them: frosted bars that let the
 * galaxy show through, lit from within instead of cast in front of it, with
 * a star-like pivot rather than a metal cap. No dial, no ring, no ornament.
 */
export default function AnalogClock({ className = "" }: { className?: string }) {
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hour = hourRef.current;
    const minute = minuteRef.current;
    const second = secondRef.current;
    if (!hour || !minute || !second) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let lastSecond = -1;

    const apply = (date: Date) => {
      const secs = date.getSeconds() + (reduced ? 0 : date.getMilliseconds() / 1000);
      const mins = date.getMinutes() + secs / 60;
      const hours = (date.getHours() % 12) + mins / 60;
      hour.style.transform = `rotate(${hours * 30}deg)`;
      minute.style.transform = `rotate(${mins * 6}deg)`;
      second.style.transform = `rotate(${secs * 6}deg)`;
    };

    const tick = () => {
      const now = new Date();
      if (!reduced || now.getSeconds() !== lastSecond) {
        lastSecond = now.getSeconds();
        apply(now);
      }
      raf = requestAnimationFrame(tick);
    };

    apply(new Date());
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`relative aspect-square w-[min(88vmin,34rem)] ${className}`}>
      {/* hour hand — frosted glass, brightest where it meets the core */}
      <div
        ref={hourRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[25%] w-[1%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,rgba(255,250,242,0.4),rgba(255,244,228,0.24)_55%,rgba(255,252,246,0.48))] shadow-[0_0_16px_rgba(255,240,214,0.16),0_1px_9px_rgba(0,0,0,0.14)] backdrop-blur-[3px]" />
      </div>

      {/* minute hand — the same glass, thinner and longer */}
      <div
        ref={minuteRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[35%] w-[0.64%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,rgba(255,250,242,0.4),rgba(255,244,228,0.24)_55%,rgba(255,252,246,0.48))] shadow-[0_0_16px_rgba(255,240,214,0.16),0_1px_9px_rgba(0,0,0,0.14)] backdrop-blur-[3px]" />
      </div>

      {/* seconds — a warm thread drawn from the galaxy's own amber */}
      <div
        ref={secondRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[38%] w-[max(1.1px,0.24%)] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,rgba(238,170,102,0.56),rgba(214,138,70,0.36))] shadow-[0_0_12px_rgba(238,170,102,0.18)]" />
        <div className="absolute top-1/2 left-1/2 h-[6%] w-[1.2%] -translate-x-1/2 rounded-full bg-[rgba(238,170,102,0.48)] shadow-[0_0_10px_rgba(238,170,102,0.18)]" />
      </div>

      {/* pivot — a small star where the hands rise out of the core */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.5),rgba(255,238,212,0.24)_42%,transparent_72%)] blur-[1px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[0.8%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(255,247,235,0.6)]" />
    </div>
  );
}
