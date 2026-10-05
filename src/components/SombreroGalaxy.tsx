import { useEffect, useRef } from "react";
import sombreroPhoto from "@/assets/sombrero-galaxy.jpg";

/**
 * SombreroGalaxy — the real Hubble portrait of M104 as a living backdrop.
 *
 * The galaxy itself is the Hubble Space Telescope mosaic (NASA/ESA, 2003),
 * drawn additively so its black sky stays transparent over our starfield,
 * turning slowly around the galactic core and breathing in brightness.
 * If the photo ever fails to load, it falls back to a procedurally drawn
 * disk — ~1k additive particles, a luminous bulge and a dark dust lane.
 * Every moving part reads the same rotation angle, so a page can change
 * speed / glow / density live without restarting the animation.
 *
 * Respects `prefers-reduced-motion`: the scene renders once and freezes.
 */
export type SombreroGalaxyProps = {
  /** Extra classes for the fixed wrapper (positioning, z-index). */
  className?: string;
  /** Rotation multiplier. 1 ≈ 300 s per revolution, 0 freezes the disk. */
  speed?: number;
  /** Core luminosity, 0–2. */
  glow?: number;
  /** Disk material and field-star density, 0.4–2. */
  density?: number;
  /** Gentle pointer parallax on the galaxy centre. */
  parallax?: boolean;
  /** Horizontal anchor of the galactic core, 0–1. */
  centerX?: number;
  /** Vertical anchor of the galactic core, 0–1. */
  centerY?: number;
};

const TAU = Math.PI * 2;
/** Seconds per revolution at speed = 1 — a stately, barely-there turn. */
export const BASE_PERIOD = 300;
/** Viewing inclination — nearly edge-on, like the Hubble portrait, so the
 *  brim stays thin and the bulge reads taller than the disk. */
const COS_I = Math.cos((78 * Math.PI) / 180);
/** rgb triples: warm core, amber mid-disk, cool outer stars, white. */
const TONES = ["255,244,226", "255,206,148", "198,216,255", "255,255,255"];

type DiskParticle = {
  rn: number;
  a: number;
  size: number;
  bright: number;
  phase: number;
};
type DustParticle = {
  rn: number;
  a: number;
  size: number;
  alpha: number;
  phase: number;
};
type FieldStar = { x: number; y: number; size: number; alpha: number; phase: number };

/** Soft radial dot used for every particle, tinted by rgb triple. */
function makeSprite(rgb: string): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.2, `rgba(${rgb},0.7)`);
  grad.addColorStop(0.48, `rgba(${rgb},0.18)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export default function SombreroGalaxy({
  className = "",
  speed = 1,
  glow = 1,
  density = 1,
  parallax = false,
  centerX = 0.5,
  centerY = 0.5,
}: SombreroGalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const params = useRef({ speed, glow, density, parallax, centerX, centerY });
  const redrawRef = useRef<(() => void) | null>(null);

  // Keep live control values without tearing down the animation loop.
  useEffect(() => {
    params.current = { speed, glow, density, parallax, centerX, centerY };
    redrawRef.current?.();
  }, [speed, glow, density, parallax, centerX, centerY]);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas: HTMLCanvasElement = maybeCanvas;
    const maybeCtx = canvas.getContext("2d", { alpha: false });
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rand = Math.random;

    const sprites = TONES.map(makeSprite);
    const dustSprite = makeSprite("3,4,9");

    // Scene state -----------------------------------------------------
    let w = 1;
    let h = 1;
    let bg: HTMLCanvasElement | null = null;
    let vignette: CanvasGradient | null = null;
    let disk: DiskParticle[][] = [[], [], [], []];
    let dust: DustParticle[] = [];
    let twinkles: FieldStar[] = [];
    let builtDensity = -1;
    let rot = 0;
    let last = performance.now();
    let raf = 0;
    let needsDraw = true;
    // parallax / bob
    let px = 0;
    let py = 0;
    let pointerX = 0;
    let pointerY = 0;
    // per-frame geometry shared with the draw helpers
    let cx = 0;
    let cy = 0;
    let R = 1;
    let t = 0;
    let g = 1;
    let pScale = 1;

    const a16 = (v: number) => Math.min(1, Math.max(0, v)).toFixed(3);

    // Real M104 portrait; the drawn disk stays as the fallback.
    const photo = new Image();
    let photoReady = false;
    const onPhotoLoad = () => {
      photoReady = true;
      needsDraw = true;
    };
    const onPhotoError = () => {
      photoReady = false;
      needsDraw = true;
    };
    photo.addEventListener("load", onPhotoLoad);
    photo.addEventListener("error", onPhotoError);
    photo.src = sombreroPhoto;

    function buildParticles(density: number) {
      const next: DiskParticle[][] = [[], [], [], []];
      const diskCount = Math.round(1150 * density);
      for (let i = 0; i < diskCount; i++) {
        const u = rand();
        const rn = 0.13 + 0.87 * Math.pow(u, 1.35);
        const a = rand() * TAU;
        const outward = (rn - 0.13) / 0.87;
        // two soft spiral bands + fine clumping, comoving with the disk so
        // the rotation is visible instead of a perfectly smooth blur
        const arm = 0.5 + 0.5 * Math.sin(2 * a + outward * 5.2 + 0.7);
        const lump = 0.5 + 0.5 * Math.sin(5 * a - outward * 3.4 + 2.2);
        const falloff = 0.18 + 0.82 * Math.pow(1 - outward, 0.9);
        const bright =
          falloff * (0.55 + 0.45 * (0.68 * arm + 0.32 * lump)) * (0.6 + rand() * 0.7);
        const tt = rand();
        let tone: number;
        if (outward > 0.62) tone = tt < 0.6 ? 1 : tt < 0.92 ? 2 : 0;
        else if (outward > 0.28) tone = tt < 0.66 ? 0 : tt < 0.9 ? 1 : 3;
        else tone = tt < 0.5 ? 3 : tt < 0.85 ? 0 : 1;
        const size = (1.5 + rand() * 2.3) * (outward < 0.28 ? 1.3 : 1);
        next[tone].push({ rn, a, size, bright, phase: rand() * TAU });
      }
      disk = next;

      const dustList: DustParticle[] = [];
      const dustCount = Math.round(260 * density);
      for (let i = 0; i < dustCount; i++) {
        const rn = 0.3 + 0.62 * Math.pow(rand(), 0.85);
        const a = rand() * TAU;
        const clump = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(3 * a + 1.4));
        dustList.push({
          rn,
          a,
          size: 30 + rand() * 74,
          alpha: (0.05 + rand() * 0.17) * clump,
          phase: rand() * TAU,
        });
      }
      dust = dustList;

      const stars: FieldStar[] = [];
      const starCount = Math.round(95 * Math.min(1.6, density));
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: rand(),
          y: rand(),
          size: 1 + rand() * 2.2,
          alpha: 0.22 + rand() * 0.68,
          phase: rand() * TAU,
        });
      }
      twinkles = stars;
      builtDensity = density;
      needsDraw = true;
    }

    function buildBackground() {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * dpr));
      c.height = Math.max(1, Math.round(h * dpr));
      const g2 = c.getContext("2d");
      if (!g2) return;
      g2.setTransform(dpr, 0, 0, dpr, 0, 0);

      const base = g2.createLinearGradient(0, 0, w * 0.3, h);
      base.addColorStop(0, "#04050c");
      base.addColorStop(0.45, "#070a15");
      base.addColorStop(1, "#03040a");
      g2.fillStyle = base;
      g2.fillRect(0, 0, w, h);

      // cold nebula haze, upper left
      const n1 = g2.createRadialGradient(
        w * 0.26,
        h * 0.3,
        0,
        w * 0.26,
        h * 0.3,
        Math.max(w, h) * 0.55,
      );
      n1.addColorStop(0, "rgba(34, 72, 104, 0.30)");
      n1.addColorStop(0.5, "rgba(22, 44, 72, 0.11)");
      n1.addColorStop(1, "rgba(8, 14, 28, 0)");
      g2.fillStyle = n1;
      g2.fillRect(0, 0, w, h);

      // warm haze around the galactic plane
      const n2 = g2.createRadialGradient(
        w * 0.5,
        h * 0.5,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.5,
      );
      n2.addColorStop(0, "rgba(122, 78, 38, 0.20)");
      n2.addColorStop(1, "rgba(50, 28, 14, 0)");
      g2.fillStyle = n2;
      g2.fillRect(0, 0, w, h);

      // distant, non-twinkling stars
      const count = Math.min(780, Math.round((w * h) / 2400));
      for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const a = 0.08 + rand() * 0.45;
        const warm = rand() < 0.3;
        g2.fillStyle = warm ? `rgba(255, 224, 180, ${a})` : `rgba(206, 222, 255, ${a})`;
        g2.beginPath();
        g2.arc(x, y, (rand() < 0.9 ? 0.5 : 0.85) * (0.7 + rand() * 0.7), 0, TAU);
        g2.fill();
      }
      bg = c;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      buildBackground();
      vignette = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.32,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.8,
      );
      vignette.addColorStop(0, "rgba(2, 3, 8, 0)");
      vignette.addColorStop(1, "rgba(1, 2, 6, 0.72)");
      needsDraw = true;
    }

    function drawDiskBody() {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, COS_I);
      const body = ctx.createRadialGradient(0, 0, R * 0.04, 0, 0, R);
      body.addColorStop(0, `rgba(255, 231, 196, ${a16(0.5 * g)})`);
      body.addColorStop(0.22, `rgba(255, 208, 152, ${a16(0.33 * g)})`);
      body.addColorStop(0.55, `rgba(246, 176, 118, ${a16(0.16 * g)})`);
      body.addColorStop(0.85, `rgba(214, 150, 104, ${a16(0.05 * g)})`);
      body.addColorStop(1, "rgba(190, 130, 90, 0)");
      ctx.fillStyle = body;
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.restore();
    }

    /** The Hubble mosaic, spinning slowly around the galactic core. */
    function drawPhoto() {
      const iw = photo.naturalWidth;
      const ih = photo.naturalHeight;
      if (!iw || !ih) return;
      const dw = R * 2.2;
      const dh = (ih / iw) * dw;
      ctx.save();
      // additive: the photo's black sky adds nothing, so no rectangle shows
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, 0.82 * g);
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.drawImage(photo, -dw * 0.5, -dh * 0.5, dw, dh);
      ctx.restore();
    }

    function drawHalo() {
      ctx.globalCompositeOperation = "lighter";
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.35);
      halo.addColorStop(0, `rgba(255, 186, 116, ${a16(0.15 * g)})`);
      halo.addColorStop(0.34, `rgba(233, 148, 86, ${a16(0.075 * g)})`);
      halo.addColorStop(0.72, `rgba(140, 96, 62, ${a16(0.028 * g)})`);
      halo.addColorStop(1, "rgba(90, 70, 60, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(cx - R * 1.4, cy - R * 1.4, R * 2.8, R * 2.8);
    }

    function drawDisk(near: boolean) {
      ctx.globalCompositeOperation = "lighter";
      for (let tone = 0; tone < TONES.length; tone++) {
        const list = disk[tone];
        if (!list.length) continue;
        const sprite = sprites[tone];
        for (let i = 0; i < list.length; i++) {
          const pt = list[i];
          const a = pt.a + rot;
          const s = Math.sin(a);
          if (near ? s <= 0 : s > 0) continue;
          const x = cx + Math.cos(a) * pt.rn * R;
          const y = cy + s * pt.rn * R * COS_I;
          const tw = 0.8 + 0.2 * Math.sin(t * 1.7 + pt.phase);
          const alpha = pt.bright * tw * 0.85 * (0.45 + 0.55 * Math.min(g, 1.6));
          if (alpha < 0.02) continue;
          const size = pt.size * pScale * 4.2;
          ctx.globalAlpha = Math.min(1, alpha);
          ctx.drawImage(sprite, x - size * 0.5, y - size * 0.5, size, size);
        }
      }
    }

    function drawDust(near: boolean) {
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < dust.length; i++) {
        const pt = dust[i];
        const a = pt.a + rot;
        const s = Math.sin(a);
        if (near ? s <= 0 : s > 0) continue;
        const x = cx + Math.cos(a) * pt.rn * R;
        const y = cy + s * pt.rn * R * COS_I;
        const wob = 0.75 + 0.25 * Math.sin(t * 0.5 + pt.phase);
        const size = pt.size * pScale;
        ctx.globalAlpha = Math.min(0.7, pt.alpha * wob);
        ctx.drawImage(dustSprite, x - size * 0.5, y - size * 0.5, size, size);
      }
    }

    function drawBulge() {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1;
      const Rb = R * 0.3;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.94);

      const outer = ctx.createRadialGradient(0, 0, 0, 0, 0, Rb * 1.9);
      outer.addColorStop(0, `rgba(255, 214, 165, ${a16(0.3 * g)})`);
      outer.addColorStop(0.4, `rgba(246, 168, 104, ${a16(0.13 * g)})`);
      outer.addColorStop(1, "rgba(210, 130, 70, 0)");
      ctx.fillStyle = outer;
      ctx.fillRect(-Rb * 2, -Rb * 2, Rb * 4, Rb * 4);

      const mid = ctx.createRadialGradient(0, 0, 0, 0, 0, Rb);
      mid.addColorStop(0, `rgba(255, 244, 224, ${a16(0.7 * g)})`);
      mid.addColorStop(0.35, `rgba(255, 216, 164, ${a16(0.33 * g)})`);
      mid.addColorStop(1, "rgba(255, 186, 120, 0)");
      ctx.fillStyle = mid;
      ctx.fillRect(-Rb, -Rb, Rb * 2, Rb * 2);

      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, Rb * 0.44);
      core.addColorStop(0, `rgba(255, 253, 246, ${a16(0.95 * g)})`);
      core.addColorStop(0.55, `rgba(255, 248, 232, ${a16(0.5 * g)})`);
      core.addColorStop(1, "rgba(255, 240, 214, 0)");
      ctx.fillStyle = core;
      ctx.fillRect(-Rb * 0.5, -Rb * 0.5, Rb, Rb);

      ctx.restore();
    }

    function drawForegroundStars() {
      ctx.globalCompositeOperation = "lighter";
      const sprite = sprites[3];
      for (let i = 0; i < twinkles.length; i++) {
        const s = twinkles[i];
        const tw = 0.6 + 0.4 * Math.sin(t * 1.25 + s.phase);
        const alpha = Math.max(0, s.alpha * tw);
        if (alpha < 0.03) continue;
        const size = s.size * 5;
        const x = s.x * w;
        const y = s.y * h;
        ctx.globalAlpha = alpha * 0.9;
        ctx.drawImage(sprite, x - size * 0.5, y - size * 0.5, size, size);
      }
    }

    function draw(now: number, frozen: boolean) {
      const p = params.current;
      if (p.density !== builtDensity) buildParticles(p.density);

      const dt = frozen ? 0 : Math.min(0.06, Math.max(0, (now - last) / 1000));
      last = now;
      if (!frozen && p.speed > 0) {
        rot = (rot + (TAU * dt * p.speed) / BASE_PERIOD) % TAU;
      }
      t = frozen ? 0 : now / 1000;

      const goalX = p.parallax ? pointerX : 0;
      const goalY = p.parallax ? pointerY : 0;
      px += (goalX - px) * Math.min(1, dt * 1.8);
      py += (goalY - py) * Math.min(1, dt * 1.8);

      cx = w * p.centerX + px;
      cy = h * p.centerY + py + (frozen ? 0 : Math.sin(t * 0.09) * 8);
      R = Math.min(w * 0.47, h * 0.62);
      const pulse = frozen ? 1 : 1 + 0.09 * Math.sin(t * 0.42) + 0.035 * Math.sin(t * 1.05 + 2.4);
      g = Math.max(0, p.glow * pulse);
      pScale = Math.max(0.7, Math.min(1.7, R / 560));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (bg) ctx.drawImage(bg, 0, 0, w, h);

      drawHalo();
      if (photoReady) {
        drawPhoto(); // real Hubble M104
      } else {
        drawDiskBody();
        drawDisk(false); // far half of the brim
        drawDust(false); // far dust lane, behind the bulge
        drawBulge();
        drawDisk(true); // near half of the brim
        drawDust(true); // dark lane crossing in front of the core
      }
      drawForegroundStars();

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (vignette) {
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
      }
    }

    function tick(now: number) {
      if (reducedMotion) {
        if (needsDraw) {
          needsDraw = false;
          draw(0, true);
        }
      } else {
        draw(now, false);
      }
      raf = requestAnimationFrame(tick);
    }

    function onPointerMove(e: PointerEvent) {
      const nx = e.clientX / Math.max(1, w) - 0.5;
      const ny = e.clientY / Math.max(1, h) - 0.5;
      pointerX = nx * 26;
      pointerY = ny * 16;
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    redrawRef.current = () => {
      needsDraw = true;
    };

    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      photo.removeEventListener("load", onPhotoLoad);
      photo.removeEventListener("error", onPhotoError);
      photo.src = "";
      redrawRef.current = null;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
