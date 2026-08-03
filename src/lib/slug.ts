/** Turns a company name into a URL/ID-safe slug, e.g. "Ashley Group" -> "ashley-group". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64) || "company";
}
