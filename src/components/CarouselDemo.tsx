import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type WheelEvent,
} from "react";

interface SlideData {
  title: string;
  src: string;
}

interface SlideProps {
  slide: SlideData;
  index: number;
  current: number;
  hovered: boolean;
  handleSlideClick: (index: number) => void;
}

const Slide = ({
  slide,
  index,
  current,
  hovered,
  handleSlideClick,
}: SlideProps) => {
  const slideRef = useRef<HTMLLIElement>(null);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;
      slideRef.current.style.setProperty("--x", `${xRef.current}px`);
      slideRef.current.style.setProperty("--y", `${yRef.current}px`);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleMouseMove = (event: MouseEvent) => {
    const el = slideRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const isSelected = current === index;
  // 호버 중에만 선택 블록이 선명해지고, 그 외에는 전부 투명도를 올린다
  const opacity = hovered ? (isSelected ? 1 : 0.4) : isSelected ? 0.5 : 0.2;

  const { src, title } = slide;

  return (
    <div className="[perspective:1200px] [transform-style:preserve-3d]">
      <li
        ref={slideRef}
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative mb-[1.6vmin] flex h-[14vmin] w-[22vmin] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1%] text-center text-white"
        style={{
          transform: isSelected ? "scale(1)" : "scale(0.78)",
          opacity,
          transformOrigin: "center",
          zIndex: isSelected ? 10 : 1,
          transition:
            "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="absolute inset-0 bg-[#1D1F2F] transition-transform duration-150 ease-out"
          style={{
            transform: isSelected
              ? "translate3d(calc(var(--x, 0px) / 30), calc(var(--y, 0px) / 30), 0)"
              : "none",
          }}
        >
          <img
            className="absolute inset-0 h-full w-full object-cover"
            alt={title}
            src={src}
            loading="eager"
            decoding="sync"
          />
          {isSelected && (
            <div className="absolute inset-0 bg-black/30 transition-all duration-1000" />
          )}
        </div>

        <article
          className={`relative p-[1.5vmin] transition-opacity duration-1000 ease-in-out ${
            isSelected ? "visible opacity-100" : "invisible opacity-0"
          }`}
        >
          <h2 className="relative text-xs font-semibold md:text-sm">{title}</h2>
        </article>
      </li>
    </div>
  );
};

interface CarouselProps {
  slides: SlideData[];
  onSlideSelect?: (index: number) => void;
}

const Carousel = ({ slides, onSlideSelect }: CarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const wheelAcc = useRef(0);
  const wheelLock = useRef(0);

  const notify = (index: number) => {
    onSlideSelect?.(index);
  };

  const handleSlideClick = (index: number) => {
    if (current !== index) {
      setCurrent(index);
      notify(index);
    }
  };

  // 화살표 없음 — 스크롤이 누적 임계값을 넘길 때마다 한 칸씩 전환한다
  const handleWheel = (event: WheelEvent) => {
    const now = Date.now();
    if (now < wheelLock.current) return;
    const delta =
      Math.abs(event.deltaY) >= Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
    wheelAcc.current += delta;
    if (Math.abs(wheelAcc.current) < 24) return;
    const dir = wheelAcc.current > 0 ? 1 : -1;
    const next = current + dir;
    if (next < 0 || next >= slides.length) {
      wheelAcc.current = 0;
      wheelLock.current = now + 350;
      return;
    }
    setCurrent(next);
    notify(next);
    wheelAcc.current = 0;
    wheelLock.current = now + 350;
  };

  return (
    <div
      className="relative h-[14vmin] w-[22vmin]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onWheel={handleWheel}
    >
      <ul
        aria-label="Slides"
        className="absolute top-0 left-0 flex flex-col transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translateY(-${current * (100 / slides.length)}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <Slide
            key={index}
            slide={slide}
            index={index}
            current={current}
            hovered={hovered}
            handleSlideClick={handleSlideClick}
          />
        ))}
      </ul>
    </div>
  );
};

export default function CarouselDemo({
  onSlideSelect,
}: {
  onSlideSelect?: (index: number) => void;
} = {}) {
  const sombreroSrc =
    typeof import.meta !== "undefined" && import.meta?.url
      ? new URL("@/assets/sombrero-galaxy.jpg", import.meta.url).href
      : "/assets/sombrero-galaxy.jpg";

  const oceanWaveSrc =
    typeof import.meta !== "undefined" && import.meta?.url
      ? new URL("/assets/ocean-wave.jpg", import.meta.url).href
      : "/assets/ocean-wave.jpg";

  const slideData: SlideData[] = [
    {
      title: "Sombrero Galaxy",
      src: sombreroSrc,
    },
    {
      title: "Ocean wave",
      src: "https://images.unsplash.com/photo-1518710843675-2540dd79065c?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Neon Nights",
      src: "https://images.unsplash.com/photo-1590041794748-2d8eb73a571c?q=80&w=3456&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Desert Whispers",
      src: "https://images.unsplash.com/photo-1679420437432-80cfbf88986c?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  return (
    // 하단 독과는 별개로 화면 좌측 사이드에 고정 — 스크롤/클릭 전환, 배경 전환용 엘리멘트
    <div className="pointer-events-none fixed top-1/2 left-[4vmin] z-40 w-[22vmin] -translate-y-1/2">
      <div className="pointer-events-auto">
        <Carousel slides={slideData} onSlideSelect={onSlideSelect} />
      </div>
    </div>
  );
}
