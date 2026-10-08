/**
 * Normalize a Supabase nested relation to a single object.
 * Without generated DB types the client types to-one relations as arrays;
 * this unwraps them safely.
 */
export function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}
