/**
 * ambientAudio — 잔잔하고 은은한 앰비언트 BGM.
 *
 * 웹 오디오로 라이브 합성하므로 파일 에셋도, 네트워크도 쓰지 않는다:
 * 느리게 숨 쉬는 오픈 피치 드론(A2·E3·A3·E4 — 셋 없는 열린 온음이라
 * 흉내 내는 선율 없이 공간만 남는다) 위에 아주 낮게 깔린 대역 필터
 * 흰소음이 ASMR 같은 공기 질감을 만든다. 우주의 웅장함은 낮게 깔린
 * 서브 베이스와, Am add9 ↔ Fmaj9를 약 24초에 한 번씩 8초에 걸쳐
 * 데워 지나가는 폭넓은 코드 패드가 만든다. 몽환감은 4.5초의 컨볼버
 * 리버, 천천히 차단 주파수가 흐르는 우주 바람, 그리고 4.5~9초마다
 * 피어나는 높은 별빛 차임이 만든다. 전부 ASMR 속도와 레벨로다.
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
/** 별빛 차임의 피크 게인 — 패드 아래에서 아주 얇게 빛난다. */
const SPARKLE_PEAK = 0.075;
/** 코드 전환 주기(초) — 약 24초마다 한 번, 약 8초에 걸쳐 데워 지나간다. */
const CHORD_HOLD = 24;
/** 폭넓은 두 코드 — Am add9 ↔ Fmaj9 (A3·E5가 공통음으로 길게 이어진다). */
const CHORDS: number[][] = [
  [110, 164.81, 220, 493.88, 659.25], // A2 E3 A3 B4 E5
  [87.31, 130.81, 220, 659.25, 783.99], // F2 C3 A3 E5 G5
];
/** 코드 음의 상대 볼륨 — 낮은 음일수록 얇게 눌러 무게를 흐린다. */
const CHORD_LEVELS = [0.5, 0.4, 0.3, 0.25, 0.2];
const CHORD_GAIN = 0.3;
/** 별빛이 피어나는 높은 음들 — A5 C6 E6 G6 B6. */
const SPARKLES = [880, 1046.5, 1318.5, 1568, 1975.5];
/** 차임 색 — 기저음에 8도·12도 조화파를 아주 얇게 더한다. */
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

/** 우주의 무게 — 55Hz 서브는 두 코드 아래에서 언제나 같은 자리에 깔린다. */
function buildSub(ctx: AudioContext, dest: AudioNode) {
  const g = ctx.createGain();
  g.gain.value = 0.16;
  g.connect(dest);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 55; // A1
  osc.connect(g);
  osc.start();
}

/**
 * 웅장함의 본체 — Am add9 ↔ Fmaj9 폭넓은 코드 패드. 두 코드의
 * 오실레이터는 한 번 켜두고, 전환은 gain이 데워지는 크로스페이스로만
 * 한다. 미세한 detune이 합이 두께와 두둥실함을 만든다.
 */
function buildPad(ctx: AudioContext, dest: AudioNode) {
  // 아주 느린 호흡 — 패드가 약 17초 주기로 조금씩 오르내린다
  const breath = ctx.createGain();
  breath.gain.value = 1;
  breath.connect(dest);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.058;
  const depth = ctx.createGain();
  depth.gain.value = 0.12;
  lfo.connect(depth);
  depth.connect(breath.gain);
  lfo.start();

  return CHORDS.map((chord, ci) => {
    const g = ctx.createGain();
    g.gain.value = ci === 0 ? CHORD_GAIN : 0;
    g.connect(breath);
    chord.forEach((freq, vi) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = ((vi % 3) - 1) * 5; // 미세 detune이 두께를 만든다
      const vg = ctx.createGain();
      vg.gain.value = CHORD_LEVELS[vi];
      osc.connect(vg);
      vg.connect(g);
      osc.start();
    });
    return g;
  });
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

  // 우주 바람 — 차단 주파수가 약 42초에 한 번 오르내리며 흐른다
  const drift = ctx.createOscillator();
  drift.frequency.value = 0.024;
  const driftDepth = ctx.createGain();
  driftDepth.gain.value = 260;
  drift.connect(driftDepth);
  driftDepth.connect(lp.frequency);
  drift.start();
}

/** 다음 별빛·코드 전환을 부를 절대 시각, 그리고 지금 켜진 코드. */
let nextSparkleAt = 0;
let nextChordAt = 0;
let chordIdx = 0;
let chordGains: GainNode[] = [];

type VoiceOpts = { level: number; attack: number; tail: number };

/** 별빛 한 알 — 조화파의 두께, 부드러운 인두, 긴 지수 꼬리. */
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
 * 음악 버스 — 몽환의 "효과"들: 4.5초 감쇠 소음 IR로 만든 컨볼버
 * 리버(성가대 공간)와 별빛을 한 박 늦게 반향하는 느린 딜레이.
 */
function buildMusicBus(ctx: AudioContext, master: GainNode) {
  const bus = ctx.createGain();
  bus.gain.value = 0.9;
  bus.connect(master);

  const irLen = Math.floor(ctx.sampleRate * 4.5);
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
  verbOut.gain.value = 0.58;
  bus.connect(verb);
  verb.connect(verbOut);
  verbOut.connect(master);

  const echo = ctx.createDelay(2);
  echo.delayTime.value = 1.1; // 별빛이 한 번쯤 떨어질 만큼 느린 딜레이
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

/** 400ms마다 — 코드 전환과 별빛을 정확한 절대 시각에 예약한다. */
function melodyTick() {
  if (!scene || !enabled || scene.ctx.state !== "running") return;
  const { ctx, music } = scene;
  const now = ctx.currentTime;

  // 코드 전환 — 약 8초에 걸쳐 데워 지나가는 크로스페이스 (소리 없이)
  if (nextChordAt <= now + 0.05) nextChordAt = now + 1.2;
  if (nextChordAt <= now + 1.5) {
    chordIdx = (chordIdx + 1) % CHORDS.length;
    const prev = chordGains[(chordIdx + CHORDS.length - 1) % CHORDS.length];
    const next = chordGains[chordIdx];
    prev.gain.setTargetAtTime(0, nextChordAt, 2.8);
    next.gain.setTargetAtTime(CHORD_GAIN, nextChordAt, 2.8);
    nextChordAt += CHORD_HOLD;
  }

  // 별빛 — 4.5 ~ 9초마다 무작위 높은 음 하나가 피었다가 사그라진다
  if (nextSparkleAt <= now + 0.05) nextSparkleAt = now + 1.2;
  if (nextSparkleAt <= now + 1.5) {
    const freq = SPARKLES[Math.floor(Math.random() * SPARKLES.length)];
    voice(ctx, music, nextSparkleAt, freq, {
      level: SPARKLE_PEAK,
      attack: 0.45,
      tail: 6.5,
    });
    nextSparkleAt += 4.5 + Math.random() * 4.5;
  }
}

/** 씬을 처음 만들 때 한 번 — 오디오는 사용자 제스처 안에서만 부른다. */
function ensure() {
  if (scene) return scene;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  buildSub(ctx, master);
  chordGains = buildPad(ctx, master);
  buildAir(ctx, master);
  const music = buildMusicBus(ctx, master);
  nextSparkleAt = ctx.currentTime + 6; // 자리 잡은 뒤 첫 별빛
  nextChordAt = ctx.currentTime + CHORD_HOLD; // 첫 코드는 이미 켜져 있다
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
