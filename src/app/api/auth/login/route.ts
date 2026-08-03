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

  const db = supabaseAdmin();

  // 1. Uslu Digital admin accounts, stored in the database so the ID and
  //    password can be changed from inside the app.
  const { data: admin } = await db
    .from("visionhub_admins")
    .select("id, login, name, password_hash")
    .eq("login", videohubId)
    .maybeSingle();

  if (admin) {
    const ok = await verifyPassword(password, admin.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect VideoHub ID or password." }, { status: 401 });
    }

    const token = await createSessionToken({
      role: "admin",
      loginId: admin.login,
      userName: admin.name ?? undefined,
    });
    const res = NextResponse.json({ role: "admin", redirect: "/admin" });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  }

  // 2. Environment bootstrap. This only works while no admin row exists, so
  //    changing the password in the app genuinely retires the old one.
  const adminId = process.env.ADMIN_VIDEOHUB_ID;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (adminId && adminHash && videohubId === adminId) {
    const { count } = await db
      .from("visionhub_admins")
      .select("id", { count: "exact", head: true });

    if (!count) {
      const ok = await verifyPassword(password, adminHash);
      if (!ok) {
        return NextResponse.json({ error: "Incorrect VideoHub ID or password." }, { status: 401 });
      }

      const token = await createSessionToken({ role: "admin", loginId: adminId });
      const res = NextResponse.json({ role: "admin", redirect: "/admin" });
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      return res;
    }
  }

  // 3. Named company user (owner / worker) — each has their own VideoHub ID.
  const { data: user } = await db
    .from("visionhub_company_users")
    .select("id, company_slug, name, login, role, password_hash")
    .eq("login", videohubId)
    .maybeSingle();

  if (user) {
    const ok = user.password_hash ? await verifyPassword(password, user.password_hash) : false;
    if (!ok) {
      return NextResponse.json({ error: "Incorrect VideoHub ID or password." }, { status: 401 });
    }

    const { data: userCompany } = await db
      .from("visionhub_companies")
      .select("slug, name")
      .eq("slug", user.company_slug)
      .maybeSingle();

    if (!userCompany) {
      return NextResponse.json({ error: "This account is no longer linked to a company." }, { status: 401 });
    }

    const token = await createSessionToken({
      role: "client",
      companySlug: userCompany.slug,
      companyName: userCompany.name,
      loginId: user.login,
      userName: user.name ?? undefined,
      userRole: user.role,
    });

    const res = NextResponse.json({ role: "client", redirect: "/portal" });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  }

  // 4. Shared company login (the company's own ID/password).
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
