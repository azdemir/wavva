import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { LogoMark } from "@/components/ui/logo";
import { CheckIcon, MinusIcon, PartialIcon } from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";

export type CompareRow = { feature: string; us: string; them: string };

/**
 * The registry stores yes/no/partial. A green tick reads as "good for you"
 * in BOTH columns, so traits where a tick would be an accusation (a steep
 * learning curve, essentials locked behind add-ons) are stored as `no` on the
 * TidyPro side and render identically — the feature label carries the meaning.
 */
function Verdict({ value }: { value: string }) {
  if (value === "yes") {
    return (
      <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-400">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === "partial") {
    return <PartialIcon className="mx-auto h-5 w-5 text-ink-3" />;
  }
  return (
    <span className="mx-auto flex items-center justify-center">
      <MinusIcon className="h-5 w-5 text-line-strong" />
      <span className="sr-only">No</span>
    </span>
  );
}

/**
 * The section that actually wins the deal: an honest, specific side-by-side
 * against the per-seat platforms most cleaning businesses try first.
 */
export async function CompareBand() {
  const [eyebrow, title, description, rows] = await Promise.all([
    getContent<string>("home.compare.eyebrow"),
    getContent<string>("home.compare.title"),
    getContent<string>("home.compare.description"),
    getContent<CompareRow[]>("home.compare.rows"),
  ]);

  if (!rows || rows.length === 0) return null;

  return (
    <section className="bg-surface py-24 sm:py-28 lg:py-32">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </Reveal>

        <Reveal
          delay={90}
          className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl bg-surface shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]"
        >
          {/* Header ------------------------------------------------------- */}
          <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-end border-b border-line bg-surface-2 sm:grid-cols-[1fr_9rem_9rem]">
            <div className="px-5 py-5 sm:px-7">
              <p className="text-sm font-medium text-ink-3">What matters</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-2 pb-4 text-center">
              <LogoMark className="h-6 w-6" />
              <span className="text-xs font-semibold text-ink">TidyPro</span>
            </div>
            <div className="flex flex-col items-center px-2 pb-4 text-center">
              <span className="text-xs font-semibold text-ink-3">
                Big platforms
              </span>
            </div>
          </div>

          {/* Rows --------------------------------------------------------- */}
          <ul>
            {rows.map((row, i) => (
              <li
                key={row.feature}
                className={`grid grid-cols-[1fr_5.5rem_5.5rem] items-center px-5 py-4 transition-colors hover:bg-surface-2 sm:grid-cols-[1fr_9rem_9rem] sm:px-7 ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <span className="pr-4 text-sm leading-snug font-medium text-pretty text-ink">
                  {row.feature}
                </span>
                <span className="flex justify-center">
                  <Verdict value={row.us} />
                </span>
                <span className="flex justify-center">
                  <Verdict value={row.them} />
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}