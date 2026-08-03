import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, requireClientOrAdmin, isResponse } from "@/lib/apiGuard";

// GET: single company detail (used by both the company admin dashboard and the client portal).
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await requireClientOrAdmin();
  if (isResponse(session)) return session;
  if (session.role === "client" && session.companySlug !== params.slug) {
    return NextResponse.json({ error: "Not authorized for this company." }, { status: 403 });
  }

  const db = supabaseAdmin();
  const { data: company, error } = await db
    .from("visionhub_companies")
    .select("slug, name, description, login, branches, color, color_name, created_at")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  return NextResponse.json({ company: { ...company, branches: company.branches ?? [] } });
}

// DELETE: remove a company (and cascade its branches + video deliveries).
export async function DELETE(_req: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const db = supabaseAdmin();
  const { error } = await db.from("visionhub_companies").delete().eq("slug", params.slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
