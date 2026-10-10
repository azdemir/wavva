/**
 * Dashboard loading skeleton — renders instantly while the server
 * fetches stats, jobs, and quotes. Matches the dashboard layout so
 * the page feels instant even when data takes a second.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-hidden="true">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-96 max-w-full rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-2">
                <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-3"
          >
            <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-4/6 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
