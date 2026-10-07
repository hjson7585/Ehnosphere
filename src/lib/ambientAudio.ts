/**
 * ambientAudio — 잔잔하고 은은한 앰비언트 BGM.
 *
 * 웹 오디오로 라이브 합성하므로 파일 에셋도, 네트워크도 쓰지 않는다:
 * 느리게 숨 쉬는 오픈 피치 드론(A2·E3·A3·E4 — 셋 없는 열린 온음이라
 * 흉내 내는 선율 없이 공간만 남는다) 위에 아주 낮게 깔린 대역 필터
 * 흰소음이 ASMR 같은 공기 질감을 만든다. 마스터 게인 자체를
 * setTargetAtTime으로 밀어 올리고 떨어뜨리므로 클릭 없이 페이드한다.
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

let enabled = true;
let scene: { ctx: AudioContext; master: GainNode } | null = null;
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

/** 씬을 처음 만들 때 한 번 — 오디오는 사용자 제스처 안에서만 부른다. */
function ensure() {
  if (scene) return scene;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  buildDrone(ctx, master);
  buildAir(ctx, master);
  scene = { ctx, master };
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
