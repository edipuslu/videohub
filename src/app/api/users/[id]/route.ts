import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isResponse } from "@/lib/apiGuard";
import { hashPassword } from "@/lib/password";
import { findLoginConflict } from "@/lib/logins";

// PATCH: edit a person's name, VideoHub ID, role, and/or password.
// Only the fields present in the body are changed.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const db = supabaseAdmin();
  const id = Number(params.id);

  const { data: existing } = await db
    .from("visionhub_company_users")
    .select("id, login")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Person not found." }, { status: 404 });

  const update: Record<string, unknown> = {};

  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    update.name = name;
  }

  if (typeof body?.login === "string") {
    const login = body.login.trim();
    if (!login) return NextResponse.json({ error: "VideoHub ID cannot be empty." }, { status: 400 });
    if (login !== existing.login) {
      const conflict = await findLoginConflict(db, login, { userId: id });
      if (conflict) return NextResponse.json({ error: conflict }, { status: 400 });
    }
    update.login = login;
  }

  if (body?.role === "owner" || body?.role === "worker") {
    update.role = body.role;
  }

  if (typeof body?.password === "string" && body.password.length > 0) {
    update.password_hash = await hashPassword(body.password);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await db
    .from("visionhub_company_users")
    .update(update)
    .eq("id", id)
    .select("id, company_slug, name, login, role, created_at")
    .single();

  if (error) {
    const message = error.code === "23505" ? "That VideoHub ID is already taken." : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ user: data });
}

// DELETE: revoke a person's access to their company.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const db = supabaseAdmin();
  const { error } = await db.from("visionhub_company_users").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
