/**
 * Schema-drift fallback helper.
 *
 * When the database is behind on migrations, PostgREST rejects queries that
 * mention the missing column with:
 *
 *   "Could not find the 'customer_type' column of 'customers' in the schema cache"
 *   (code PGRST204)
 *
 * Instead of hard-failing the whole page, callers use `missingColumnName()`
 * to detect this specific case and retry without the new column. The app
 * keeps working (minus the not-yet-migrated field) and the UI shows a setup
 * notice pointing at the migration to run.
 */
export function missingColumnName(error: unknown): string | null {
  const message =
    (error as { message?: string } | null)?.message ?? "";
  const m = message.match(
    /Could not find the '([^']+)' column of '([^']+)' in the schema cache/
  );
  return m ? m[1] : null;
}
