import {
  IconClock,
  IconLayoutNavbarCollapse,
  IconStopwatch,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

/** One button in the dock. `active` marks the view that is on screen. */
export type DockItem = {
  title: string;
  icon: ReactNode;
  href: string;
  active?: boolean;
};

/** The two faces of the app — the dial we open on, and the countdown beside it. */
const APP_ITEMS: DockItem[] = [
  {
    title: "Clock face",
    href: "/",
    icon: <IconClock className="h-full w-full" strokeWidth={1.6} />,
  },
  {
    title: "Timer",
    href: "/timer",
    icon: <IconStopwatch className="h-full w-full" strokeWidth={1.6} />,
  },
];

/** Bottom-of-screen dock shared by every view it navigates between. */
export function AppDock() {
  const { pathname } = useLocation();
  const items = APP_ITEMS.map((item) => ({
    ...item,
    active: item.href === pathname,
  }));
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center px-4 sm:bottom-6">
      <FloatingDock items={items} />
    </div>
  );
}

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: DockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const circleClass = (active?: boolean) =>
  cn(
    "flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition-colors",
    active
      ? "border-primary/50 bg-primary/20 text-primary"
      : "border-border bg-card/70 text-foreground/70 hover:bg-card",
  );

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn("pointer-events-auto relative block md:hidden", className)}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col items-center gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: { delay: idx * 0.05 },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <Link
                  to={item.href}
                  onClick={() => setOpen(false)}
                  aria-label={item.title}
                  aria-current={item.active ? "page" : undefined}
                  className={circleClass(item.active)}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="두 버튼 펼치기"
        className={circleClass(false)}
      >
        <IconLayoutNavbarCollapse className="h-5 w-5" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "pointer-events-auto panel-space mx-auto hidden h-16 items-end gap-4 rounded-2xl px-4 pb-3 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.9)] md:flex",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  active,
}: {
  mouseX: MotionValue<number>;
  title: string;
  icon: ReactNode;
  href: string;
  active?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const widthTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={href}
      aria-label={title}
      aria-current={active ? "page" : undefined}
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full border backdrop-blur transition-colors",
          active
            ? "border-primary/50 bg-primary/20"
            : "border-border bg-card/70 hover:bg-card",
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border border-border bg-popover/95 px-2 py-0.5 text-xs whitespace-pre text-foreground backdrop-blur"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className={cn(
            "flex items-center justify-center",
            active ? "text-primary" : "text-foreground/70",
          )}
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
