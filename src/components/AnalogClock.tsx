import { useEffect, useRef } from "react";

/** 60 marks around the dial. */
const TICKS = Array.from({ length: 60 }, (_, i) => i);

/** Point on a circle, 0° = 12 o'clock. */
function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a) };
}

/**
 * A quiet, serious timepiece: smoked-glass face so the galaxy reads through it,
 * brushed-brass indices, tapered starlight hands and a continuously sweeping
 * seconds needle. No numerals, no labels — the dial is read by marker alone.
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
    <div className={`relative aspect-square w-[min(84vmin,32rem)] ${className}`}>
      {/* warm halo, as if the dial caught the galactic core */}
      <div className="pointer-events-none absolute -inset-[7%] rounded-full bg-[radial-gradient(circle,rgba(255,196,126,0.12),transparent_66%)]" />

      {/* smoked-glass face — thin on purpose, so the galaxy reads straight through it */}
      <div className="absolute inset-0 rounded-full border border-[rgba(255,214,160,0.26)] bg-[radial-gradient(circle_at_32%_26%,rgba(8,12,24,0.18),rgba(3,5,11,0.4))] shadow-[0_50px_140px_-60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.14)] backdrop-blur-[2px]" />

      {/* dial: minute track + brushed indices */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ac-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbeacb" />
            <stop offset="55%" stopColor="#e2b877" />
            <stop offset="100%" stopColor="#b98442" />
          </linearGradient>
        </defs>

        <circle
          cx="200"
          cy="200"
          r="192"
          fill="none"
          stroke="rgba(255,214,160,0.16)"
          strokeWidth="1"
        />

        {TICKS.map((i) => {
          const deg = i * 6;
          if (i % 5 === 0) {
            const a = polar(146, deg);
            const b = polar(172, deg);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="url(#ac-brass)"
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          }
          const a = polar(177, deg);
          const b = polar(187, deg);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(244,236,220,0.24)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* hour hand */}
      <div
        ref={hourRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[22%] w-[2.6%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,#fff7e9_0%,#f0d7a9_60%,#c99d5f_100%)] shadow-[0_0_16px_rgba(255,214,160,0.45),0_1px_10px_rgba(0,0,0,0.6)]" />
      </div>

      {/* minute hand */}
      <div
        ref={minuteRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[32%] w-[1.7%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,#fffaef_0%,#f3ddb6_60%,#d2a765_100%)] shadow-[0_0_18px_rgba(255,222,178,0.45),0_1px_10px_rgba(0,0,0,0.6)]" />
      </div>

      {/* sweeping seconds needle + counterweight */}
      <div
        ref={secondRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[35%] w-[0.5%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,#f0b877,#c07f3c)] shadow-[0_0_12px_rgba(240,176,110,0.5),0_1px_8px_rgba(0,0,0,0.55)]" />
        <div className="absolute top-1/2 left-1/2 h-[9%] w-[2.6%] -translate-x-1/2 rounded-full bg-[#d99a52]" />
      </div>

      {/* centre cap */}
      <div className="absolute top-1/2 left-1/2 size-[3.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4dcb0] shadow-[0_0_14px_rgba(255,214,160,0.85)] ring-[1.5px] ring-[#8a6231]" />
      <div className="absolute top-1/2 left-1/2 size-[1.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a0f1c]" />
    </div>
  );
}
