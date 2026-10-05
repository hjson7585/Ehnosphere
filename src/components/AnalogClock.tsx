import { useEffect, useRef } from "react";

/**
 * Minimal, contemporary hands floating over the galaxy — no dial, no ring,
 * no glow layers, no ornament. Flat batons, one soft shadow each, an amber
 * seconds thread and a single quiet pivot: a timepiece reduced to the marks
 * that actually tell the time.
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
      {/* hour hand */}
      <div
        ref={hourRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[24%] w-[1.7%] -translate-x-1/2 -translate-y-full rounded-full bg-[#f4efe6] shadow-[0_2px_14px_rgba(0,0,0,0.55)]" />
      </div>

      {/* minute hand */}
      <div
        ref={minuteRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[34%] w-[1.1%] -translate-x-1/2 -translate-y-full rounded-full bg-[#f4efe6] shadow-[0_2px_14px_rgba(0,0,0,0.55)]" />
      </div>

      {/* seconds — the single accent */}
      <div
        ref={secondRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[38%] w-[0.45%] -translate-x-1/2 -translate-y-full rounded-full bg-[#e8a25a] shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
        <div className="absolute top-1/2 left-1/2 h-[7%] w-[2%] -translate-x-1/2 rounded-full bg-[#e8a25a]" />
      </div>

      {/* pivot */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[2.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4efe6] shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[0.9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8a25a]" />
    </div>
  );
}
