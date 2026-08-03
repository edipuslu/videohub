import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isResponse } from "@/lib/apiGuard";
import { calculateMonthCharge } from "@/lib/billing";
import { monthKey } from "@/lib/postType";

/**
 * Monthly billing, admin only. Clients never see any of this.
 *
 * Amounts are always recomputed from the deliveries actually logged for the
 * month, so adding or deleting a video keeps the bill honest. A saved row
 * records the rate used and whether it has been paid.
 */

// GET /api/payments?month=YYYY-MM[&company=slug] — charges for that month.
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const url = new URL(req.url);
  const month = url.searchParams.get("month") ?? "";
  const companyFilter = url.searchParams.get("company");

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "A month like 2026-08 is required." }, { status: 400 });
  }

  const db = supabaseAdmin();

  let companiesQuery = db.from("visionhub_companies").select("*").order("name", { ascending: true });
  if (companyFilter) companiesQuery = companiesQuery.eq("slug", companyFilter);

  let paymentsQuery = db.from("visionhub_payments").select("*").eq("month", month);
  if (companyFilter) paymentsQuery = paymentsQuery.eq("company_slug", companyFilter);

  const [{ data: companies, error: companiesError }, { data: videos }, { data: payments }] =
    await Promise.all([
      companiesQuery,
      db.from("visionhub_video_deliveries").select("company_slug, video_date, duration_seconds"),
      paymentsQuery,
    ]);

  if (companiesError) {
    return NextResponse.json({ error: companiesError.message }, { status: 500 });
  }

  const rows = (companies ?? []).map((company) => {
    const monthVideos = (videos ?? []).filter(
      (v) => v.company_slug === company.slug && monthKey(v.video_date) === month
    );
    const totalSeconds = monthVideos.reduce((sum, v) => sum + v.duration_seconds, 0);

    const saved = (payments ?? []).find((p) => p.company_slug === company.slug) ?? null;

    // A month that has been paid keeps the rate it was billed at — that's a
    // historical record. Anything not yet paid follows the company's current
    // fixed rate, so changing the price updates every outstanding month.
    const pricePerBlock =
      saved?.status === "paid"
        ? Number(saved.price_per_block ?? 0)
        : Number(company.price_per_block ?? 0);
    const charge = calculateMonthCharge(totalSeconds, pricePerBlock);

    return {
      companySlug: company.slug,
      companyName: company.name,
      videoCount: monthVideos.length,
      totalSeconds,
      ...charge,
      status: (saved?.status as "paid" | "unpaid") ?? "unpaid",
      paidAt: saved?.paid_at ?? null,
      note: saved?.note ?? null,
      saved: !!saved,
    };
  });

  return NextResponse.json({ month, rows });
}

// PATCH /api/payments — set a company's rate for the month and/or mark it paid.
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const companySlug = typeof body?.companySlug === "string" ? body.companySlug : "";
  const month = typeof body?.month === "string" ? body.month : "";

  if (!companySlug || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Company and month are required." }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: company } = await db
    .from("visionhub_companies")
    .select("*")
    .eq("slug", companySlug)
    .maybeSingle();

  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const { data: existing } = await db
    .from("visionhub_payments")
    .select("*")
    .eq("company_slug", companySlug)
    .eq("month", month)
    .maybeSingle();

  // The rate is the company's fixed price, unless this month is already paid
  // (then it keeps the rate it was billed at).
  const rawPrice = body?.pricePerBlock;
  const pricePerBlock =
    rawPrice === undefined || rawPrice === null || rawPrice === ""
      ? existing?.status === "paid"
        ? Number(existing.price_per_block ?? 0)
        : Number(company.price_per_block ?? 0)
      : Number(rawPrice);

  if (!Number.isFinite(pricePerBlock) || pricePerBlock < 0) {
    return NextResponse.json({ error: "Enter a valid price per 15s block." }, { status: 400 });
  }

  const status = body?.status === "paid" ? "paid" : body?.status === "unpaid" ? "unpaid" : undefined;

  // Recompute from the deliveries themselves — never trust an amount from the client.
  const { data: videos } = await db
    .from("visionhub_video_deliveries")
    .select("video_date, duration_seconds")
    .eq("company_slug", companySlug);

  const totalSeconds = (videos ?? [])
    .filter((v) => monthKey(v.video_date) === month)
    .reduce((sum, v) => sum + v.duration_seconds, 0);

  const charge = calculateMonthCharge(totalSeconds, pricePerBlock);
  const nextStatus = status ?? (existing?.status as "paid" | "unpaid") ?? "unpaid";

  const row = {
    company_slug: companySlug,
    month,
    price_per_block: charge.pricePerBlock,
    blocks: charge.blocks,
    leftover_seconds: charge.leftoverSeconds,
    blocks_amount: charge.blocksAmount,
    leftover_amount: charge.leftoverAmount,
    total: charge.total,
    status: nextStatus,
    paid_at: nextStatus === "paid" ? existing?.paid_at ?? new Date().toISOString() : null,
    note: typeof body?.note === "string" ? body.note : existing?.note ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("visionhub_payments")
    .upsert(row, { onConflict: "company_slug,month" })
    .select("*")
    .single();

  if (error) {
    // The payments table arrives with migration 005; say so plainly rather
    // than surfacing a raw PostgREST message.
    const missingTable =
      error.code === "PGRST205" || (error.message ?? "").includes("visionhub_payments");
    return NextResponse.json(
      {
        error: missingTable
          ? "Payments aren't set up yet — run the payments migration in Supabase first."
          : error.message,
      },
      { status: 400 }
    );
  }

  // Remember the rate on the company so next month defaults to it.
  if (rawPrice !== undefined && rawPrice !== null && rawPrice !== "") {
    await db
      .from("visionhub_companies")
      .update({ price_per_block: charge.pricePerBlock })
      .eq("slug", companySlug);
  }

  return NextResponse.json({ payment: data });
}
