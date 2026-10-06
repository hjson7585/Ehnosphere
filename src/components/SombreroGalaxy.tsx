import { useEffect, useRef } from "react";
import sombreroPhoto from "@/assets/sombrero-galaxy.jpg";
import sombreroPhotoMid from "@/assets/sombrero-galaxy-4096.jpg";
import sombreroPhotoLight from "@/assets/sombrero-galaxy-2048.jpg";

/**
 * SombreroGalaxy — the real Hubble portrait of M104 as a living backdrop.
 *
 * The galaxy itself is the Hubble Space Telescope mosaic (NASA/ESA, 2003),
 * drawn additively so its black sky stays transparent over our starfield.
 * The photograph never spins: instead the material inside it turns — stars
 * and dust revolve through the brim while a soft light travels around the
 * disk, the light and shadow sweep the dust lane, the haze beyond the brim
 * circles the nucleus more slowly still, and the whole thing breathes in
 * brightness. If the photo ever fails
 * to load, it falls back to a fully drawn disk — particles, luminous bulge
 * and dark dust lane. Every moving part reads the same rotation angle, so a
 * page can change speed / glow / density live without restarting anything.
 *
 * Respects `prefers-reduced-motion`: the scene renders once and freezes.
 */
export type SombreroGalaxyProps = {
  /** Extra classes for the fixed wrapper (positioning, z-index). */
  className?: string;
  /** Rotation multiplier. 1 ≈ 200 s per revolution, 0 freezes the disk. */
  speed?: number;
  /** Core luminosity, 0–2. */
  glow?: number;
  /** Disk material and field-star density, 0.4–2. */
  density?: number;
  /** Horizontal anchor of the galactic core, 0–1. */
  centerX?: number;
  /** Vertical anchor of the galactic core, 0–1. */
  centerY?: number;
};

const TAU = Math.PI * 2;
/**
 * Seconds per revolution at speed = 1. Unhurried, but quick enough that the
 * turn actually registers: 1.8° per second, one full sweep every 3 min 20 s.
 * At the old 300 s it was 1.2°/s — slow enough to read as *still* rather
 * than as *turning*.
 */
export const BASE_PERIOD = 200;
/**
 * The haze out in the black sky rides the same wheel at NEBULA_SPIN of the
 * disk's rate — one circuit for every 1/NEBULA_SPIN revolutions of the stars.
 * At the default speed that is 0.27°/s, about 15 px of arc over ten seconds:
 * a drift you notice only once you look for it, which is the whole point of
 * asking for the nebulae to turn "just a little".
 */
const NEBULA_SPIN = 0.15;
/**
 * The dust-lane sweep rides its own clock at RING_SPIN of the disk's rate —
 * 800 s per circuit at the default speed, 0.45°/s, which works out to about
 * 2 px of arc per second along the lane on a 1280-wide panel and 3 px on a
 * 1920-wide one (the ellipse is scaled from the photograph, so the linear
 * speed follows the window; the angular speed does not).
 *
 * The three periods are deliberately nested with radius, the way real orbits
 * are: the disk turns fastest (200 s), then the lane sweep (800 s), then the
 * outer haze (1333 s).
 */
const RING_SPIN = 0.25;
/** Viewing inclination — nearly edge-on, like the Hubble portrait, so the
 *  brim stays thin and the bulge reads taller than the disk. */
const COS_I = Math.cos((78 * Math.PI) / 180);
/** rgb triples: warm core, amber mid-disk, cool outer stars, white. */
const TONES = ["255,244,226", "255,206,148", "198,216,255", "255,255,255"];
/**
 * How the mosaic itself is printed. A plain brightness multiplier lifted the
 * midtones but flattened them too — the brim lost its bite and the whole
 * plate read as a milky haze. Lifting a little *and* stretching contrast
 * keeps the black sky at true black while the lit dust lane snaps forward,
 * so the photograph reads crisp instead of foggy; saturate puts the amber
 * back after the contrast pull.
 *
 * The pair is chosen for its shoulder, not its punch: this combination clips
 * at v ≈ 0.85, where brightness(1.2) alone clipped at 0.83. The unsharp mask
 * in `sharpenPhoto` lifts bright structure before the filter sees it, so
 * every fraction of headroom here is bright dust-lane detail that survives
 * instead of merging into flat white.
 *
 * Applied once while the photo layer is built, never per frame.
 */
const PHOTO_FILTER = "brightness(1.1) contrast(1.14) saturate(1.06)";
/**
 * How hard the plate is unsharp-masked when its layer is built, 0–1. The
 * Hubble mosaic is already resolved to the pixel — what made it read soft was
 * everything happening *after* it left the file. See `sharpenPhoto`.
 */
const PHOTO_SHARPEN = 0.5;

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
type FieldStar = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
};

/** Soft radial dot used for every particle, tinted by rgb triple. */
function makeSprite(rgb: string): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
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
  centerX = 0.5,
  centerY = 0.5,
}: SombreroGalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const params = useRef({ speed, glow, density, centerX, centerY });
  const redrawRef = useRef<(() => void) | null>(null);

  // Keep live control values without tearing down the animation loop.
  useEffect(() => {
    params.current = { speed, glow, density, centerX, centerY };
    redrawRef.current?.();
  }, [speed, glow, density, centerX, centerY]);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas: HTMLCanvasElement = maybeCanvas;
    const maybeCtx = canvas.getContext("2d", { alpha: false });
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;
    // every scaled blit (mosaic, glow sprites, halo) on the best filter —
    // the default is the fast one, which dulls star points
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Full native pixels up to 3× — on a phone the mosaic and the star field
    // are painted at the panel's real resolution instead of being stretched
    // by the compositor, which is what kept the background looking soft.
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
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
    /** the outer nebula's own angle — same clock as rot, NEBULA_SPIN as fast */
    let nebRot = 0;
    /** the dust-lane sweep's angle — same clock again, RING_SPIN as fast */
    let ringRot = 0;
    let last = performance.now();
    let raf = 0;
    let needsDraw = true;
    /** per-frame geometry shared with the draw helpers */
    let cx = 0;
    let cy = 0;
    let R = 1;
    /** radius of the revolving material — follows the photograph when it is up */
    let diskR = 1;
    /** pre-rendered mosaic with feathered edges, null until the photo is ready */
    let photoLayer: HTMLCanvasElement | null = null;
    /** aspect of the mosaic inside photoLayer — stays valid while a better
     *  master is still downloading, so the photograph never blinks out */
    let photoAspect = 0;
    let t = 0;
    let g = 1;
    let pScale = 1;
    /** how strongly the revolving material reads over the photograph */
    let starAlpha = 1;
    let dustAlpha = 1;

    const a16 = (v: number) => Math.min(1, Math.max(0, v)).toFixed(3);

    /** Width of the mosaic — sized so the galaxy sits a little farther away. */
    const photoWidth = (width: number, height: number) =>
      Math.max(width * 0.82, Math.min(width * 0.47, height * 0.62) * 1.6);
    /**
     * Centre of M104 inside the frame (0–1) — the nucleus, and the point that
     * lands exactly on the clock's pivot. Measured eight independent ways on
     * the mosaic itself: saturated-core centroid (0.499, 0.497), half-max
     * light-profile centre (0.498, 0.498), blurred peaks at four scales
     * (0.496–0.497, 0.495–0.497), 180° symmetry centre (0.498, 0.494), total
     * light centroid (0.498, 0.492). They average to (0.4975, 0.4965) — within
     * half a pixel of this constant at any window size.
     */
    const CORE = { x: 0.4978, y: 0.4966 };

    /**
     * Paint the mosaic into a device-sized target, shrinking in ~2× steps.
     * A browser's single-pass drawImage from 7680 px down to a screen-wide
     * layer runs on a cheap filter: the star field aliases into sparkle and
     * the dust lane shimmers. Halving keeps every resample close to 1:1, so
     * the photograph reads print-grade instead of web-grade.
     */
    function paintPhoto(
      target: CanvasRenderingContext2D,
      cw: number,
      ch: number,
    ) {
      let src: CanvasImageSource = photo;
      let sw = photo.naturalWidth;
      let sh = photo.naturalHeight;
      while (sw > cw * 2 && sh > ch * 2) {
        const nw = Math.max(cw, Math.floor(sw / 2));
        const nh = Math.max(ch, Math.floor(sh / 2));
        const step = document.createElement("canvas");
        step.width = nw;
        step.height = nh;
        const sg = step.getContext("2d");
        if (!sg) break;
        sg.imageSmoothingEnabled = true;
        sg.imageSmoothingQuality = "high";
        sg.drawImage(src, 0, 0, nw, nh);
        src = step;
        sw = nw;
        sh = nh;
      }
      target.save();
      target.filter = PHOTO_FILTER;
      target.drawImage(src, 0, 0, cw, ch);
      target.restore();
    }

    /**
     * A one-sided unsharp mask, assembled out of four GPU blits so even a
     * twelve-megapixel layer costs one extra canvas instead of a pass over
     * every pixel:
     *
     *   work  = min(source, blur(source))       // the low-pass, clamped
     *   hi    = source - work                   // = max(source - blur, 0)
     *   out   = work + hi + amount * hi         // = source + amount * hi
     *
     * Only the bright side of every edge is boosted. Against a near-black sky
     * the dark side of an edge carries no information, and leaving it out is
     * what keeps the mask from drawing the grey rings that make a sharpened
     * photograph look cheap — here the dust lane and the star field simply
     * come into focus. Runs once, while the layer is built, never per frame.
     */
    function sharpenPhoto(
      c: HTMLCanvasElement,
      target: CanvasRenderingContext2D,
    ) {
      if (PHOTO_SHARPEN <= 0) return;
      const layerW = c.width;
      const layerH = c.height;
      if (layerW < 4 || layerH < 4) return;

      const work = document.createElement("canvas");
      work.width = layerW;
      work.height = layerH;
      const wg = work.getContext("2d");
      if (!wg) return;
      wg.imageSmoothingEnabled = true;
      wg.imageSmoothingQuality = "high";

      // work <- blur(source); the radius is quoted in device pixels, so it
      // stays ~1 CSS px wide whatever the pixel ratio of the panel is
      const radius = Math.max(1, Math.round(0.9 * dpr));
      wg.filter = `blur(${radius}px)`;
      wg.drawImage(c, 0, 0);
      wg.filter = "none";

      // work <- min(source, blur): everything the blur does not overshoot
      wg.globalCompositeOperation = "darken";
      wg.drawImage(c, 0, 0);

      // source <- source - min(source, blur): the bright detail, on its own.
      // difference() is an absolute value, but the operand is a minimum, so
      // the result is never negative — that is the whole trick.
      target.globalCompositeOperation = "difference";
      target.drawImage(work, 0, 0);

      // work <- low-pass + detail (the original plate) + amount x detail
      wg.globalCompositeOperation = "lighter";
      wg.globalAlpha = 1;
      wg.drawImage(c, 0, 0);
      wg.globalAlpha = PHOTO_SHARPEN;
      wg.drawImage(c, 0, 0);
      wg.globalAlpha = 1;

      // lay the finished plate back over the source
      target.globalCompositeOperation = "source-over";
      target.clearRect(0, 0, layerW, layerH);
      target.drawImage(work, 0, 0);
    }

    /**
     * Pre-render the mosaic at device resolution with every edge faded to
     * zero alpha. Drawn that way, no rectangle can ever show up against the
     * sky — the photograph simply dissolves into the surrounding stars.
     */
    function buildPhotoLayer() {
      if (!photoReady) return;
      const iw = photo.naturalWidth;
      const ih = photo.naturalHeight;
      if (!iw || !ih) return; // a master swap is in flight — keep the layer we have
      const dw = photoWidth(w, h);
      const dh = (ih / iw) * dw;
      photoAspect = dh / dw;
      const cw = Math.max(1, Math.round(dw * dpr));
      const ch = Math.max(1, Math.round(dh * dpr));
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const g2 = c.getContext("2d");
      if (!g2) return;
      g2.imageSmoothingEnabled = true;
      g2.imageSmoothingQuality = "high";
      paintPhoto(g2, cw, ch);
      sharpenPhoto(c, g2);

      // Mask on the galaxy itself: an ellipse with a wide, smooth falloff that
      // reaches zero before any edge of the frame — no rectangle, no hard rim,
      // the brim simply dissolves into the surrounding sky.
      // It is centred on the nucleus itself, never on the frame's bright
      // bounding box: that box is pulled to the right by stars outside the
      // galaxy, which used to fade the left brim first and leave the visible
      // silhouette ~57 px right of the pivot. Locked to CORE, the falloff —
      // and therefore the whole visible galaxy — is symmetric about the same
      // point the hands rotate around.
      const gx = CORE.x * cw;
      const gy = CORE.y * ch;
      const sx = 0.44 * cw;
      const sy = 0.43 * ch;
      g2.globalCompositeOperation = "destination-in";
      g2.save();
      g2.translate(gx, gy);
      g2.scale(sx, sy);
      const fade = g2.createRadialGradient(0, 0, 0, 0, 0, 1);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(0.74, "rgba(0,0,0,1)");
      fade.addColorStop(0.86, "rgba(0,0,0,0.72)");
      fade.addColorStop(0.94, "rgba(0,0,0,0.38)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      g2.fillStyle = fade;
      // paint the whole frame in gradient space, so every pixel is masked
      g2.fillRect(-gx / sx, -gy / sy, cw / sx, ch / sy);
      g2.restore();
      photoLayer = c;
    }

    // Real M104 portrait; the drawn disk stays as the fallback.
    const photo = new Image();
    let photoReady = false;
    /**
     * Three Q95 4:4:4 encodes of the same Hubble mosaic — 7680 / 4096 / 2048 px
     * wide (18.0 / 4.1 / 0.7 MB). We fetch the smallest one that still covers
     * the layer's device width (mosaic width × pixel ratio), so the photograph
     * is never upscaled: a phone stays light, a studio display gets the full
     * art. The choice is revisited on resize but only ever traded upward, and
     * any encode that errors is dropped from the ladder for good.
     */
    const failedPhotos = new Set<string>();
    let photoSrc = "";
    let photoRank = -1;
    const pickTier = (vw: number, vh: number) => {
      const need = photoWidth(vw, vh) * dpr;
      if (need > 4096 && !failedPhotos.has(sombreroPhoto))
        return { src: sombreroPhoto, rank: 2 };
      if (need > 2048 && !failedPhotos.has(sombreroPhotoMid))
        return { src: sombreroPhotoMid, rank: 1 };
      return failedPhotos.has(sombreroPhotoLight)
        ? null
        : { src: sombreroPhotoLight, rank: 0 };
    };
    const loadPhoto = () => {
      const [vw, vh] =
        w > 1 && h > 1 ? [w, h] : [window.innerWidth, window.innerHeight];
      const tier = pickTier(vw, vh);
      if (!tier || tier.rank <= photoRank) return; // never trade back down
      photoSrc = tier.src;
      photoRank = tier.rank;
      photo.src = tier.src;
    };
    const onPhotoLoad = () => {
      photoReady = true;
      buildPhotoLayer();
      needsDraw = true;
    };
    const onPhotoError = () => {
      // a big encode can fail on a memory-tight device: step down the ladder
      // and try the next one, and only hand over to the drawn disk once even
      // the lightest encode is gone
      failedPhotos.add(photoSrc);
      const next =
        photoSrc === sombreroPhoto
          ? sombreroPhotoMid
          : photoSrc === sombreroPhotoMid
            ? sombreroPhotoLight
            : "";
      if (next) {
        photoSrc = next;
        photoRank = next === sombreroPhotoMid ? 1 : 0;
        photo.src = next;
        return;
      }
      photoReady = false;
      photoLayer = null;
      photoRank = -1;
      needsDraw = true;
    };
    photo.addEventListener("load", onPhotoLoad);
    photo.addEventListener("error", onPhotoError);
    loadPhoto();

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
          falloff *
          (0.55 + 0.45 * (0.68 * arm + 0.32 * lump)) *
          (0.6 + rand() * 0.7);
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

      // The nebula haze used to be baked in right here — which pinned it to
      // a sky that never moved. It now lives in drawNebula(), painted per
      // frame so it can circle the nucleus. What stays static is what is
      // genuinely static: the gradient wash and the distant stars.

      // distant, non-twinkling stars
      const count = Math.min(780, Math.round((w * h) / 2400));
      for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const a = 0.08 + rand() * 0.45;
        const warm = rand() < 0.3;
        g2.fillStyle = warm
          ? `rgba(255, 224, 180, ${a})`
          : `rgba(206, 222, 255, ${a})`;
        g2.beginPath();
        g2.arc(
          x,
          y,
          (rand() < 0.9 ? 0.5 : 0.85) * (0.7 + rand() * 0.7),
          0,
          TAU,
        );
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
      loadPhoto(); // only trades upward: a sharper encode when the panel grows
      if (photoReady) buildPhotoLayer();
      // Started later and much lighter: a heavy edge burn is what made the
      // frame feel like it was closing in on the galaxy.
      vignette = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.54,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.98,
      );
      vignette.addColorStop(0, "rgba(2, 3, 8, 0)");
      vignette.addColorStop(1, "rgba(1, 2, 6, 0.32)");
      needsDraw = true;
    }

    /**
     * The cold and warm haze living in the black sky past the brim, circling
     * the Sombrero nucleus instead of sitting still.
     *
     * A radial gradient is symmetric about its own centre, so *orbiting* that
     * centre is exactly equivalent to rotating the whole cloud about the
     * core — and it is the cheaper of the two: nothing passes through a
     * rotated transform, so no wedge of screen is ever left bare by a canvas
     * edge that swung away. Same stops, same radii, same colours as when this
     * was baked into the static layer — only the centre moves now.
     */
    function drawNebula() {
      const cos = Math.cos(nebRot);
      const sin = Math.sin(nebRot);
      /** a frame-relative point carried around the nucleus by nebRot */
      const orbit = (fx: number, fy: number) => {
        const ox = fx * w - cx;
        const oy = fy * h - cy;
        return [cx + ox * cos - oy * sin, cy + ox * sin + oy * cos] as const;
      };

      ctx.globalCompositeOperation = "source-over";

      // A faint cold breath, upper left — kept low so the sky stays clean and
      // open rather than fogged over. This is the cloud that does the
      // circling: its centre sits well clear of the nucleus.
      const [n1x, n1y] = orbit(0.26, 0.3);
      const n1 = ctx.createRadialGradient(
        n1x,
        n1y,
        0,
        n1x,
        n1y,
        Math.max(w, h) * 0.55,
      );
      n1.addColorStop(0, "rgba(34, 72, 104, 0.13)");
      n1.addColorStop(0.5, "rgba(22, 44, 72, 0.05)");
      n1.addColorStop(1, "rgba(8, 14, 28, 0)");
      ctx.fillStyle = n1;
      ctx.fillRect(0, 0, w, h);

      // barely-there warmth along the galactic plane. On the landing page its
      // centre coincides with the nucleus, so it sits on the axis of rotation
      // and stays put; wherever the core is anchored elsewhere it drifts too.
      const [n2x, n2y] = orbit(0.5, 0.5);
      const n2 = ctx.createRadialGradient(
        n2x,
        n2y,
        0,
        n2x,
        n2y,
        Math.max(w, h) * 0.5,
      );
      n2.addColorStop(0, "rgba(122, 78, 38, 0.07)");
      n2.addColorStop(1, "rgba(50, 28, 14, 0)");
      ctx.fillStyle = n2;
      ctx.fillRect(0, 0, w, h);
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

    /** The Hubble mosaic — held still; only the material inside it turns. */
    function drawPhoto() {
      if (!photoLayer || !photoAspect) return;
      ctx.save();
      // Raw device pixels on a whole-pixel origin. The layer already *is*
      // photoLayer.width x photoLayer.height device pixels, so the only way
      // it can reach the screen untouched is laid down 1:1 — placing it at a
      // fractional coordinate made the compositor resample a texture that
      // was already exactly its own size, and that half-pixel wobble was
      // itself a blur. Snapping around the nucleus rather than around the
      // frame keeps CORE on the clock's pivot inside half a device pixel.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // painted straight on — photographic tonality, no additive blow-out
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(
        photoLayer,
        Math.round(cx * dpr - CORE.x * photoLayer.width),
        Math.round(cy * dpr - CORE.y * photoLayer.height),
        photoLayer.width,
        photoLayer.height,
      );
      ctx.restore();
    }

    /**
     * A soft light travelling around the brim. Drawn as an elliptical
     * gradient that fades to nothing on its own — no clip, so it can never
     * leave a straight edge across the disk — it sweeps with the same angle
     * as the stars and makes the galaxy read as turning.
     */
    function drawSheen() {
      const rx = photoReady ? photoWidth(w, h) * 0.4 : R * 1.05;
      const ry = photoReady ? photoWidth(w, h) * 0.1 : R * 0.24;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1;
      ctx.translate(cx, cy);
      ctx.scale(rx, ry);
      const ux = Math.cos(rot) * 0.62;
      const uy = Math.sin(rot) * 0.62;
      const grd = ctx.createRadialGradient(ux, uy, 0, ux, uy, 0.5);
      // The photograph itself never moves, so this sweep is the loudest thing
      // left saying "turning". At 0.08 it sat under the plate's own contrast
      // and the rotation read as stopped — raised, it carries the motion on
      // its own. Broad and warm, so it stays a light rather than a haze: it
      // only ever touches the brim.
      grd.addColorStop(0, `rgba(255, 238, 208, ${a16(0.15 * g)})`);
      grd.addColorStop(0.5, `rgba(255, 208, 156, ${a16(0.07 * g)})`);
      grd.addColorStop(1, "rgba(255, 190, 140, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(-1.2, -1.2, 2.4, 2.4);
      ctx.restore();
    }

    /**
     * Light and shadow travelling around the dust lane — the black band that
     * gives the Sombrero its brim, and the ring you can actually see.
     *
     * The lane is drawn as a flat ellipse a little tighter than the brim the
     * sheen rides, at ≈ cos 78°: the same inclination the drawn disk uses, so
     * the sweep tracks the photograph's own band instead of floating over it.
     * Two lobes orbit it in opposite phase — a warm glow set with `lighter`,
     * a soft darkening set with `source-over`. A shadow can only subtract, so
     * that is the whole trick; no clipping, no extra layer.
     *
     * Its own slow clock (RING_SPIN) keeps it from simply riding along with
     * the disk: it reads as weather passing over the lane rather than as one
     * more thing spinning at the same rate.
     */
    function drawRingSweep() {
      const rx = photoReady ? photoWidth(w, h) * 0.37 : R * 0.9;
      const ry = photoReady ? photoWidth(w, h) * 0.08 : R * 0.19;
      const ux = Math.cos(ringRot) * 0.62;
      const uy = Math.sin(ringRot) * 0.62;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(rx, ry);

      // the half of the band held in shadow
      ctx.globalCompositeOperation = "source-over";
      const shade = ctx.createRadialGradient(-ux, -uy, 0, -ux, -uy, 0.5);
      shade.addColorStop(0, "rgba(1, 2, 6, 0.26)");
      shade.addColorStop(0.5, "rgba(1, 2, 6, 0.12)");
      shade.addColorStop(1, "rgba(1, 2, 6, 0)");
      ctx.fillStyle = shade;
      ctx.fillRect(-1.2, -1.2, 2.4, 2.4);

      // the other half, catching a low warm gleam
      ctx.globalCompositeOperation = "lighter";
      const gleam = ctx.createRadialGradient(ux, uy, 0, ux, uy, 0.5);
      gleam.addColorStop(0, "rgba(255, 226, 184, 0.1)");
      gleam.addColorStop(0.5, "rgba(238, 186, 130, 0.045)");
      gleam.addColorStop(1, "rgba(210, 150, 100, 0)");
      ctx.fillStyle = gleam;
      ctx.fillRect(-1.2, -1.2, 2.4, 2.4);

      ctx.restore();
    }

    function drawHalo() {
      // keep the bloom hugging the galaxy, however far away it is
      const hr = photoReady ? photoWidth(w, h) * 0.52 : R * 1.35;
      ctx.globalCompositeOperation = "lighter";
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr);
      halo.addColorStop(0, `rgba(255, 186, 116, ${a16(0.13 * g)})`);
      halo.addColorStop(0.34, `rgba(233, 148, 86, ${a16(0.06 * g)})`);
      halo.addColorStop(0.72, `rgba(140, 96, 62, ${a16(0.02 * g)})`);
      halo.addColorStop(1, "rgba(90, 70, 60, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(cx - hr * 1.05, cy - hr * 1.05, hr * 2.1, hr * 2.1);
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
          const x = cx + Math.cos(a) * pt.rn * diskR;
          const y = cy + s * pt.rn * diskR * COS_I;
          const tw = 0.8 + 0.2 * Math.sin(t * 1.7 + pt.phase);
          const alpha =
            pt.bright *
            tw *
            0.85 *
            (0.45 + 0.55 * Math.min(g, 1.6)) *
            starAlpha;
          if (alpha < 0.02) continue;
          // Smaller than it used to be: at 4.2x each sprite was a soft
          // smudge laying haze over the plate. Shrunk, the same count reads
          // as crisp points of light — and points are what the eye actually
          // tracks when it is trying to see something turn.
          const size = pt.size * pScale * 3.0;
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
        const x = cx + Math.cos(a) * pt.rn * diskR;
        const y = cy + s * pt.rn * diskR * COS_I;
        const wob = 0.75 + 0.25 * Math.sin(t * 0.5 + pt.phase);
        const size = pt.size * pScale;
        ctx.globalAlpha = Math.min(0.7, pt.alpha * wob) * dustAlpha;
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
        // small and quiet: at 5x a soft sprite this read as an out-of-focus
        // smudge sitting on top of a sharp plate, not as a star
        const size = s.size * 3.2;
        const x = s.x * w;
        const y = s.y * h;
        ctx.globalAlpha = alpha * 0.6;
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
        // the outer haze keeps its own, much slower hand on the same clock
        nebRot =
          (nebRot + (TAU * dt * p.speed * NEBULA_SPIN) / BASE_PERIOD) % TAU;
        // and the dust-lane sweep, slower still
        ringRot =
          (ringRot + (TAU * dt * p.speed * RING_SPIN) / BASE_PERIOD) % TAU;
      }
      t = frozen ? 0 : now / 1000;

      // Locked to the anchor: the galaxy's nucleus must sit exactly where the
      // clock's pivot sits, so there is no drift and no parallax offset here.
      cx = w * p.centerX;
      cy = h * p.centerY;
      R = Math.min(w * 0.47, h * 0.62);
      // the photographed galaxy spans wider than the drawn one — follow it
      diskR = photoReady ? photoWidth(w, h) * 0.39 : R;
      const pulse = frozen
        ? 1
        : 1 + 0.09 * Math.sin(t * 0.42) + 0.035 * Math.sin(t * 1.05 + 2.4);
      g = Math.max(0, p.glow * pulse);
      pScale = Math.max(0.7, Math.min(1.7, R / 560));
      // The photograph already contains a star field and a dust lane; the
      // procedural ones exist only to make the disk read as *turning*. Taken
      // too far down (0.15) they stopped signalling motion at all — a single
      // particle landed near alpha 0.05 against the plate, so the rotation
      // disappeared along with them. Restored here, with the veil they used
      // to cast paid for by shrinking every sprite in drawDisk instead of by
      // dimming it.
      starAlpha = photoReady ? 0.32 : 1;
      // The dark lane is a weak motion cue and a strong veil, so it stays
      // well under its original 0.55; the drawn fallback still gets it full.
      dustAlpha = photoReady ? 0.32 : 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (bg) ctx.drawImage(bg, 0, 0, w, h);
      drawNebula(); // the haze, a little way around from where it was

      if (photoReady) {
        drawPhoto(); // real Hubble M104, held still
        drawHalo(); // warm bloom breathing over the photograph
        drawRingSweep(); // light and shadow travelling the dust lane
        drawSheen(); // travelling light — the slow rotation
        drawDisk(false); // stars revolving through the brim
        drawDust(false);
        drawDisk(true);
        drawDust(true);
      } else {
        drawHalo();
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

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    redrawRef.current = () => {
      needsDraw = true;
    };

    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      photo.removeEventListener("load", onPhotoLoad);
      photo.removeEventListener("error", onPhotoError);
      photo.src = "";
      photoLayer = null;
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
