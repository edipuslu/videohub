import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, requireClientOrAdmin, isResponse } from "@/lib/apiGuard";
import { hashPassword } from "@/lib/password";
import { findLoginConflict } from "@/lib/logins";
import { validatePassword } from "@/lib/passwordPolicy";
import { encryptSecret, decryptSecret, isMissingVaultColumn, withoutVault } from "@/lib/vault";

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
    // "*" so this still works before the password_vault migration is applied.
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  return NextResponse.json({
    company: {
      slug: company.slug,
      name: company.name,
      description: company.description,
      login: company.login,
      branches: company.branches ?? [],
      color: company.color,
      color_name: company.color_name,
      created_at: company.created_at,
      // Clients must never receive either of these — only the Uslu Digital admin.
      ...(session.role === "admin"
        ? {
            password: decryptSecret(company.password_vault),
            pricePerBlock: company.price_per_block == null ? null : Number(company.price_per_block),
          }
        : {}),
    },
  });
}

// PATCH: edit the company's display name, its shared login ID, and/or its password.
export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("visionhub_companies")
    .select("slug, login")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const update: Record<string, unknown> = {};

  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Company name cannot be empty." }, { status: 400 });
    update.name = name;
  }

  if (typeof body?.login === "string") {
    const login = body.login.trim();
    if (!login) return NextResponse.json({ error: "Client login ID cannot be empty." }, { status: 400 });
    if (login !== existing.login) {
      const conflict = await findLoginConflict(db, login, { companySlug: params.slug });
      if (conflict) return NextResponse.json({ error: conflict }, { status: 400 });
    }
    update.login = login;
  }

  // The rate per 15s block is fixed per company and reused every month, so it
  // lives here rather than being re-entered on each monthly bill.
  if (body?.pricePerBlock !== undefined && body?.pricePerBlock !== null && body?.pricePerBlock !== "") {
    const price = Number(body.pricePerBlock);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Enter a valid price per 15s block." }, { status: 400 });
    }
    update.price_per_block = price;
  }

  if (typeof body?.password === "string" && body.password.length > 0) {
    const weak = validatePassword(body.password, {
      login: (update.login as string) ?? existing.login,
      name: update.name as string | undefined,
    });
    if (weak) return NextResponse.json({ error: weak }, { status: 400 });
    update.password_hash = await hashPassword(body.password);
    update.password_vault = encryptSecret(body.password);
    update.password = null; // clear any legacy plaintext
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const columns = "slug, name, description, login, branches, color, color_name, created_at";

  let { data, error } = await db
    .from("visionhub_companies")
    .update(update)
    .eq("slug", params.slug)
    .select(columns)
    .single();

  // Works with or without the password_vault migration applied.
  if (isMissingVaultColumn(error)) {
    ({ data, error } = await db
      .from("visionhub_companies")
      .update(withoutVault(update))
      .eq("slug", params.slug)
      .select(columns)
      .single());
  }

  if (error) {
    const message = error.code === "23505" ? "That client login ID is already taken." : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!data) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  return NextResponse.json({ company: { ...data, branches: data.branches ?? [] } });
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
