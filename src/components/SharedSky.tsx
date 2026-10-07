import { useState, useCallback } from "react";
import SombreroGalaxy from "@/components/SombreroGalaxy";
import CarouselDemo from "@/components/CarouselDemo";
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
export default function SharedSky() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";

  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const onSlideSelect = useCallback(
    (index: number) => setSelectedSlideIndex(index),
    [],
  );
  const showOcean = selectedSlideIndex === 1;

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
            src="/assets/ocean-wave.jpg"
            loading="eager"
            decoding="sync"
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
