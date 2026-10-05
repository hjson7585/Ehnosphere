import { useEffect, useRef } from "react";

/** 60 marks around the dial. */
const TICKS = Array.from({ length: 60 }, (_, i) => i);

/** Point on a circle, 0° = 12 o'clock. */
function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a) };
}

/**
 * A dreamy timepiece rather than a strict instrument: frosted glass over the
 * galaxy, an aurora bloom behind it, a dashed orbit ring that drifts around
 * the dial, markers that glow instead of engrave, and hands made of light.
 * Still no numerals — the hours are read by marker alone.
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
      className={`relative aspect-square w-[min(84vmin,32rem)] ${className}`}
    >
      {/* aurora bloom breathing behind the glass */}
      <div className="pointer-events-none absolute -inset-[15%] rounded-full bg-[conic-gradient(from_0deg,rgba(255,196,126,0.24),rgba(126,206,255,0.17)_28%,rgba(255,196,126,0.05)_52%,rgba(150,230,255,0.2)_78%,rgba(255,196,126,0.24))] opacity-70 blur-3xl [animation:ac-spin_54s_linear_infinite]" />

      {/* frosted face — thin enough for the galaxy to read through */}
      <div className="absolute inset-0 rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_24%,rgba(10,16,34,0.2),rgba(4,6,14,0.44))] shadow-[0_0_100px_-24px_rgba(150,205,255,0.3),inset_0_0_60px_rgba(255,255,255,0.05)] backdrop-blur-[5px]" />

      {/* slow mist drifting inside the glass */}
      <div className="pointer-events-none absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(120,190,255,0.16),transparent_62%)] blur-2xl [animation:ac-drift_26s_ease-in-out_infinite]" />

      {/* dial */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ac-orbit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.8" />
            <stop offset="38%" stopColor="#9fd8ff" stopOpacity="0.42" />
            <stop offset="72%" stopColor="#ffe9c9" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#8fe6ff" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* dashed orbit ring, drifting around the dial */}
        <g
          style={{
            transformBox: "view-box",
            transformOrigin: "200px 200px",
            animation: "ac-spin 120s linear infinite",
          }}
        >
          <circle
            cx="200"
            cy="200"
            r="178"
            fill="none"
            stroke="url(#ac-orbit)"
            strokeWidth="1.3"
            strokeDasharray="1 13"
            strokeLinecap="round"
          />
        </g>

        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          stroke="rgba(255,232,200,0.13)"
          strokeWidth="1"
        />

        {/* minute hairlines */}
        <g stroke="rgba(214,232,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
          {TICKS.filter((i) => i % 5 !== 0).map((i) => {
            const deg = i * 6;
            const a = polar(176, deg);
            const b = polar(187, deg);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>

        {/* glowing hour markers instead of engraved batons */}
        <g style={{ filter: "drop-shadow(0 0 7px rgba(255,214,160,0.85))" }}>
          {TICKS.filter((i) => i % 5 === 0).map((i) => {
            const deg = i * 6;
            const p = polar(164, deg);
            const quarter = i % 15 === 0;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={quarter ? 5.2 : 3.4}
                fill={quarter ? "#fff3dd" : "#e9f3ff"}
                opacity={quarter ? 0.95 : 0.78}
              />
            );
          })}
        </g>
      </svg>

      {/* orbiting motes */}
      <div className="pointer-events-none absolute inset-0 [animation:ac-spin_44s_linear_infinite]">
        <span className="absolute top-[4%] left-1/2 size-[1.6%] -translate-x-1/2 rounded-full bg-[#ffe9c9] shadow-[0_0_16px_rgba(255,214,160,0.95)]" />
      </div>
      <div className="pointer-events-none absolute inset-[10%] [animation:ac-spin_70s_linear_infinite_reverse]">
        <span className="absolute top-0 left-1/2 size-[1.2%] -translate-x-1/2 rounded-full bg-[#cbeeff] shadow-[0_0_16px_rgba(150,220,255,0.95)]" />
      </div>

      {/* hour hand — a beam of warm light */}
      <div
        ref={hourRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[23%] w-[7%] -translate-x-1/2 -translate-y-full rounded-full bg-[rgba(255,214,160,0.55)] opacity-60 blur-[12px]" />
        <div className="absolute top-1/2 left-1/2 h-[23%] w-[2.8%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,rgba(255,247,233,0.4),#fff6e6_30%,#e9c893_100%)] shadow-[0_0_22px_rgba(255,226,180,0.7),0_2px_14px_rgba(0,0,0,0.55)]" />
      </div>

      {/* minute hand — cooler, longer light */}
      <div
        ref={minuteRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[32%] w-[5.5%] -translate-x-1/2 -translate-y-full rounded-full bg-[rgba(168,222,255,0.5)] opacity-60 blur-[12px]" />
        <div className="absolute top-1/2 left-1/2 h-[32%] w-[1.8%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,rgba(244,251,255,0.4),#f6fbff_30%,#cfe4f7_100%)] shadow-[0_0_22px_rgba(168,222,255,0.6),0_2px_14px_rgba(0,0,0,0.55)]" />
      </div>

      {/* sweeping seconds — an amber thread with a light at its tip */}
      <div
        ref={secondRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <div className="absolute top-1/2 left-1/2 h-[36%] w-[4%] -translate-x-1/2 -translate-y-full rounded-full bg-[rgba(255,196,126,0.45)] opacity-60 blur-[10px]" />
        <div className="absolute top-1/2 left-1/2 h-[36%] w-[0.6%] -translate-x-1/2 -translate-y-full rounded-full bg-[linear-gradient(180deg,#ffe7c4,#d78f45)] shadow-[0_0_14px_rgba(255,196,126,0.7),0_1px_8px_rgba(0,0,0,0.5)]" />
        <div className="absolute top-1/2 left-1/2 h-[9%] w-[2.8%] -translate-x-1/2 rounded-full bg-[#e0a25e] shadow-[0_0_12px_rgba(255,196,126,0.6)]" />
        <span className="absolute top-[14%] left-1/2 size-[2.6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(255,214,160,0.55)_45%,transparent_72%)]" />
      </div>

      {/* centre bloom */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[11%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.85),rgba(255,226,180,0.4)_42%,transparent_72%)] blur-[2px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[2.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
    </div>
  );
}
