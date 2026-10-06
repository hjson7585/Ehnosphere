import { AppDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const RING_R = 168;
const RING_C = 2 * Math.PI * RING_R;

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 표시용 시:분:초 — 5분은 "0:05:00". */
function toHMS(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 직접 입력한 시:분:초 해석 — "30"은 30분(분 단위 버튼의 계승), "5:30"은
 * 5분 30초, "1:30:00"은 1시간 30분. 맨 뒷자리는 초라 59를 넘을 수 없고,
 * 결과는 1초 ~ 99:59:59 사이. 형식이 맞지 않으면 null.
 */
function parseHMS(raw: string): number | null {
  const parts = raw.trim().split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d{1,3}$/.test(p))) return null;
  const n = parts.map((p) => Number(p));
  let h = 0;
  let m = 0;
  let s = 0;
  if (n.length === 3) {
    [h, m, s] = [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0];
    if (m > 59 || s > 59) return null;
  } else if (n.length === 2) {
    [m, s] = [n[0] ?? 0, n[1] ?? 0];
    if (s > 59) return null;
  } else {
    m = n[0] ?? 0;
  }
  const ms = ((h * 60 + m) * 60 + s) * 1000;
  if (ms < 1_000 || ms > 99 * 3_600_000 + 59 * 60_000 + 59_000) return null;
  return ms;
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
  // 시분초 직접 입력 편집 모드
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

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

  const openEdit = () => {
    setDraft(toHMS(duration));
    setEditing(true);
  };

  /** 입력 확정 — 형식이 맞으면 설정을 갱신하고, 틀렸으면 false. */
  const commitEdit = () => {
    const ms = parseHMS(draft);
    if (ms === null) return false;
    pick(ms);
    setEditing(false);
    return true;
  };

  const progress = duration > 0 ? 1 - remaining / duration : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative min-h-screen overflow-hidden"
    >
      {/* 배경(은하와 그늘)은 SharedSky가 라우트 위에서 한 번만 그립니다 — Clock과 Timer가 같은 하늘을 공유합니다 */}

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
                "font-sans font-extralight text-glow text-[clamp(3rem,13vmin,6.5rem)] leading-none tabular-nums text-foreground",
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

        {/* 설정 버튼 하나 — 누르면 시:분:초를 직접 타이핑하는 입력으로 바뀝니다 */}
        <div className="flex items-center justify-center">
          {editing ? (
            <input
              autoFocus
              type="text"
              maxLength={8}
              value={draft}
              placeholder="0:00:00"
              aria-label="타이머 시간 설정 (시:분:초)"
              onChange={(e) => setDraft(e.target.value.replace(/[^\d:]/g, ""))}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                if (!commitEdit()) setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!commitEdit()) e.currentTarget.select();
                } else if (e.key === "Escape") {
                  setEditing(false);
                }
              }}
              className="h-8 w-32 rounded-full border border-border bg-transparent px-4 text-center text-sm font-medium tabular-nums text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/70"
            />
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={openEdit}
              className="rounded-full border border-border px-4"
            >
              <span className="tabular-nums">{toHMS(duration)}</span>
              <span className="text-muted-foreground">· 시분초 입력</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={toggle}
            className="rounded-full border border-border px-8"
          >
            {running ? "일시정지" : done ? "다시 시작" : "시작"}
          </Button>
          <Button
            variant="ghost"
            onClick={reset}
            className="rounded-full border border-border px-8"
          >
            초기화
          </Button>
        </div>
      </main>

      <AppDock />
    </motion.div>
  );
}
