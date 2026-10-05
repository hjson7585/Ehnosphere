import { motion } from "framer-motion";
import SombreroGalaxy from "@/components/SombreroGalaxy";
import { GalaxyMark as Mark } from "@/components/GalaxyMark";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronDown,
  Contrast,
  Orbit,
  Sparkles,
  Telescope,
} from "lucide-react";
import { useNavigate } from "react-router";

const SIGN_IN = "/auth?returnTo=%2Fdashboard";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const FACTS = [
  { label: "까지", value: "2,950만", unit: "광년", note: "Virgo supercluster 외곽" },
  { label: "지름", value: "12만", unit: "광년", note: "은하대비 마치 모자처럼" },
  { label: "은하핵", value: "약 10억", unit: "태양질량", note: "초대질량 블랙홀" },
  { label: "별", value: "약 8,000억", unit: "개", note: "Sa형 돌연변이 은하" },
];

const LIGHT = [
  {
    icon: Orbit,
    title: "천천히 도는 회전",
    body: "108초에 한 바퀴. 실제 은하의 회전은 천천이지만, 화면에 앉아 있는 동안 눈이 따라가지 못할 만큼 느린 속도로 원반이 돕니다.",
  },
  {
    icon: Sparkles,
    title: "호흡하는 핵의 광휘",
    body: "중심부의 밝기가 15초 주기로 미세하게 오갑니다. 반짝반짝 튀는 효과가 아니라, 등불이 흔들리듯 은은하게.",
  },
  {
    icon: Contrast,
    title: "검은 먼지 띠",
    body: "밝은 원반 앞을 가로지르는 검은 띠는 솜브레로 은하의 상징입니다. 허블 사진의 먼지 띠 위치를 따라 앞면과 뒷면에 나누어 그렸습니다.",
  },
];

const RECORDS = [
  {
    year: "1781",
    title: "피에르 메셰인의 발견",
    body: "프랑스 천문학자 피에르 메셰인이 이 은하를 처음 기록했습니다. 지름이 큰 탓에 망원경 밖으로 삐져나와 ‘솜브레로’라는 별명이 붙었습니다.",
  },
  {
    year: "1994",
    title: "허블이 담은 먼지 띠",
    body: "허블우주망원경이 중심의 타원형 구조와 검은 먼지 띠를 처음으로 선명하게 촬영했고, 핵에서 별이 빽빽하게 몰려 있음이 밝혀졌습니다.",
  },
  {
    year: "NOW",
    title: "은은하게, 계속 회전 중",
    body: "이 페이지의 배경은 지금도 돌고 있습니다. 관측 콘솔에서 회전속도·광휘·밀도를 바꾸면 화면 전체가 즉시 반응합니다.",
  },
];

const CONSOLE_ROWS = [
  { label: "회전 속도", min: "정지", mid: "1.0×", max: "3.0×", value: 34 },
  { label: "핵 광휘", min: "0.3×", mid: "1.0×", max: "2.0×", value: 52 },
  { label: "성간 물질 밀도", min: "0.4×", mid: "1.0×", max: "2.0×", value: 50 },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen"
    >
      {/* 솜브레로 은하 배경 — 은은하게 빛나며 천천히 회전 */}
      <SombreroGalaxy parallax centerX={0.62} centerY={0.52} />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(4,5,12,0.86),rgba(4,5,12,0.46)_40%,rgba(4,5,12,0.44)_70%,rgba(4,5,12,0.92))]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(105deg,rgba(4,5,12,0.72)_0%,rgba(4,5,12,0.3)_45%,transparent_72%)]" />

      <div className="relative z-10">
        {/* ── Nav ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/55 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
            <a href="#top" className="flex items-center gap-2.5">
              <Mark className="size-7" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-semibold tracking-wide text-foreground">
                  솜브레로 은하
                </span>
                <span className="text-[10px] uppercase tracking-[0.32em] text-primary/80">
                  M104 Observatory
                </span>
              </span>
            </a>

            <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
              <a className="transition-colors hover:text-foreground" href="#about">
                은하 소개
              </a>
              <a className="transition-colors hover:text-foreground" href="#light">
                빛의 원리
              </a>
              <a className="transition-colors hover:text-foreground" href="#console">
                관측 콘솔
              </a>
              <a className="transition-colors hover:text-foreground" href="#record">
                관측 기록
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-muted-foreground sm:inline-flex"
                onClick={() => navigate("/auth")}
              >
                로그인
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => navigate(SIGN_IN)}>
                관측실 입장
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────── */}
        <section
          id="top"
          className="mx-auto flex min-h-[86vh] w-full max-w-6xl flex-col justify-center px-5 pt-16 pb-24"
        >
          <motion.div
            initial="hidden"
            animate="show"
            variants={heroStagger}
            className="max-w-3xl"
          >
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7 }}
              className="flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-primary/90"
            >
              <span className="h-px w-10 bg-primary/60" />
              Messier 104 · Virgo Cluster
            </motion.p>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.8 }}
              className="font-display text-glow mt-6 text-6xl leading-[0.95] font-semibold text-foreground sm:text-7xl md:text-8xl"
            >
              솜브레로 은하
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.8 }}
              className="font-display mt-3 text-2xl italic text-primary/90 sm:text-3xl"
            >
              The Sombrero Galaxy
            </motion.p>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.8 }}
              className="mt-7 max-w-xl text-base leading-8 text-muted-foreground"
            >
              두꺼운 중심부와 검은 먼지 띠가 선명한 M104. 이 페이지의 배경은
              정지해 있지 않습니다. 은하가 <span className="text-foreground">108초에 한 바퀴</span>
              천천히 돌고, 핵의 빛이 호흡하듯 오갑니다.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.8 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Button size="lg" className="gap-2 px-7" onClick={() => navigate(SIGN_IN)}>
                관측실 입장하기
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border/80 bg-background/40 backdrop-blur"
                onClick={() => {
                  document.getElementById("light")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                배경 자세히 보기
              </Button>
            </motion.div>
          </motion.div>

          <motion.a
            href="#about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="mt-16 flex items-center gap-2 text-xs tracking-[0.28em] text-muted-foreground uppercase transition-colors hover:text-primary"
          >
            <ChevronDown className="size-4 animate-bounce" />
            Scroll
          </motion.a>
        </section>

        {/* ── Facts ───────────────────────────────────────────── */}
        <section id="about" className="border-y border-border/60 bg-background/45 backdrop-blur-sm">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px px-5 md:grid-cols-4">
            {FACTS.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="border-border/50 py-8 md:border-l md:first:border-l-0 md:px-8 md:first:pl-0"
              >
                <p className="text-[11px] tracking-[0.24em] text-primary/80 uppercase">
                  {f.label}
                </p>
                <p className="font-display mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
                  {f.value}
                  <span className="ml-1.5 text-base font-normal text-muted-foreground">
                    {f.unit}
                  </span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{f.note}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Light ───────────────────────────────────────────── */}
        <section id="light" className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <p className="text-[11px] tracking-[0.4em] text-primary/90 uppercase">
              빛의 원리
            </p>
            <h2 className="font-display mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
              은은하게, 천천히
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              화면을 장식하는 반짝임이 아니라, 실제 은하의 인상을 옮겨 왔습니다.
              회전·광휘·먼지, 세 가지가 서로 다른 주기로 움직입니다.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {LIGHT.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="panel-space group rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-display mt-5 text-2xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* ── Console teaser ──────────────────────────────────── */}
        <section id="console" className="border-y border-border/60 bg-background/45 backdrop-blur-sm">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 py-24 md:grid-cols-2 md:py-32">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] tracking-[0.4em] text-primary/90 uppercase">
                관측 콘솔
              </p>
              <h2 className="font-display mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
                직접 돌려보세요
              </h2>
              <p className="mt-5 max-w-lg text-base leading-8 text-muted-foreground">
                로그인하면 이 배경을 다루는 콘솔이 열립니다. 값을 바꾸면 은하가
                즉시 반응하고, 설정은 브라우저에 그대로 남습니다.
              </p>
              <ul className="mt-7 space-y-3 text-sm text-foreground/90">
                {[
                  "회전 속도 — 정지부터 3배까지",
                  "핵 광휘 — 0.3× 에서 2.0× 까지",
                  "성간 물질 밀도 — 0.4× 에서 2.0× 까지",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    {line}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="mt-9 gap-2" onClick={() => navigate(SIGN_IN)}>
                <Telescope className="size-4" />
                콘솔 열기
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="panel-space relative rounded-3xl p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
            >
              <div className="pointer-events-none absolute -top-3 -right-3 -bottom-3 -left-3 rounded-[1.6rem] border border-primary/15" />
              <div className="flex items-center justify-between">
                <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
                  Background Console
                </p>
                <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] tracking-[0.2em] text-primary uppercase">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Live
                </span>
              </div>

              <div className="mt-7 space-y-6">
                {CONSOLE_ROWS.map((row) => (
                  <div key={row.label}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-foreground">{row.label}</span>
                      <span className="font-display text-lg text-primary">
                        {row.label === "회전 속도" ? "108.0초 / 회" : "1.0×"}
                      </span>
                    </div>
                    <div className="relative mt-3 h-1.5 rounded-full bg-muted">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                        style={{ width: `${row.value}%` }}
                      />
                      <span
                        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-[0_0_14px_rgba(255,196,126,0.6)]"
                        style={{ left: `${row.value}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] tracking-widest text-muted-foreground/70 uppercase">
                      <span>{row.min}</span>
                      <span>{row.mid}</span>
                      <span>{row.max}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rule-brass mt-7 h-px" />
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  ["주기", "108s"],
                  ["광휘", "×1.0"],
                  ["밀도", "1.0"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border/70 bg-background/40 py-3">
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                      {k}
                    </p>
                    <p className="font-display mt-1 text-xl text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Records ─────────────────────────────────────────── */}
        <section id="record" className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[11px] tracking-[0.4em] text-primary/90 uppercase">관측 기록</p>
            <h2 className="font-display mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
              2,950만 광년의 편지
            </h2>
          </motion.div>

          <div className="mt-14 space-y-0">
            {RECORDS.map((r, i) => (
              <motion.div
                key={r.year}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="grid gap-4 border-t border-border/60 py-8 md:grid-cols-[8rem_1fr] md:gap-10"
              >
                <p className="font-display text-2xl text-primary md:text-3xl">{r.year}</p>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{r.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {r.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="border-t border-border/60 bg-background/50 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-7 px-5 py-24 text-center">
            <Mark className="size-12 opacity-90" />
            <h2 className="font-display text-glow max-w-2xl text-4xl font-semibold text-foreground sm:text-5xl">
              이 배경 위에서 시작하세요
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              이메일 한 번이면 관측실에 들어갑니다. 로그인 직후 은하는 지금 속도로
              그대로 돌고 있을 겁니다.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="gap-2 px-8" onClick={() => navigate(SIGN_IN)}>
                관측실 입장하기
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                로그인
              </Button>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="border-t border-border/60 bg-background/70">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Mark className="size-6" />
              <span className="text-sm text-muted-foreground">
                솜브레로 은하 관측실 · M104
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a className="transition-colors hover:text-primary" href="#about">
                은하 소개
              </a>
              <a className="transition-colors hover:text-primary" href="#console">
                관측 콘솔
              </a>
              <a className="transition-colors hover:text-primary" href="#record">
                관측 기록
              </a>
            </div>
            <p className="text-xs text-muted-foreground/70">
              자료: NASA / ESA Hubble Space Telescope
            </p>
          </div>
        </footer>
      </div>
    </motion.div>
  );
}
