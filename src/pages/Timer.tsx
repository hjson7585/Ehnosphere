import { AppDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const RING_R = 168;
const RING_C = 2 * Math.PI * RING_R;

/** 큰 숫자의 글꼴 — 분·초 칸과 콜론이 같은 크기로 이어지도록 한 곳에 둔다. */
const BIG_TEXT =
  "font-sans font-extralight text-glow text-[clamp(2.25rem,10vmin,4.75rem)] leading-none tabular-nums";

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
  // 큰 숫자 직접 편집 — 분·초가 각각의 칸이고 콜론만 고정이다
  const [editing, setEditing] = useState(false);
  const [draftM, setDraftM] = useState("05");
  const [draftS, setDraftS] = useState("00");
  const draftBase = useRef({ m: "05", s: "00" });

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

  /** 분/초 칸에 포커스 — 남은 시간을 두 칸에 옮겨 적는다 (이미 편집 중이면 유지). */
  const startEdit = () => {
    if (running || editing) return;
    const total = Math.max(0, Math.ceil(remaining / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    draftBase.current = { m, s };
    setDraftM(m);
    setDraftS(s);
    setEditing(true);
  };

  /** 확정 — 분·초를 합쳐 갱신. 값이 그대로면 그냥 닫고, 1초 미만이면 취소. */
  const commitEdit = () => {
    if (!editing) return; // 편집이 아닐 땐 (실행 중 읽기 전용 포커스 등) 아무 것도 하지 않는다
    const m = Number(draftM.padStart(2, "0"));
    const s = Number(draftS.padStart(2, "0"));
    const total = Math.min(5999, m * 60 + s); // 최대 99:59
    const changed =
      draftM !== draftBase.current.m || draftS !== draftBase.current.s;
    if (total < 1 || !changed) {
      setEditing(false);
      return;
    }
    pick(total * 1000);
    setEditing(false);
  };

  /** 취소 — 스케치를 원래대로 되돌리고 닫는다. 되돌려야 Esc 직후 재진입하는
   *  블러 확정도 같은 값을 다시 읽어 아무 일도 일어나지 않는다. */
  const cancelEdit = () => {
    setDraftM(draftBase.current.m);
    setDraftS(draftBase.current.s);
    setEditing(false);
  };

  const progress = duration > 0 ? 1 - remaining / duration : 0;

  // 편집 중엔 스케치한 두 칸, 아닐 땐 실제 남은 시간
  const [viewM, viewS] = format(remaining).split(":");
  const mmVal = editing ? draftM : viewM;
  const ssVal = editing ? draftS : viewS;

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
            {/* 분·초 두 칸 — 콜론만 고정이고, 각 칸을 따로 타이핑한다 */}
            <div
              className={cn(
                "flex items-center justify-center",
                done && "animate-pulse",
              )}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  commitEdit();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                  (e.target as HTMLElement).blur();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                  (e.target as HTMLElement).blur();
                }
              }}
            >
              <input
                aria-label="분"
                inputMode="numeric"
                maxLength={2}
                readOnly={running}
                value={mmVal}
                style={{ width: "2ch" }}
                onFocus={(e) => {
                  startEdit();
                  e.target.select();
                }}
                onChange={(e) =>
                  setDraftM(e.target.value.replace(/[^\d]/g, "").slice(0, 2))
                }
                className={cn(
                  BIG_TEXT,
                  "border-0 bg-transparent p-0 text-center caret-primary outline-none",
                  running ? "cursor-default" : "cursor-text",
                  done ? "text-primary" : "text-foreground",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  BIG_TEXT,
                  done ? "text-primary" : "text-foreground",
                )}
              >
                :
              </span>
              <input
                aria-label="초"
                inputMode="numeric"
                maxLength={2}
                readOnly={running}
                value={ssVal}
                style={{ width: "2ch" }}
                onFocus={(e) => {
                  startEdit();
                  e.target.select();
                }}
                onChange={(e) =>
                  setDraftS(e.target.value.replace(/[^\d]/g, "").slice(0, 2))
                }
                className={cn(
                  BIG_TEXT,
                  "border-0 bg-transparent p-0 text-center caret-primary outline-none",
                  running ? "cursor-default" : "cursor-text",
                  done ? "text-primary" : "text-foreground",
                )}
              />
            </div>
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
