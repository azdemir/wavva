type HeadingProps = {
  title: string;
  description?: string;
};

/** Page heading for dashboard/workspace pages (left-aligned h1). */
export function Heading({ title, description }: HeadingProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}
