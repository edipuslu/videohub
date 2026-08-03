import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A VideoHub ID identifies exactly one account across the whole system, so it
 * has to be unique across admins, company logins, and company users alike —
 * otherwise sign-in would be ambiguous.
 *
 * Pass `exclude` to ignore the record being edited.
 */
export async function findLoginConflict(
  db: SupabaseClient,
  login: string,
  exclude?: { adminId?: number; companySlug?: string; userId?: number }
): Promise<string | null> {
  const { data: admin } = await db
    .from("visionhub_admins")
    .select("id")
    .eq("login", login)
    .maybeSingle();
  if (admin && admin.id !== exclude?.adminId) return "That VideoHub ID is already used by an admin account.";

  const { data: company } = await db
    .from("visionhub_companies")
    .select("slug")
    .eq("login", login)
    .maybeSingle();
  if (company && company.slug !== exclude?.companySlug) {
    return "That VideoHub ID is already used by a company login.";
  }

  const { data: user } = await db
    .from("visionhub_company_users")
    .select("id")
    .eq("login", login)
    .maybeSingle();
  if (user && user.id !== exclude?.userId) return "That VideoHub ID is already used by another person.";

  return null;
}
