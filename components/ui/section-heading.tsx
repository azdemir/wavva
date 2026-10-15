type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

/** Consistent section header for marketing pages. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {eyebrow && (
        <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase dark:text-brand-400">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}
