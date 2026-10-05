import AnalogClock from "@/components/AnalogClock";
import SombreroGalaxy from "@/components/SombreroGalaxy";
import { motion } from "framer-motion";

/**
 * The whole page is the view: a slowly turning Sombrero Galaxy with a single
 * timepiece seated exactly in the middle of it. No copy, no chrome — the dial
 * and the sky carry it.
 */
export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative min-h-screen overflow-hidden bg-background"
    >
      {/* 솜브레로 은하 — 은은하게 빛나며 천천히 회전 */}
      <SombreroGalaxy centerX={0.5} centerY={0.5} />

      {/* seat the dial gently — just enough for the hands to hold, not enough to hide the galaxy */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(3,4,9,0.34)_0%,rgba(3,4,9,0.14)_38%,rgba(3,4,9,0)_72%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnalogClock />
        </motion.div>
      </main>
    </motion.div>
  );
}
