import { AppDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Fragment, useEffect, useRef, useState } from "react";
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
  // 시분초 직접 입력 편집 모드 — 콜론은 고정, 숫자 세 칸만 수정한다
  const [editing, setEditing] = useState(false);
  const [segs, setSegs] = useState(["0", "00", "00"]);
  const segRefs = useRef<Array<HTMLInputElement | null>>([]);

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
    setSegs(["0", "00", "00"]);
    setEditing(true);
  };

  /**숫자 칸 하나 — 숫자만 남기고 최대 두 자리까지. */
  const setSeg = (i: number, raw: string) => {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 2);
    setSegs((prev) => prev.map((seg, j) => (j === i ? digits : seg)));
  };

  /** 세 칸 검사 — 잘못된 칸 인덱스, 또는 유효한 밀리초. */
  const readEdit = (): { bad: number } | { ms: number } => {
    const h = Number(segs[0] || 0);
    const m = Number(segs[1] || 0);
    const s = Number(segs[2] || 0);
    if (m > 59) return { bad: 1 };
    if (s > 59) return { bad: 2 };
    const ms = (h * 3600 + m * 60 + s) * 1000;
    if (ms < 1_000) return { bad: 2 };
    return { ms };
  };

  /** 확정 — 값이 맞으면 설정을 갱신하고 닫고, 틀렸으면 false. */
  const commitEdit = () => {
    const r = readEdit();
    if ("bad" in r) return false;
    pick(r.ms);
    setEditing(false);
    return true;
  };

  /** 확정이 안 될 때 문제가 된 칸을 골라 준다. */
  const focusBadSeg = () => {
    const r = readEdit();
    const idx = "bad" in r ? r.bad : 2;
    segRefs.current[idx]?.focus();
    segRefs.current[idx]?.select();
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
                done ? "stroke-destructive" : "stroke-primary/20",
              )}
            />
          </svg>

          <div className="relative flex flex-col items-center gap-2">
            <span
              className={cn(
                "font-sans font-extralight text-glow text-[clamp(2.25rem,10vmin,4.75rem)] leading-none tabular-nums text-foreground",
                done && "animate-pulse text-primary",
              )}
            >
              {format(remaining)}
            </span>
            <span className="text-xs tracking-[0.3em] text-muted-foreground">
              {running ? "측정 중" : done ? "완료" : "정지"}
            </span>
          </div>
        </motion.div>

        {/* 설정 버튼 하나 — 누르면 0:00:00 세 칸으로 바뀝니다. 콜론은 고정, 숫자만 지워서 씁니다 */}
        <div className="flex items-center justify-center">
          {editing ? (
            <div
              className="flex h-8 items-center gap-1 rounded-full border border-border px-4 tabular-nums focus-within:border-primary/70"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  if (!commitEdit()) setEditing(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!commitEdit()) focusBadSeg();
                } else if (e.key === "Escape") {
                  setEditing(false);
                }
              }}
            >
              {(["시", "분", "초"] as const).map((label, i) => (
                <Fragment key={label}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-sm text-muted-foreground"
                    >
                      :
                    </span>
                  )}
                  <input
                    autoFocus={i === 0}
                    ref={(el) => {
                      segRefs.current[i] = el;
                    }}
                    value={segs[i]}
                    inputMode="numeric"
                    maxLength={2}
                    aria-label={label}
                    onChange={(e) => setSeg(i, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-8 bg-transparent text-center text-sm font-medium text-foreground outline-none"
                  />
                </Fragment>
              ))}
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={openEdit}
              className="rounded-full border border-border px-4"
            >
              <span className="tabular-nums">{toHMS(duration)}</span>
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
