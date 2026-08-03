/**
 * Helpers for staying usable in the window between deploying code that needs a
 * new column and running the migration that adds it.
 *
 * Reads use `select("*")`, which simply returns whatever columns exist. Writes
 * use these to retry once without the new field rather than failing outright.
 */

export function isMissingColumn(
  error: { code?: string; message?: string } | null,
  column: string
): boolean {
  if (!error) return false;
  if (error.code === "PGRST204" || error.code === "42703") return true;
  return (error.message ?? "").includes(column);
}

export function omitKey<T extends Record<string, unknown>, K extends keyof T>(
  payload: T,
  key: K
): Omit<T, K> {
  const { [key]: _dropped, ...rest } = payload;
  return rest;
}
