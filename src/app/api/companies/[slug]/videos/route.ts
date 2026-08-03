import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, requireClientOrAdmin, isResponse } from "@/lib/apiGuard";
import { classifyPostType } from "@/lib/postType";
import { isMissingColumn, omitKey } from "@/lib/dbCompat";

// GET: list a company's video deliveries (admin sees all; client sees only their own company).
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await requireClientOrAdmin();
  if (isResponse(session)) return session;
  if (session.role === "client" && session.companySlug !== params.slug) {
    return NextResponse.json({ error: "Not authorized for this company." }, { status: 403 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("visionhub_video_deliveries")
    // "*" so this works before the title migration is applied.
    .select("*")
    .eq("company_slug", params.slug)
    .order("video_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const videos = (data ?? []).map((v) => ({
    id: v.id,
    company_slug: v.company_slug,
    branch_name: v.branch_name,
    title: v.title ?? null,
    video_date: v.video_date,
    drive_link: v.drive_link,
    duration_seconds: Number(v.duration_seconds),
    created_at: v.created_at,
  }));

  return NextResponse.json({ videos });
}

// POST: log a new completed video delivery.
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const branchName = typeof body?.branchName === "string" ? body.branchName.trim() : "";
  const videoDate = typeof body?.videoDate === "string" ? body.videoDate : "";
  const driveLink = typeof body?.driveLink === "string" ? body.driveLink.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const durationSeconds = Number(body?.durationSeconds);

  if (!branchName || !videoDate || !driveLink || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return NextResponse.json(
      { error: "Branch, video date, delivery link, and a valid duration in seconds are required." },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();
  const payload = {
    company_slug: params.slug,
    branch_name: branchName,
    title: title || null,
    video_date: videoDate,
    drive_link: driveLink,
    duration_seconds: durationSeconds,
    post_type: classifyPostType(durationSeconds),
  };

  let { data, error } = await db
    .from("visionhub_video_deliveries")
    .insert(payload)
    .select("*")
    .single();

  // Adding deliveries must keep working before the title migration is applied.
  if (isMissingColumn(error, "title")) {
    ({ data, error } = await db
      .from("visionhub_video_deliveries")
      .insert(omitKey(payload, "title"))
      .select("*")
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ video: data }, { status: 201 });
}
