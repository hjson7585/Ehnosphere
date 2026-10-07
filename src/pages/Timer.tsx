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
  // 큰 숫자 직접 편집 — 포커스하면 숫자가 오른쪽에서 쌓이고 콜론은 고정이다
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("0500");
  const draftBase = useRef("0500");

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

  /** 큰 숫자에 포커스 — 남은 시간을 네 자리(mmss)로 옮겨 적는다. */
  const startEdit = () => {
    if (running) return;
    const total = Math.max(0, Math.ceil(remaining / 1000));
    const mm = String(Math.floor(total / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    const base = `${mm}${ss}`;
    draftBase.current = base;
    setDraft(base);
    setEditing(true);
  };

  /** 확정 — 값이 그대로면 그냥 닫고, 1초 미만이면 취소한다. */
  const commitEdit = () => {
    if (!editing) return; // 편집이 아닐 땐 (실행 중 읽기 전용 포커스 등) 아무 것도 하지 않는다
    const padded = draft.padStart(4, "0");
    const total = Math.min(
      5999, // 99:59 — 큰 숫자는 네 자리라 그 이상은 쓰지 않는다
      Number(padded.slice(0, 2)) * 60 + Number(padded.slice(2)),
    );
    if (total < 1) {
      setEditing(false);
      return;
    }
    if (draft !== draftBase.current) pick(total * 1000);
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  const progress = duration > 0 ? 1 - remaining / duration : 0;

  // 편집 중엔 스케치한 네 자리, 아닐 땐 실제 남은 시간
  const padded = draft.padStart(4, "0");
  const shown = editing
    ? `${padded.slice(0, 2)}:${padded.slice(2)}`
    : format(remaining);

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
            <input
              aria-label="타이머 시간 설정"
              inputMode="numeric"
              readOnly={running}
              value={shown}
              style={{ width: `${shown.length}ch` }}
              onFocus={(e) => {
                startEdit();
                e.target.select();
              }}
              onChange={(e) =>
                setDraft(e.target.value.replace(/[^\d]/g, "").slice(0, 4))
              }
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              className={cn(
                "border-0 bg-transparent p-0 text-center caret-primary outline-none tabular-nums",
                "font-sans font-extralight text-glow text-[clamp(2.25rem,10vmin,4.75rem)] leading-none text-foreground",
                running ? "cursor-default" : "cursor-text",
                done && "animate-pulse text-primary",
              )}
            />
            {/* '측정 중'은 아예 없앴다 — 시간이 흐르는 동안 화면엔 숫자만 남는다 */}
            <span className="flex h-4 items-center justify-center text-xs tracking-[0.3em] text-muted-foreground">
              {running ? "" : done ? "완료" : "정지"}
            </span>
          </div>
        </motion.div>

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
