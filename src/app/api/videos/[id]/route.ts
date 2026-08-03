import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, isResponse } from "@/lib/apiGuard";
import { classifyPostType } from "@/lib/postType";
import { isMissingColumn, omitKey } from "@/lib/dbCompat";

// PATCH: correct a delivery that was logged with the wrong title, section,
// date, link, or duration. Only the fields sent are changed.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("visionhub_video_deliveries")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Delivery not found." }, { status: 404 });

  const update: Record<string, unknown> = {};

  if (typeof body?.title === "string") {
    update.title = body.title.trim() || null;
  }

  if (typeof body?.branchName === "string") {
    const branchName = body.branchName.trim();
    if (!branchName) {
      return NextResponse.json({ error: "Branch cannot be empty." }, { status: 400 });
    }
    update.branch_name = branchName;
  }

  if (typeof body?.videoDate === "string" && body.videoDate) {
    update.video_date = body.videoDate;
  }

  if (typeof body?.driveLink === "string") {
    const driveLink = body.driveLink.trim();
    if (!driveLink) {
      return NextResponse.json({ error: "Delivery link cannot be empty." }, { status: 400 });
    }
    update.drive_link = driveLink;
  }

  if (body?.durationSeconds !== undefined && body?.durationSeconds !== null && body?.durationSeconds !== "") {
    const duration = Number(body.durationSeconds);
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: "Enter a valid duration in seconds." }, { status: 400 });
    }
    update.duration_seconds = Math.round(duration);
    // Kept in step with the duration for the legacy post_type column.
    update.post_type = classifyPostType(duration);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  let { data, error } = await db
    .from("visionhub_video_deliveries")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .single();

  // Works with or without the title migration applied.
  if (isMissingColumn(error, "title")) {
    ({ data, error } = await db
      .from("visionhub_video_deliveries")
      .update(omitKey(update, "title"))
      .eq("id", params.id)
      .select("*")
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ video: data });
}

// DELETE: remove a single video delivery link.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (isResponse(session)) return session;

  const db = supabaseAdmin();
  const { error } = await db.from("visionhub_video_deliveries").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
