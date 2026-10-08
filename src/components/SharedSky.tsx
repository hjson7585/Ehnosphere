import { useState, useCallback, useEffect, useRef } from "react";
import SombreroGalaxy from "@/components/SombreroGalaxy";
import CarouselDemo, {
  readStoredSlide,
  storeSlide,
} from "@/components/CarouselDemo";
import { useLocation } from "react-router";

/**
 * One sky, one screen: the Sombrero Galaxy and the shade over it live *above*
 * the routes (mounted once in main.tsx), so the Clock (`/`), the Timer
 * (`/timer`) and the Clean View (`/clean-view`) share a single continuous
 * backdrop. Stepping between them never tears the canvas down and rebuilds
 * it — the same stars keep turning — and the shade is written in exactly
 * one place, which is what makes the views read as one screen. Every other
 * route draws its own SombreroGalaxy, so this path check mirrors those
 * three route paths.
 *
 * The left-side carousel can switch the backdrop: when the second slide
 * ("Ocean wave") is selected, an ocean-wave layer is shown on top of the
 * galaxy. The sky, the timer digits/buttons and the dock itself stay intact
 * — only the background layer changes.
 */
/** Sharpened re-encode of the Unsplash still (q95 + imgix `sharp`) and a
 * 15s clip of real breaking waves shot straight down (nadir) — the camera
 * looks perpendicular at the water instead of skimming it at an angle, so
 * the swell no longer shears across the frame. The 1440p source is scaled
 * to 1080p, sharpened and graded to the still's teal, then closed with a
 * frame-quantised reversed-tail crossfade whose loop seam is smaller than
 * an ordinary frame step, so the repeat never shows a cut.
 * Both are cache-busted so a swap can never be served stale. */
const WAVE_STILL = "/assets/ocean-wave.jpg?v=20261008";
const WAVE_CLIP = "/assets/ocean-wave.mp4?v=20261010";

export default function SharedSky() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";

  // the clip fades in only once it is genuinely playing, so the still (same
  // photo, same framing) covers the gap and doubles as the fallback
  const [wavesLive, setWavesLive] = useState(false);
  const waveVideoRef = useRef<HTMLVideoElement>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(readStoredSlide);
  const onSlideSelect = useCallback((index: number) => {
    setSelectedSlideIndex(index);
    storeSlide(index);
  }, []);
  const showOcean = selectedSlideIndex === 1;

  // `autoPlay` covers a normal tab; inside a sandboxed preview iframe the
  // autoplay permission can be withheld, so retry once the visitor touches
  // the page — the still underneath keeps the scene intact until it starts.
  useEffect(() => {
    if (!showOcean) return;
    const tryPlay = () => {
      waveVideoRef.current?.play().catch(() => undefined);
    };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay, { once: true });
    window.addEventListener("keydown", tryPlay, { once: true });
    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
  }, [showOcean]);

  if (path !== "/" && path !== "/timer" && path !== "/clean-view") return null;

  return (
    <>
      <SombreroGalaxy centerX={0.5} centerY={0.5} />
      {/* a whisper of shade at the centre — enough to seat the foreground, never enough to hide the galaxy */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(3,4,9,0.2)_0%,rgba(3,4,9,0.07)_36%,rgba(3,4,9,0)_68%)]" />

      {/* Ocean wave backdrop — only when the Ocean wave carousel slide is selected */}
      {showOcean && (
        <div className="pointer-events-none fixed inset-0 z-30">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            alt="Ocean wave"
            src={WAVE_STILL}
            loading="eager"
            decoding="sync"
          />
          {/* real footage of aerial waves breaking over the water — replaces
              the still in place (identical framing), muted + looping */}
          <video
            ref={waveVideoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              wavesLive ? "opacity-100" : "opacity-0"
            }`}
            src={WAVE_CLIP}
            poster={WAVE_STILL}
            aria-label="Aerial ocean waves"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            onPlaying={() => setWavesLive(true)}
          />
          {/* subtle darkening at the very edges only — keeps the foreground readable */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,4,9,0)_0%,rgba(3,4,9,0.18)_62%,rgba(3,4,9,0.32)_100%)]" />
        </div>
      )}

      {/* 하단 독과 별개인 좌측 사이드 캐러셀 — 배경 전환용 */}
      <CarouselDemo onSlideSelect={onSlideSelect} />
    </>
  );
}
