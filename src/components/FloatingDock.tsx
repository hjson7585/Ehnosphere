import {
  IconClock,
  IconGalaxy,
  IconLayoutNavbarCollapse,
  IconStopwatch,
  IconVolume2,
  IconVolumeOff,
} from "@tabler/icons-react";
import {
  getAmbientOn,
  subscribeAmbient,
  toggleAmbient,
} from "@/lib/ambientAudio";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

/** One button in the dock. `active` marks the view that is on screen — for
 *  an action button (no href), that it is switched on. */
export type DockItem = {
  title: string;
  icon: ReactNode;
  /** 없으면 이동하지 않는 액션 버튼으로 렌더된다 (ex. 소리 ON/OFF). */
  href?: string;
  /** href 없는 버튼의 동작. */
  onClick?: () => void;
  active?: boolean;
};

/** Three ways in — the sky on its own, the dial we open on, the countdown beside it. */
const APP_ITEMS: DockItem[] = [
  {
    title: "Clean View",
    href: "/clean-view",
    icon: <IconGalaxy className="h-full w-full" strokeWidth={1.6} />,
  },
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

/** Bottom-of-screen dock shared by every view it navigates between.
 *  오른쪽 끝의 스피커는 이동이 아니라 액션 — 은하의 BGM을 켜고 끈다. */
export function AppDock() {
  const { pathname } = useLocation();
  const soundOn = useSyncExternalStore(subscribeAmbient, getAmbientOn);
  const items: DockItem[] = [
    ...APP_ITEMS.map((item) => ({ ...item, active: item.href === pathname })),
    {
      title: "Sound",
      onClick: toggleAmbient,
      active: soundOn,
      icon: soundOn ? (
        <IconVolume2 className="h-full w-full" strokeWidth={1.6} />
      ) : (
        <IconVolumeOff className="h-full w-full" strokeWidth={1.6} />
      ),
    },
  ];
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

/** The logo alone — no ring, no glass behind it. Active reads as brass. */
const iconClass = (active?: boolean) =>
  cn(
    "flex h-10 w-10 items-center justify-center transition-colors",
    active ? "text-primary" : "text-foreground/70 hover:text-foreground",
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
                {item.href ? (
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    aria-label={item.title}
                    aria-current={item.active ? "page" : undefined}
                    className={iconClass(item.active)}
                  >
                    <div className="h-5 w-5">{item.icon}</div>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      item.onClick?.();
                      setOpen(false);
                    }}
                    aria-label={item.title}
                    aria-pressed={item.active}
                    className={iconClass(item.active)}
                  >
                    <div className="h-5 w-5">{item.icon}</div>
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="네 버튼 펼치기"
        className={iconClass(false)}
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
  // Frameless: no pill, no border, no shadow — the buttons sit straight on
  // the sky, and this wrapper only exists to track the cursor across them.
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "pointer-events-auto mx-auto hidden gap-4 md:flex",
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
  onClick,
  active,
}: {
  mouseX: MotionValue<number>;
  title: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
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

  const inner = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex aspect-square items-center justify-center"
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
  );

  // 이동이 아닌 액션 버튼 (href 없음) — 소리 ON/OFF처럼
  if (!href) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={title}
        aria-pressed={active}
        className="block"
      >
        {inner}
      </button>
    );
  }
  return (
    <Link
      to={href}
      aria-label={title}
      aria-current={active ? "page" : undefined}
    >
      {inner}
    </Link>
  );
}
