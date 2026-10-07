import { AppDock } from "@/components/FloatingDock";
import { motion } from "framer-motion";

/**
 * Clean View — the Sombrero backdrop with neither the dial nor the countdown
 * on it. The canvas itself lives in SharedSky (mounted above the routes), so
 * stepping here from the Clock or Timer never tears the sky down: the same
 * stars keep turning, and this screen adds nothing but the way back out.
 */
export default function CleanView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative min-h-screen overflow-hidden"
    >
      <AppDock />
    </motion.div>
  );
}
