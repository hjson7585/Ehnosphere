import { IconArrowNarrowRight } from "@tabler/icons-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";

interface SlideData {
  title: string;
  button: string;
  src: string;
}

interface SlideProps {
  slide: SlideData;
  index: number;
  current: number;
  handleSlideClick: (index: number) => void;
}

const Slide = ({ slide, index, current, handleSlideClick }: SlideProps) => {
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
  const { src, button, title } = slide;

  return (
    <div className="[perspective:1200px] [transform-style:preserve-3d]">
      <li
        ref={slideRef}
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative mb-[2vmin] flex h-[20vmin] w-[30vmin] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1%] text-center text-white"
        style={{
          // 선택된 슬라이드만 원래 크기·선명함, 나머지는 줄이고 투명하게
          transform: isSelected ? "scale(1)" : "scale(0.78)",
          opacity: isSelected ? 1 : 0.4,
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
          className={`relative p-[2vmin] transition-opacity duration-1000 ease-in-out ${
            isSelected ? "visible opacity-100" : "invisible opacity-0"
          }`}
        >
          <h2 className="relative text-sm font-semibold md:text-base lg:text-lg">
            {title}
          </h2>
          <div className="flex justify-center">
            <button
              type="button"
              className="mx-auto mt-3 flex h-9 w-fit items-center justify-center rounded-2xl border border-transparent bg-white px-4 text-xs text-black shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200 hover:shadow-lg sm:text-sm"
            >
              {button}
            </button>
          </div>
        </article>
      </li>
    </div>
  );
};

interface CarouselControlProps {
  type: string;
  title: string;
  handleClick: () => void;
}

const CarouselControl = ({
  type,
  title,
  handleClick,
}: CarouselControlProps) => {
  return (
    <button
      type="button"
      className={`mx-2 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-transparent bg-neutral-200 transition duration-200 focus:border-[#6D64F7] focus:outline-none hover:-translate-y-0.5 active:translate-y-0.5 ${
        type === "previous" ? "rotate-180" : ""
      }`}
      title={title}
      aria-label={title}
      onClick={handleClick}
    >
      <IconArrowNarrowRight className="text-neutral-600" />
    </button>
  );
};

interface CarouselProps {
  slides: SlideData[];
}

const Carousel = ({ slides }: CarouselProps) => {
  const [current, setCurrent] = useState(0);

  const handlePreviousClick = () => {
    const previous = current - 1;
    setCurrent(previous < 0 ? slides.length - 1 : previous);
  };

  const handleNextClick = () => {
    const next = current + 1;
    setCurrent(next === slides.length ? 0 : next);
  };

  const handleSlideClick = (index: number) => {
    if (current !== index) {
      setCurrent(index);
    }
  };

  return (
    <div className="relative h-[20vmin] w-[30vmin]">
      {/* 세로 스택 — 슬롯 하나(20vmin + 2vmin 간격)씩 위로 밀어 올린다 */}
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
            handleSlideClick={handleSlideClick}
          />
        ))}
      </ul>

      <div className="absolute top-[calc(100%+1rem)] flex w-full justify-center">
        <CarouselControl
          type="previous"
          title="Go to previous slide"
          handleClick={handlePreviousClick}
        />
        <CarouselControl
          type="next"
          title="Go to next slide"
          handleClick={handleNextClick}
        />
      </div>
    </div>
  );
};

export default function CarouselDemo() {
  const slideData: SlideData[] = [
    {
      title: "Mystic Mountains",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1494806812796-244fe51b774d?q=80&w=3534&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Urban Dreams",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1518710843675-2540dd79065c?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Neon Nights",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1590041794748-2d8eb73a571c?q=80&w=3456&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Desert Whispers",
      button: "Explore Component",
      src: "https://images.unsplash.com/photo-1679420437432-80cfbf88986c?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  return (
    // 하단 독과는 별개로 화면 좌측 사이드에 고정 — 배경 전환용 엘리멘트
    <div className="pointer-events-none fixed top-1/2 left-[4vmin] z-40 w-[30vmin] -translate-y-1/2">
      <div className="pointer-events-auto">
        <Carousel slides={slideData} />
      </div>
    </div>
  );
}
