import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isResponse } from "@/lib/apiGuard";

// POST: add a branch/section to a company. Branches live as a text[] (jsonb)
// column on visionhub_companies rather than their own table.
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Branch name is required." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: company, error: fetchError } = await db
    .from("visionhub_companies")
    .select("branches")
    .eq("slug", params.slug)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const existing: string[] = company.branches ?? [];
  if (existing.some((b) => b.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "That branch already exists for this company." }, { status: 400 });
  }

  const branches = [...existing, name];
  const { data, error } = await db
    .from("visionhub_companies")
    .update({ branches })
    .eq("slug", params.slug)
    .select("branches")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ branches: data.branches }, { status: 201 });
}

// DELETE: remove a branch/section from a company. Existing video deliveries logged under this
// branch name are untouched — they keep their historical branch_name text.
export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Branch name is required." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: company, error: fetchError } = await db
    .from("visionhub_companies")
    .select("branches")
    .eq("slug", params.slug)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const branches = (company.branches ?? []).filter((b: string) => b !== name);
  const { data, error } = await db
    .from("visionhub_companies")
    .update({ branches })
    .eq("slug", params.slug)
    .select("branches")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ branches: data.branches });
}
