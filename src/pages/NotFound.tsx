import SombreroGalaxy from "@/components/SombreroGalaxy";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen flex flex-col"
    >
      <SombreroGalaxy />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(4,5,12,0.72),rgba(4,5,12,0.48))]" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] tracking-[0.4em] text-primary/90 uppercase">
          Signal lost
        </p>
        <h1 className="font-display text-glow mt-5 text-8xl font-semibold text-foreground">
          404
        </h1>
        <p className="font-display mt-2 text-2xl italic text-primary/90">
          Empty coordinates
        </p>
        <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
          찾으시는 좌표에는 은하가 없습니다. 배경의 솜브레로 은하는 지금도 그 자리에서
          천천히 돌고 있습니다.
        </p>
        <Button className="mt-8 gap-2" onClick={() => navigate("/")}>
          <ArrowLeft className="size-4" />
          관측실로 돌아가기
        </Button>
      </div>
    </motion.div>
  );
}
