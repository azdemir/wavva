/**
 * Ambient light-wash used behind the hero and the closing CTA.
 *
 * Three slowly drifting colour fields plus a film grain pass. Purely
 * decorative: `aria-hidden`, `pointer-events-none`, and it never intercepts
 * layout. `animate-drift` is defined in globals.css and is automatically
 * neutralised under prefers-reduced-motion.
 */
export function Ambient({
  className = "",
  tone = "light",
}: {
  className?: string;
  /** "light" for the paper hero, "dark" for the always-dark bands. */
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <div
      aria-hidden="true"
      className={`grain pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Colour fields */}
      <div
        className={`absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-[70%] rounded-full blur-[120px] animate-drift ${
          dark
            ? "bg-brand-600/25"
            : "bg-brand-400/25 dark:bg-brand-600/20"
        }`}
      />
      <div
        className={`absolute -top-24 right-0 h-[34rem] w-[34rem] translate-x-1/3 rounded-full blur-[130px] animate-drift ${
          dark
            ? "bg-accent-500/15"
            : "bg-accent-300/25 dark:bg-accent-600/15"
        }`}
        style={{ animationDelay: "-7s" }}
      />
      <div
        className={`absolute top-1/3 -left-40 h-[30rem] w-[30rem] rounded-full blur-[140px] animate-drift ${
          dark ? "bg-brand-400/15" : "bg-brand-200/40 dark:bg-brand-800/20"
        }`}
        style={{ animationDelay: "-14s" }}
      />
    </div>
  );
}