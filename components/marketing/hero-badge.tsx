"use client";

/**
 * Starburst "seal" badge for the hero — a sticker-style stamp like the
 * classic "No technical skills required" seal, redrawn in TidyPro's voice:
 * warm cream seal, editorial serif type, small sparkle, slight tilt.
 * Purely decorative (the trial note already carries the message).
 */
export function HeroBadge({
  lines = ["No technical", "skills required"],
  className = "",
}: {
  lines?: [string, string];
  className?: string;
}) {
  // 18-point starburst seal
  const spikes = 18;
  const outer = 100;
  const inner = 87;
  const cx = 110;
  const cy = 110;
  let d = "";
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  d += "Z";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <div className="motion-safe:animate-hero-badge-float">
        <svg
          viewBox="0 0 220 220"
          className="h-full w-full -rotate-8 drop-shadow-[0_10px_20px_rgba(120,80,20,0.25)]"
        >
          <defs>
            <radialGradient id="hero-badge-seal" cx="42%" cy="38%" r="75%">
              <stop offset="0%" stopColor="#fbf3dd" />
              <stop offset="70%" stopColor="#f5e6c2" />
              <stop offset="100%" stopColor="#eed9a8" />
            </radialGradient>
          </defs>
          <path d={d} fill="url(#hero-badge-seal)" />
          <path
            d={d}
            fill="none"
            stroke="#d9bd82"
            strokeWidth="1.5"
            opacity="0.7"
            transform="translate(0,0) scale(0.94) translate(6.6,6.6)"
          />
          {/* sparkle */}
          <path
            d="M150 52 c1.2 7.5 3.2 9.8 12 11.4 c-8.8 1.6 -10.8 3.9 -12 11.4 c-1.2 -7.5 -3.2 -9.8 -12 -11.4 c8.8 -1.6 10.8 -3.9 12 -11.4 Z"
            fill="#ffffff"
            opacity="0.95"
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            className="fill-[#4a3b22]"
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            {lines[0]}
          </text>
          <text
            x={cx}
            y={cy + 20}
            textAnchor="middle"
            className="fill-[#4a3b22]"
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            {lines[1]}
          </text>
        </svg>
      </div>
    </div>
  );
}
