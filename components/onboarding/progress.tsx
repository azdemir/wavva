import { getTranslations } from "next-intl/server";

export async function OnboardingProgress({ current }: { current: number }) {
  const t = await getTranslations("onboarding");
  const steps = t.raw("progress.steps") as string[];
  return (
    <ol className="flex items-center gap-2" aria-label={t("progress.label")}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const isCurrent = n === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done
                  ? "bg-accent-600 text-white"
                  : isCurrent
                    ? "bg-brand-600 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span
              className={`hidden text-sm font-medium sm:block ${
                isCurrent ? "text-slate-900" : "text-slate-500"
              }`}
            >
              {label}
            </span>
            {n < steps.length && (
              <span aria-hidden="true" className="mx-1 hidden h-px flex-1 bg-slate-200 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
