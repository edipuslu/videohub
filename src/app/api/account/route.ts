import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isResponse } from "@/lib/apiGuard";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { findLoginConflict } from "@/lib/logins";

/** The signed-in admin, whether they came from the database or the env bootstrap. */
async function currentAdmin(loginId: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("visionhub_admins")
    .select("id, login, name, password_hash")
    .eq("login", loginId)
    .maybeSingle();

  if (data) return { source: "database" as const, ...data };

  if (process.env.ADMIN_VIDEOHUB_ID === loginId && process.env.ADMIN_PASSWORD_HASH) {
    return {
      source: "environment" as const,
      id: null,
      login: loginId,
      name: null,
      password_hash: process.env.ADMIN_PASSWORD_HASH,
    };
  }
  return null;
}

// GET: who am I signed in as?
export async function GET() {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const admin = await currentAdmin(session.loginId);
  if (!admin) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });

  return NextResponse.json({
    account: { login: admin.login, name: admin.name, source: admin.source },
  });
}

// PATCH: change the admin's own name, VideoHub ID, and/or password.
// The current password is always required — this is the account that can see
// and delete every company.
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  const admin = await currentAdmin(session.loginId);
  if (!admin) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });

  if (!currentPassword || !(await verifyPassword(currentPassword, admin.password_hash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const db = supabaseAdmin();

  const nextLogin =
    typeof body?.login === "string" && body.login.trim() ? body.login.trim() : admin.login;
  const nextName =
    typeof body?.name === "string" ? body.name.trim() || null : admin.name;
  const newPassword = typeof body?.password === "string" && body.password ? body.password : null;

  if (nextLogin !== admin.login) {
    const conflict = await findLoginConflict(db, nextLogin, {
      adminId: admin.id ?? undefined,
    });
    if (conflict) return NextResponse.json({ error: conflict }, { status: 400 });
  }

  const password_hash = newPassword ? await hashPassword(newPassword) : admin.password_hash;

  // Editing an environment-backed admin promotes it into the database, which
  // also retires the env credentials (they only work while no admin row exists).
  if (admin.source === "environment") {
    const { error } = await db
      .from("visionhub_admins")
      .insert({ login: nextLogin, name: nextName, password_hash });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { error } = await db
      .from("visionhub_admins")
      .update({ login: nextLogin, name: nextName, password_hash, updated_at: new Date().toISOString() })
      .eq("id", admin.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Re-issue the session so a changed ID doesn't invalidate the current one.
  const token = await createSessionToken({
    role: "admin",
    loginId: nextLogin,
    userName: nextName ?? undefined,
  });

  const res = NextResponse.json({
    account: { login: nextLogin, name: nextName, source: "database" },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
