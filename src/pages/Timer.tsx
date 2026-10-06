import { AppDock } from "@/components/FloatingDock";
import SombreroGalaxy from "@/components/SombreroGalaxy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Preset countdowns — quick picks under the ring. */
const PRESETS = [
  { label: "1분", ms: 60_000 },
  { label: "3분", ms: 180_000 },
  { label: "5분", ms: 300_000 },
  { label: "10분", ms: 600_000 },
  { label: "25분", ms: 1_500_000 },
];

const RING_R = 168;
const RING_C = 2 * Math.PI * RING_R;

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * The second face of the app: a countdown seated in the same rotating sky as
 * the clock, so the two views read as one instrument.
 */
export default function Timer() {
  const [duration, setDuration] = useState(300_000);
  const [remaining, setRemaining] = useState(300_000);
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState(0);
  const [done, setDone] = useState(false);
  const fired = useRef(false);

  // Drift-free countdown: the deadline is a timestamp, not a decrement.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = endsAt - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setRunning(false);
        if (!fired.current) {
          fired.current = true;
          setDone(true);
          toast("시간이 끝났습니다", {
            description: "예정된 타이머 시간을 채웠습니다.",
          });
        }
        return;
      }
      setRemaining(left);
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [running, endsAt]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      return;
    }
    const from = remaining <= 0 ? duration : remaining;
    if (remaining <= 0) setRemaining(duration);
    fired.current = false;
    setDone(false);
    setEndsAt(Date.now() + from);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    fired.current = false;
    setRemaining(duration);
  };

  const pick = (ms: number) => {
    setRunning(false);
    setDone(false);
    fired.current = false;
    setDuration(ms);
    setRemaining(ms);
  };

  const progress = duration > 0 ? 1 - remaining / duration : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative min-h-screen overflow-hidden bg-background"
    >
      {/* 솜브레로 은하 — 같은 하늘 위에서 돕니다 */}
      <SombreroGalaxy centerX={0.5} centerY={0.5} />

      {/* seat the numerals against the core, without hiding the disk */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(3,4,9,0.5)_0%,rgba(3,4,9,0.22)_38%,rgba(3,4,9,0)_72%)]" />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-7 p-6 pb-28">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="text-xs tracking-[0.45em] text-muted-foreground uppercase"
        >
          Timer
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex aspect-square w-[min(76vmin,24rem)] items-center justify-center"
        >
          <svg
            viewBox="0 0 400 400"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full -rotate-90"
          >
            <circle
              cx="200"
              cy="200"
              r={RING_R}
              fill="none"
              strokeWidth="5"
              className="stroke-white/10"
            />
            <circle
              cx="200"
              cy="200"
              r={RING_R}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
              className={cn(
                "transition-[stroke-dashoffset] duration-300 ease-linear",
                done ? "stroke-destructive" : "stroke-primary",
              )}
            />
          </svg>

          <div className="relative flex flex-col items-center gap-2">
            <span
              className={cn(
                "font-display text-glow text-[clamp(3rem,13vmin,6.5rem)] leading-none tabular-nums text-foreground",
                done && "animate-pulse text-primary",
              )}
            >
              {format(remaining)}
            </span>
            <span className="text-xs tracking-[0.3em] text-muted-foreground">
              {running ? "측정 중" : done ? "완료" : "대기"}
            </span>
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.ms}
              size="sm"
              variant={duration === p.ms ? "default" : "outline"}
              onClick={() => pick(p.ms)}
              className="rounded-full"
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={toggle} className="rounded-full px-8">
            {running ? "일시정지" : done ? "다시 시작" : "시작"}
          </Button>
          <Button variant="outline" onClick={reset} className="rounded-full">
            초기화
          </Button>
        </div>
      </main>

      <AppDock />
    </motion.div>
  );
}
