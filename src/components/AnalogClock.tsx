import { useEffect, useRef } from "react";

/**
 * The hands alone, floating on the galaxy — no dial, no ring, no glass face,
 * no markers. Each hand is a beam of light with a blurred glow breathing
 * behind it, so the timepiece dissolves into the background instead of
 * sitting on top of it as a separate object.
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
    <div
      data-dreamy
      className={`relative aspect-square w-[min(88vmin,34rem)] ${className}`}
    >
      {/* hour hand — a beam of warm light */}
      <div
        ref={hourRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[26%] w-[7%] -translate-x-1/2 -translate-y-full rounded-full bg-[rgba(255,214,160,0.55)] opacity-60 blur-[12px] [animation:ac-glow_7s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-1/2 left-1/2 h-[26%] w-[2.8%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,rgba(255,247,233,0.4),#fff6e6_30%,#e9c893_100%)] shadow-[0_0_22px_rgba(255,226,180,0.7),0_2px_14px_rgba(0,0,0,0.55)]" />
      </div>

      {/* minute hand — cooler and longer */}
      <div
        ref={minuteRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[36%] w-[5.5%] -translate-x-1/2 -translate-y-full rounded-full bg-[rgba(168,222,255,0.5)] opacity-60 blur-[12px] [animation:ac-glow_7s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-1/2 left-1/2 h-[36%] w-[1.8%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,rgba(244,251,255,0.4),#f6fbff_30%,#cfe4f7_100%)] shadow-[0_0_22px_rgba(168,222,255,0.6),0_2px_14px_rgba(0,0,0,0.55)]" />
      </div>

      {/* sweeping seconds — an amber thread with a light at its tip */}
      <div
        ref={secondRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[40%] w-[4%] -translate-x-1/2 -translate-y-full rounded-full bg-[rgba(255,196,126,0.45)] opacity-60 blur-[10px] [animation:ac-glow_7s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-1/2 left-1/2 h-[40%] w-[0.6%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,#ffe7c4,#d78f45)] shadow-[0_0_14px_rgba(255,196,126,0.7),0_1px_8px_rgba(0,0,0,0.5)]" />
        <div className="absolute top-1/2 left-1/2 h-[9%] w-[2.8%] -translate-x-1/2 rounded-full bg-[#e0a25e] shadow-[0_0_12px_rgba(255,196,126,0.6)]" />
        <span className="absolute top-[10%] left-1/2 size-[2.6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(255,214,160,0.55)_45%,transparent_72%)]" />
      </div>

      {/* pivot */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.7),rgba(255,226,180,0.3)_42%,transparent_72%)] blur-[2px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[2.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
    </div>
  );
}
