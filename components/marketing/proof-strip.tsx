import { Container } from "@/components/ui/container";

const PROOFS = [
  {
    title: "Flat pricing, no per-user fees",
    body: "Jobber and Housecall Pro charge per seat as you grow. TidyPro plans include your whole crew.",
  },
  {
    title: "Quote follow-up built in",
    body: "Most platforms make you chase quotes by hand or pay for add-ons. TidyPro follows up automatically.",
  },
  {
    title: "Made for cleaners, not plumbers",
    body: "Generalist tools force per-job workflows onto recurring maid routes. TidyPro is cleaning-first.",
  },
  {
    title: "Everything included",
    body: "No $79/mo marketing add-ons or gated essentials. Every plan gets the full toolkit.",
  },
];

/** Why TidyPro beats the big platforms — proof points below the hero. */
export function ProofStrip() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      <Container>
        <div className="grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {PROOFS.map((item) => (
            <div key={item.title}>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-700 dark:bg-green-950 dark:text-green-400"
                  aria-hidden="true"
                >
                  ✓
                </span>
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
