type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** "dark" renders on the always-dark bands (CTA, footer). */
  tone?: "light" | "dark";
  className?: string;
  as?: "h2" | "h3";
};

/**
 * Consistent section header for marketing pages.
 *
 * The eyebrow is a mono micro-label with a leading rule — the kind of
 * typographic detail that separates a considered layout from a template.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  className = "",
  as: Tag = "h2",
}: SectionHeadingProps) {
  const dark = tone === "dark";
  const centered = align === "center";

  return (
    <div
      className={`${centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"} ${className}`}
    >
      {eyebrow && (
        <p
          className={`flex items-center gap-2.5 font-mono text-[11px] font-medium tracking-[0.16em] uppercase ${
            centered ? "justify-center" : ""
          } ${dark ? "text-white/55" : "text-brand-700 dark:text-brand-400"}`}
        >
          <span
            aria-hidden="true"
            className={`h-px w-6 ${dark ? "bg-white/30" : "bg-brand-500/50"}`}
          />
          {eyebrow}
        </p>
      )}
      <Tag
        className={`mt-4 font-display text-[2.125rem] leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl lg:text-[3.5rem] ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </Tag>
      {description && (
        <p
          className={`mt-5 text-lg leading-relaxed text-pretty ${
            dark ? "text-white/65" : "text-ink-2"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}