export type Crumb = { label: string; href?: string };

/**
 * BreadcrumbList JSON-LD for marketing subpages — invisible to visitors,
 * so Google can show breadcrumbs in search results instead of the raw URL.
 * (The visible breadcrumb trail was removed from the page hero per the
 * founder's request; this keeps the SEO benefit without the visual.)
 */
export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
