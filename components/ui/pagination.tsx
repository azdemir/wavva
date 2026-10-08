import Link from "next/link";

/** Join class names, skipping falsy values. */
function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  /** 1-based current page. */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Total row count (for the "showing X of Y" label). */
  total: number;
  /** Page size used for the query. */
  pageSize: number;
  /** Base path for page links (query params are preserved). */
  basePath: string;
  /** Current search params to carry over (e.g. filters). */
  searchParams?: Record<string, string | undefined>;
  /** Query param name for the page number (default "page"). */
  pageParam?: string;
};

function pageHref(
  basePath: string,
  searchParams: Record<string, string | undefined> | undefined,
  pageParam: string,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams ?? {})) {
    if (v && k !== pageParam) params.set(k, v);
  }
  params.set(pageParam, String(page));
  return `${basePath}?${params.toString()}`;
}

/** Server-rendered pagination for dashboard list pages. */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  basePath,
  searchParams,
  pageParam = "page",
}: Props) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Compact page list: 1 … p-1 p p+1 … N
  const items: (number | "…")[] = [];
  const push = (v: number | "…") => {
    if (items[items.length - 1] !== v) items.push(v);
  };
  for (const p of [1, page - 1, page, page + 1, totalPages]) {
    if (p < 1 || p > totalPages) continue;
    if (items.length && typeof items[items.length - 1] === "number") {
      const last = items[items.length - 1] as number;
      if (p - last > 1) push("…");
    }
    push(p);
  }

  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row"
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={pageHref(basePath, searchParams, pageParam, page - 1)}
          aria-label="Previous page"
          aria-disabled={page <= 1}
          className={cx(
            btn,
            "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
            page <= 1 && "pointer-events-none opacity-40",
          )}
        >
          ‹
        </Link>
        {items.map((p, i) =>
          p === "…" ? (
            <span
              key={`e${i}`}
              className="px-1 text-sm text-slate-400"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={pageHref(basePath, searchParams, pageParam, p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cx(
                btn,
                p === page
                  ? "bg-brand-600 text-white dark:bg-brand-500"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {p}
            </Link>
          ),
        )}
        <Link
          href={pageHref(basePath, searchParams, pageParam, page + 1)}
          aria-label="Next page"
          aria-disabled={page >= totalPages}
          className={cx(
            btn,
            "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
            page >= totalPages && "pointer-events-none opacity-40",
          )}
        >
          ›
        </Link>
      </div>
    </nav>
  );
}
