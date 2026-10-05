/** Sombrero Galaxy brand mark: glowing bulge, thin brim, dark dust lane. */
export function GalaxyMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="mg-bulge" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6e4" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#f4b46a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f4b46a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mg-brim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e9a45c" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#ffd9a0" />
          <stop offset="100%" stopColor="#e9a45c" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="11" fill="url(#mg-bulge)" />
      <ellipse cx="20" cy="20" rx="18.5" ry="5.6" fill="url(#mg-brim)" />
      <ellipse cx="20" cy="21.8" rx="18.5" ry="3.9" fill="#04060d" opacity="0.7" />
      <circle cx="20" cy="20" r="3.2" fill="#fffaf0" />
    </svg>
  );
}
