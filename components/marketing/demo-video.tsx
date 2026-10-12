"use client";

import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "@/components/ui/icons";

type Props = {
  src: string;
  poster: string;
  captions: string;
  duration?: string;
  title: string;
};

/**
 * Click-to-play product demo.
 *
 * Deliberately does NOT autoplay: the file is ~7 MB and autoplaying it would
 * spend a visitor's bandwidth before they have decided to watch. The poster
 * frame is a fraction of that, so it paints immediately and the video only
 * downloads once someone presses play.
 *
 * Native `controls` appear once playing — they are keyboard- and
 * screen-reader-accessible for free, which a custom control bar is not.
 */
export function DemoVideo({ src, poster, captions, duration, title }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  // Swap the poster for real controls the moment playback begins.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onPlay = () => setStarted(true);
    v.addEventListener("play", onPlay);
    return () => v.removeEventListener("play", onPlay);
  }, []);

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_28px_70px_-40px_rgba(15,23,42,0.55)]">
      <video
        ref={ref}
        className="h-full w-full bg-surface object-cover"
        poster={poster}
        preload="none"
        playsInline
        controls={started}
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
        <track kind="subtitles" src={captions} srcLang="en" label="English" default />
        Your browser does not support embedded video.
      </video>

      {!started && (
        <button
          type="button"
          onClick={() => ref.current?.play()}
          className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-4 bg-surface-2/40 backdrop-blur-[2px] transition-colors hover:bg-surface-2/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          aria-label={`Play the ${title}`}
        >
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-[0_18px_50px_-20px_rgba(7,8,12,0.6)] transition-transform duration-300 group-hover:scale-105">
            {/* Soft pulse ring — purely decorative. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-white/40 motion-reduce:animate-none"
            />
            <PlayIcon className="relative ml-1 h-7 w-7 text-ink" />
          </span>
          <span className="flex flex-col items-center gap-1.5">
            <span className="text-base font-semibold text-white drop-shadow-[0_2px_10px_rgba(7,8,12,0.8)] sm:text-lg">
              Watch how TidyPro works
            </span>
            {duration && (
              <span className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white/90">
                {duration}
              </span>
            )}
          </span>
        </button>
      )}
    </div>
  );
}