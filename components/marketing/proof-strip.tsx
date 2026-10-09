import { Container } from "@/components/ui/container";
import { getContent } from "@/lib/studio/content";

export type Proof = { title: string; body: string };

/** Why TidyPro beats the big platforms — proof points below the hero. */
export async function ProofStrip() {
  const proofs = await getContent<Proof[]>("home.proofs");
  return (
    <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      <Container>
        <div className="grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {proofs.map((item) => (
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
