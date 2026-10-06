import { AppDock } from "@/components/FloatingDock";
import AnalogClock from "@/components/AnalogClock";
import { motion } from "framer-motion";

/**
 * The whole page is the view: a single timepiece seated exactly in the middle
 * of the Sombrero Galaxy. The sky itself lives in SharedSky, mounted above
 * the routes — this screen and the Timer screen share one continuous
 * backdrop, so switching between them is one screen, not two. No copy, no
 * chrome — the dial and the sky carry it.
 */
export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative min-h-screen overflow-hidden"
    >
      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnalogClock />
        </motion.div>
      </main>

      {/* Clock face · Timer — 하단 플로팅 독 */}
      <AppDock />
    </motion.div>
  );
}
