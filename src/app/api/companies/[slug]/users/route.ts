import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isResponse } from "@/lib/apiGuard";
import { hashPassword } from "@/lib/password";

// GET: list the people who can sign in for this company (owners + workers).
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("visionhub_company_users")
    .select("id, company_slug, name, login, role, created_at")
    .eq("company_slug", params.slug)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

// POST: give another person their own VideoHub ID for this company.
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role === "owner" ? "owner" : "worker";

  if (!name || !login || !password) {
    return NextResponse.json(
      { error: "Name, VideoHub ID, and password are all required." },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();

  const { data: company } = await db
    .from("visionhub_companies")
    .select("slug, login")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  // A VideoHub ID must be unique across company logins and user logins alike,
  // otherwise sign-in would be ambiguous.
  if (company.login === login) {
    return NextResponse.json({ error: "That VideoHub ID is already used by the company login." }, { status: 400 });
  }

  const { data: clash } = await db
    .from("visionhub_companies")
    .select("slug")
    .eq("login", login)
    .maybeSingle();

  if (clash) {
    return NextResponse.json({ error: "That VideoHub ID is already taken." }, { status: 400 });
  }

  const password_hash = await hashPassword(password);

  const { data, error } = await db
    .from("visionhub_company_users")
    .insert({ company_slug: params.slug, name, login, password_hash, role })
    .select("id, company_slug, name, login, role, created_at")
    .single();

  if (error) {
    const message = error.code === "23505" ? "That VideoHub ID is already taken." : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ user: data }, { status: 201 });
}
