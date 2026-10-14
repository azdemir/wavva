import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

/**
 * Social share image for Wavva — generated, not a static asset, so a brand or
 * copy change never leaves a stale bitmap behind.
 *
 * Geometry and colours mirror `components/ui/logo.tsx` (the W-shaped
 * waveform mark) and the `--color-sb-*` tokens in `app/globals.css`.
 */

export const alt = "Wavva — Every call answered. Every business.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Same seven-bar waveform as the LogoMark, in Wavva's violet gradient. */
function Mark({ width, height }: { width: number; height: number }) {
  const bars = [
    { x: 6, y: 14, h: 68 },
    { x: 25, y: 25, h: 46 },
    { x: 44, y: 33, h: 30 },
    { x: 63, y: 21, h: 54 },
    { x: 82, y: 33, h: 30 },
    { x: 101, y: 25, h: 46 },
    { x: 120, y: 14, h: 68 },
  ];
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 137 96"
      aria-hidden="true"
      style={{ display: "flex" }}
    >
      <defs>
        <linearGradient id="wavva-og-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b7cff" />
          <stop offset="1" stopColor="#5b3df0" />
        </linearGradient>
      </defs>
      {bars.map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={b.y}
          width={11}
          height={b.h}
          rx={5.5}
          fill="url(#wavva-og-mark)"
        />
      ))}
    </svg>
  );
}

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #ffffff 0%, #ece7ff 48%, #ffe4ec 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Mark width={62} height={44} />
          <div style={{ fontSize: 40, color: "#14142b", letterSpacing: "-0.02em" }}>
            {site.name}
          </div>
        </div>

        {/* headline + support copy, with the brand mark as a right-hand column */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 56,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 620,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 68,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "#14142b",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>Every call answered.</span>
              <span style={{ color: "#5b3df0", whiteSpace: "nowrap" }}>
                Every business.
              </span>
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 25,
                color: "#5b5b7a",
                whiteSpace: "nowrap",
              }}
            >
              The AI front office for any business that takes calls.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              justifyContent: "flex-end",
              opacity: 0.5,
            }}
          >
            <Mark width={300} height={210} />
          </div>
        </div>

        {/* footer strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #e3defc",
            paddingTop: 28,
            fontSize: 25,
            color: "#5b5b7a",
          }}
        >
          <span>Appointments booked. Quotes followed up. Invoices collected.</span>
          <span style={{ color: "#14142b" }}>$299/mo</span>
        </div>
      </div>
    ),
    { ...size }
  );
}