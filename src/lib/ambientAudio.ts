/**
 * ambientAudio — 잔잔하고 은은한 앰비언트 BGM.
 *
 * 웹 오디오로 라이브 합성하므로 파일 에셋도, 네트워크도 쓰지 않는다:
 * 느리게 숨 쉬는 오픈 피치 드론(A2·E3·A3·E4 — 셋 없는 열린 온음이라
 * 흉내 내는 선율 없이 공간만 남는다) 위에 아주 낮게 깔린 대역 필터
 * 흰소음이 ASMR 같은 공기 질감을 만든다. 그 위에 인터스텔라풍의
 * 오르간 텍스처가 얹힌다 — A단조와 F장조를 여덟 박동마다 한 음만
 * 바꾸며 오가는(E4↔F4) 최소 이동의 맥동, 감쇠 소음 IR의 컨볼버
 * 리버(성가대 공간), 펄스와 같은 주기의 딜레이, 그리고 아주 느린
 * 네 음 모티프(E5–C5–D5–A4). 전부 ASMR 속도와 레벨로다.
 * 마스터 게인 자체를 setTargetAtTime으로 밀어 올리고 떨어뜨리므로
 * 클릭 없이 페이드한다.
 *
 * 모듈 싱글톤이라 라우트가 바뀌어도(독이 다시 마운트되어도) 소리가
 * 끊기지 않는다. 기본 ON — 소리는 첫 사용자 제스처(클릭/키보드)에서
 * 비로소 시작한다. 브라우저 자동재생 정책이 제스처 없인 오디오를 막기
 * 때문이다.
 */

type Listener = () => void;

/** 켜져 있을 때의 마스터 게인 — "은은하게"를 숫자로. */
const MASTER_ON = 0.12;
/** 페이드 시간 상수(초) — 올라가거나 가라앉는 속도. */
const FADE_TAU = 0.45;
/** 한 음의 피크 게인 — 펄스는 드론 아래에서 얇게, 모티프만 그보다 위에. */
const PULSE_PEAK = 0.115;
const MOTIF_PEAK = 0.2;
/** 펄스 간격(초) — 오르간 맥동을 ASMR 속도로 (~70 BPM의박). */
const PULSE_GAP = 0.85;
/** 화음은 여덟 펄스마다 A단조 ↔ F장조로 — 공통음을 지키며 한 옥타브 아래 한 음만 바뀐다. */
const PULSES_PER_CHORD = 8;
/** Am: E4 A4 C5 A4 / F: F4 A4 C5 A4 — 윗선은 그대로, 밑만 E→F. */
const FIGURES: number[][] = [
  [329.63, 440, 523.25, 440],
  [349.23, 440, 523.25, 440],
];
/** 느린 네 음 모티프 — [주파수, 다음 음까지 시작-to-시작 간격(초)]. */
const MOTIF: number[][] = [
  [659.25, 6.8], // E5
  [523.25, 6.6], // C5
  [587.33, 7], // D5
  [440, 14], // A4 — 긴 숨, 처음으로
];
/** 오르간 색 — 기저음에 8도·12도 조화파를 아주 얇게 더한다. */
const PARTIALS: number[][] = [
  [1, 1],
  [2, 0.22],
  [3, 0.07],
];

let enabled = true;
let scene: { ctx: AudioContext; master: GainNode; music: GainNode } | null =
  null;
const listeners = new Set<Listener>();

function notify() {
  for (const fn of listeners) fn();
}

/** 현재 ON 여부 — useSyncExternalStore의 getSnapshot으로 쓴다. */
export function getAmbientOn() {
  return enabled;
}

/** 상태 구독. 구독 해제 함수를 돌려준다. */
export function subscribeAmbient(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * 6초 흰소음 루프. 필터가 이후에도 같은 상태값으로 이어 그리기 때문에
 * 루프 이음매는 원래의 난류와 구별되지 않는다 — 페이드도, 크로스페이드도
 * 필요 없다.
 */
function noiseLoop(ctx: AudioContext) {
  const len = Math.floor(ctx.sampleRate * 6);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** 느리게 숨 쉬는 오픈 피치 드론 — 네 음이 미세하게 detune되어 아주 천천히 마주 간다. */
function buildDrone(ctx: AudioContext, dest: AudioNode) {
  const pad = ctx.createGain();
  pad.gain.value = 0.5;
  pad.connect(dest);

  const voices: Array<[freq: number, level: number, detune: number]> = [
    [110, 0.45, -3], // A2
    [164.81, 0.3, 2], // E3
    [220, 0.2, -2], // A3
    [329.63, 0.1, 4], // E4
  ];
  for (const [freq, level, detune] of voices) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = level;
    osc.connect(g);
    g.connect(pad);
    osc.start();
  }

  // 호흡 — ~17초에 한 번 오르내리는 진폭 (중앙값 0.5 위에서 ±0.14)
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.06;
  const depth = ctx.createGain();
  depth.gain.value = 0.14;
  lfo.connect(depth);
  depth.connect(pad.gain);
  lfo.start();
}

/** 아주 낮은 대역 필터 흰소음 — 솜브레로의 공기층 같은 ASMR 질감. */
function buildAir(ctx: AudioContext, dest: AudioNode) {
  const src = ctx.createBufferSource();
  src.buffer = noiseLoop(ctx);
  src.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 850;
  lp.Q.value = 0.5;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 150;

  const air = ctx.createGain();
  air.gain.value = 0.16;

  src.connect(lp);
  lp.connect(hp);
  hp.connect(air);
  air.connect(dest);
  src.start();

  // 공기도 아주 느리게 숨을 쉰다 (~147초 주기)
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.041;
  const depth = ctx.createGain();
  depth.gain.value = 0.05;
  lfo.connect(depth);
  depth.connect(air.gain);
  lfo.start();
}

/** 다음 펄스·모티프 음을 부를 절대 시각, 그리고 펄스의 마디 위치. */
let nextPulseAt = 0;
let nextMotifAt = 0;
let pulseIdx = 0;
let motifIdx = 0;

type VoiceOpts = { level: number; attack: number; tail: number };

/** 한 음 — 오르간 색 조화파, 부드러운 인두, 긴 지수 꼬리. */
function voice(
  ctx: AudioContext,
  dest: AudioNode,
  at: number,
  freq: number,
  o: VoiceOpts,
) {
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(o.level, at + o.attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + o.attack + o.tail);
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 2600; // 상판 정리 — ASMR은 날카로움을 못 견눈다
  env.connect(tone);
  tone.connect(dest);
  for (const [mul, lvl] of PARTIALS) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * mul;
    osc.detune.value = mul === 1 ? 0 : mul === 2 ? 3 : -4;
    const g = ctx.createGain();
    g.gain.value = lvl;
    osc.connect(g);
    g.connect(env);
    osc.start(at);
    osc.stop(at + o.attack + o.tail + 0.1);
  }
}

/**
 * 음악 버스 — 인터스텔라풍 "효과"들: 3초 감쇠 소음 IR로 만든 컨볼버
 * 리버(성가대 공간)와 펄스와 같은 주기의 딜레이(한 박 뒤에 겹치는 캐논).
 */
function buildMusicBus(ctx: AudioContext, master: GainNode) {
  const bus = ctx.createGain();
  bus.gain.value = 0.9;
  bus.connect(master);

  const irLen = Math.floor(ctx.sampleRate * 3);
  const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < irLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.4);
    }
  }
  const verb = ctx.createConvolver();
  verb.buffer = ir;
  const verbOut = ctx.createGain();
  verbOut.gain.value = 0.5;
  bus.connect(verb);
  verb.connect(verbOut);
  verbOut.connect(master);

  const echo = ctx.createDelay(2);
  echo.delayTime.value = PULSE_GAP;
  const echoFb = ctx.createGain();
  echoFb.gain.value = 0.3;
  const echoOut = ctx.createGain();
  echoOut.gain.value = 0.3;
  bus.connect(echo);
  echo.connect(echoFb);
  echoFb.connect(echo);
  echo.connect(echoOut);
  echoOut.connect(master);

  return bus;
}

/** 400ms마다 — 펄스와 모티프를 정확한 절대 시각에 예약한다. */
function melodyTick() {
  if (!scene || !enabled || scene.ctx.state !== "running") return;
  const { ctx, music } = scene;
  const now = ctx.currentTime;

  // 펄스 — 오래 침묵했다면(켜진 직후 등) 여유를 두고 다시 센다
  if (nextPulseAt <= now + 0.05) nextPulseAt = now + 1.2;
  while (nextPulseAt <= now + 1.5) {
    const fig = FIGURES[Math.floor(pulseIdx / PULSES_PER_CHORD) % 2];
    voice(ctx, music, nextPulseAt, fig[pulseIdx % 4], {
      level: PULSE_PEAK,
      attack: 0.07,
      tail: 0.72,
    });
    nextPulseAt += PULSE_GAP;
    pulseIdx++;
  }

  // 모티프 — 네 음 한 문장, 긴 숨을 두고 반복
  if (nextMotifAt <= now + 0.05) nextMotifAt = now + 1.2;
  if (nextMotifAt <= now + 1.5) {
    const [freq, interval] = MOTIF[motifIdx];
    voice(ctx, music, nextMotifAt, freq, {
      level: MOTIF_PEAK,
      attack: 0.7,
      tail: Math.min(interval - 1, 5.5),
    });
    nextMotifAt += interval;
    motifIdx = (motifIdx + 1) % MOTIF.length;
  }
}

/** 씬을 처음 만들 때 한 번 — 오디오는 사용자 제스처 안에서만 부른다. */
function ensure() {
  if (scene) return scene;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  buildDrone(ctx, master);
  buildAir(ctx, master);
  const music = buildMusicBus(ctx, master);
  nextPulseAt = ctx.currentTime + 2.4; // 드론이 자리를 잡은 뒤 첫 박동
  nextMotifAt = ctx.currentTime + 8; // 모티프는 그보다 한참 뒤에
  window.setInterval(melodyTick, 400);
  scene = { ctx, master, music };
  return scene;
}

function ramp(to: number) {
  if (!scene) return;
  scene.master.gain.setTargetAtTime(to, scene.ctx.currentTime, FADE_TAU);
}

function play() {
  const s = ensure();
  void s.ctx.resume();
  ramp(MASTER_ON);
}

function pause() {
  if (!scene) return;
  ramp(0);
  // 페이드가 끝난 뒤 컨텍스트를 잠들려 소리를 완전히 멈추고 CPU를 아낀다
  window.setTimeout(() => {
    if (!enabled && scene && scene.ctx.state === "running") {
      void scene.ctx.suspend();
    }
  }, 1600);
}

/** 켜고 끈다 — 켜면 페이드인, 끄면 페이드아웃. */
export function setAmbient(next: boolean) {
  enabled = next;
  if (next) play();
  else pause();
  notify();
}

export function toggleAmbient() {
  setAmbient(!enabled);
}

/** 첫 제스처에서 재생을 시작한다 — 자동재생 정책 우회. 한 번만 쓰고 해제된다. */
function startFromGesture() {
  window.removeEventListener("pointerdown", startFromGesture);
  window.removeEventListener("keydown", startFromGesture);
  if (enabled) play();
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", startFromGesture);
  window.addEventListener("keydown", startFromGesture);
}
