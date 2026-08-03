import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isResponse } from "@/lib/apiGuard";
import { hashPassword } from "@/lib/password";
import { slugify } from "@/lib/slug";
import { validatePassword } from "@/lib/passwordPolicy";

// GET: list all companies with branch/video stats, for the Companies Dashboard.
export async function GET() {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const db = supabaseAdmin();
  const { data: companies, error } = await db
    .from("visionhub_companies")
    .select("slug, name, description, login, branches, color, color_name, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: videos } = await db.from("visionhub_video_deliveries").select("id, company_slug");

  const result = (companies ?? []).map((c) => ({
    ...c,
    branches: c.branches ?? [],
    video_count: (videos ?? []).filter((v) => v.company_slug === c.slug).length,
  }));

  return NextResponse.json({ companies: result });
}

// POST: create a new company (with optional initial branches).
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const login = typeof body?.clientLoginId === "string" ? body.clientLoginId.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const branches: string[] = Array.isArray(body?.branches)
    ? body.branches.filter((b: unknown) => typeof b === "string" && b.trim()).map((b: string) => b.trim())
    : [];

  if (!name || !login || !password) {
    return NextResponse.json(
      { error: "Company name, client login ID, and password are all required." },
      { status: 400 }
    );
  }

  const weak = validatePassword(password, { login, name });
  if (weak) return NextResponse.json({ error: weak }, { status: 400 });

  const db = supabaseAdmin();
  const password_hash = await hashPassword(password);

  const baseSlug = slugify(name);
  let slug = baseSlug;
  for (let attempt = 1; attempt < 20; attempt++) {
    const { data: existing } = await db
      .from("visionhub_companies")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const { data: company, error } = await db
    .from("visionhub_companies")
    .insert({ slug, name, login, password_hash, branches })
    .select("slug, name, description, login, branches, color, color_name, created_at")
    .single();

  if (error) {
    const message = error.code === "23505" ? "That client login ID is already taken." : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ company }, { status: 201 });
}
