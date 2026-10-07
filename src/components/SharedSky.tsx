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
 */
export default function SharedSky() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/timer" && path !== "/clean-view") return null;
  return (
    <>
      <SombreroGalaxy centerX={0.5} centerY={0.5} />
      {/* a whisper of shade at the centre — enough to seat the foreground, never enough to hide the galaxy */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(3,4,9,0.2)_0%,rgba(3,4,9,0.07)_36%,rgba(3,4,9,0)_68%)]" />
      {/* 하단 독과 별개인 좌측 사이드 캐러셀 — 배경 전환용 */}
      <CarouselDemo />
    </>
  );
}
