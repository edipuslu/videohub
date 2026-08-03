import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isResponse } from "@/lib/apiGuard";

// DELETE: revoke a person's access to their company.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const db = supabaseAdmin();
  const { error } = await db.from("visionhub_company_users").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
