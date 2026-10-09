import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb trail for marketing subpages. Renders a visible nav and
 * BreadcrumbList JSON-LD so Google can show breadcrumbs in results
 * instead of the raw URL.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <Fragment key={item.label}>
                {i > 0 && (
                  <li aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                    /
                  </li>
                )}
                <li>
                  {item.href && !last ? (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-10 items-center hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? "page" : undefined}
                      className="inline-flex min-h-10 items-center"
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
