import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { hashPassword, verifyPassword, looksHashed } from "@/lib/password";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const videohubId = typeof body?.videohubId === "string" ? body.videohubId.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!videohubId || !password) {
    return NextResponse.json(
      { error: "Enter your VideoHub ID and password." },
      { status: 400 }
    );
  }

  // 1. Single master admin account, defined by environment variables
  //    (no admins table — see ADMIN_VIDEOHUB_ID / ADMIN_PASSWORD_HASH).
  const adminId = process.env.ADMIN_VIDEOHUB_ID;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (adminId && adminHash && videohubId === adminId) {
    const ok = await verifyPassword(password, adminHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect VideoHub ID or password." }, { status: 401 });
    }

    const token = await createSessionToken({ role: "admin", loginId: adminId });
    const res = NextResponse.json({ role: "admin", redirect: "/admin" });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  }

  // 2. Client (company) login.
  const db = supabaseAdmin();
  const { data: company } = await db
    .from("visionhub_companies")
    .select("slug, name, login, password, password_hash")
    .eq("login", videohubId)
    .maybeSingle();

  if (!company) {
    return NextResponse.json({ error: "Incorrect VideoHub ID or password." }, { status: 401 });
  }

  const ok = await checkAndMaybeMigrate(company, password, async (newHash) => {
    await db
      .from("visionhub_companies")
      .update({ password_hash: newHash, password: null })
      .eq("slug", company.slug);
  });

  if (!ok) {
    return NextResponse.json({ error: "Incorrect VideoHub ID or password." }, { status: 401 });
  }

  const token = await createSessionToken({
    role: "client",
    companySlug: company.slug,
    companyName: company.name,
    loginId: company.login,
  });

  const res = NextResponse.json({ role: "client", redirect: "/portal" });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}

/**
 * Verifies a password against a company row that may already have a
 * bcrypt hash (normal case) or, for legacy rows, a plaintext `password`
 * column. On a successful legacy plaintext match it upgrades the row to
 * a proper hash via `migrate` and clears the plaintext column.
 */
async function checkAndMaybeMigrate(
  company: { password: string | null; password_hash: string | null },
  attempt: string,
  migrate: (newHash: string) => Promise<void>
): Promise<boolean> {
  if (company.password_hash && looksHashed(company.password_hash)) {
    return verifyPassword(attempt, company.password_hash);
  }

  if (company.password && company.password === attempt) {
    const newHash = await hashPassword(attempt);
    await migrate(newHash);
    return true;
  }
  return false;
}
