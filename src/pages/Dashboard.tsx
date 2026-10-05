import SombreroGalaxy, { BASE_PERIOD } from "@/components/SombreroGalaxy";
import { GalaxyMark } from "@/components/GalaxyMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/use-auth";
import {
  Gauge,
  Layers,
  LogOut,
  Orbit,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const STORAGE_KEY = "sombrero.console.v1";

type ConsoleSettings = { speed: number; glow: number; density: number };

const DEFAULTS: ConsoleSettings = { speed: 1, glow: 1, density: 1 };

function loadSettings(): ConsoleSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ConsoleSettings>;
    return {
      speed: clamp(Number(parsed.speed ?? DEFAULTS.speed), 0, 3),
      glow: clamp(Number(parsed.glow ?? DEFAULTS.glow), 0.3, 2),
      density: clamp(Number(parsed.density ?? DEFAULTS.density), 0.4, 2),
    };
  } catch {
    return DEFAULTS;
  }
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

const DATA_CARDS = [
  {
    icon: Orbit,
    label: "분류",
    value: "Sa ( 돌연변이 )",
    note: "두꺼운 중심부와 명확한 원반",
  },
  {
    icon: Layers,
    label: "까지",
    value: "2,950만 광년",
    note: "Virgo supercluster 외곽",
  },
  {
    icon: Sparkles,
    label: "은하핵",
    value: "약 10억 M☉",
    note: "초대질량 블랙홀 후보",
  },
  {
    icon: Gauge,
    label: "원반 지름",
    value: "12만 광년",
    note: "은하대비의 약 1/3",
  },
];

function ControlRow({
  icon: Icon,
  title,
  hint,
  display,
  value,
  min,
  max,
  step,
  onChange,
}: {
  icon: typeof Orbit;
  title: string;
  hint: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{hint}</p>
          </div>
        </div>
        <span className="font-display shrink-0 text-xl text-primary">{display}</span>
      </div>
      <Slider
        className="mt-4"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? 0)}
        aria-label={title}
      />
    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ConsoleSettings>(() => loadSettings());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable — the backdrop still works for this session */
    }
  }, [settings]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const period =
    settings.speed === 0
      ? "정지"
      : `${(BASE_PERIOD / settings.speed).toFixed(1)}초 / 회`;

  return (
    <div className="relative min-h-screen">
      {/* Live galaxy backdrop — reacts to the sliders below */}
      <SombreroGalaxy
        speed={settings.speed}
        glow={settings.glow}
        density={settings.density}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(4,5,12,0.85),rgba(4,5,12,0.56)_38%,rgba(4,5,12,0.78))]" />

      {/* viewfinder brackets */}
      <div className="pointer-events-none fixed inset-4 z-10 hidden md:block">
        <span className="absolute top-0 left-0 h-8 w-8 border-t border-l border-primary/35" />
        <span className="absolute top-0 right-0 h-8 w-8 border-t border-r border-primary/35" />
        <span className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-primary/35" />
        <span className="absolute right-0 bottom-0 h-8 w-8 border-r border-b border-primary/35" />
      </div>

      <div className="relative z-20 mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 md:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] tracking-[0.36em] text-primary/90 uppercase">
              <span className="h-px w-8 bg-primary/60" />
              Sombrero Background Console
            </p>
            <div className="mt-3 flex items-center gap-3">
              <GalaxyMark className="size-10 shrink-0" />
              <h1 className="font-display text-glow text-4xl font-semibold text-foreground sm:text-5xl">
                관측 콘솔
              </h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {user?.name ? `${user.name}님, ` : ""}
              배경의 은하는 지금 이 순간에도 돌고 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              className="gap-2 border-border/80 bg-background/40 backdrop-blur"
              onClick={() => setSettings({ ...DEFAULTS })}
            >
              <RotateCcw className="size-4" />
              기본값 복원
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSignOut}>
              <LogOut className="size-4" />
              로그아웃
            </Button>
          </div>
        </header>

        <div className="rule-brass h-px" />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ── Controls ─────────────────────────────────────── */}
          <Card className="panel-space rounded-2xl">
            <CardHeader className="pb-1">
              <CardTitle className="font-display flex items-center justify-between text-2xl font-semibold">
                배경 다루기
                <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] tracking-[0.2em] text-primary uppercase">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Live
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              <ControlRow
                icon={RotateCcw}
                title="회전 속도"
                hint="정지하면 은하가 멈추고, 올리면 원반이 빨리 돕니다."
                display={period}
                value={settings.speed}
                min={0}
                max={3}
                step={0.05}
                onChange={(v) => setSettings((s) => ({ ...s, speed: v }))}
              />
              <ControlRow
                icon={Sun}
                title="핵 광휘"
                hint="중심부가 내뿜는 빛의 세기. 1.0 근처가 가장 은은합니다."
                display={`× ${settings.glow.toFixed(2)}`}
                value={settings.glow}
                min={0.3}
                max={2}
                step={0.05}
                onChange={(v) => setSettings((s) => ({ ...s, glow: v }))}
              />
              <ControlRow
                icon={Layers}
                title="성간 물질 밀도"
                hint="원반의 별과 검은 먼지 띠를 얼마나 진하게 그릴지."
                display={`× ${settings.density.toFixed(2)}`}
                value={settings.density}
                min={0.4}
                max={2}
                step={0.05}
                onChange={(v) => setSettings((s) => ({ ...s, density: v }))}
              />
              <p className="pt-4 text-xs text-muted-foreground/80">
                설정은 이 브라우저에 자동으로 저장되어, 다음에 돌아왔을 때 그대로
                적용됩니다.
              </p>
            </CardContent>
          </Card>

          {/* ── Readouts + data ──────────────────────────────── */}
          <div className="flex flex-col gap-6">
            <Card className="panel-space rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-2xl font-semibold">
                  현재 배경 상태
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                {[
                  ["회전 주기", period],
                  ["핵 광휘", `× ${settings.glow.toFixed(2)}`],
                  ["밀도", `× ${settings.density.toFixed(2)}`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border/70 bg-background/40 px-2 py-4"
                  >
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                      {label}
                    </p>
                    <p className="font-display mt-1.5 text-lg text-primary">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {DATA_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.label} className="panel-space rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 text-primary">
                        <Icon className="size-4" />
                        <span className="text-[10px] tracking-[0.24em] uppercase">
                          {card.label}
                        </span>
                      </div>
                      <p className="font-display mt-3 text-2xl font-semibold text-foreground">
                        {card.value}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {card.note}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <p className="pb-4 text-center text-xs text-muted-foreground/70">
          배경 렌더링: 솜브레로 은하(M104) 실시간 합성 · 자료 NASA/ESA Hubble
        </p>
      </div>
    </div>
  );
}
