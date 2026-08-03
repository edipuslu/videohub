import type { PostType } from "./types";

/**
 * Classifies a delivered video's post type from its duration:
 * 15 seconds or less -> "1 post", anything longer -> "mega post".
 */
export function classifyPostType(durationSeconds: number): PostType {
  return durationSeconds <= 15 ? "1 post" : "mega post";
}

export function monthKey(dateIso: string): string {
  // dateIso like 2026-07-14 -> "2026-07"
  return dateIso.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Short month name only, e.g. "Jul" — used for compact month-picker pills. */
export function monthShortLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}

/** Human-friendly date for display, e.g. "Jul 14, 2026" — keep the raw ISO value for inputs/sorting. */
export function formatDate(dateIso: string): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** VideoHub tracking begins June 2026. */
export const TRACKING_START = "2026-06";

/** Builds an ascending list of month keys from tracking start through the given month (inclusive). */
export function monthRangeFrom(startKey: string, throughKey: string): string[] {
  const [sy, sm] = startKey.split("-").map(Number);
  const [ey, em] = throughKey.split("-").map(Number);
  const months: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Billing is computed on the POOLED total seconds for a period (e.g. a month), not per video —
 * summing individually-rounded-up videos over-bills. 71 total seconds -> 4 full 15s blocks
 * (60s) with 11s left over, not 6 blocks from rounding each video up separately.
 */
export function aggregateBilling(totalSeconds: number): { blocks: number; leftover: number } {
  const blocks = Math.floor(totalSeconds / 15);
  return { blocks, leftover: totalSeconds - blocks * 15 };
}

/** Month tabs to show: from tracking start through the end of next year, so the whole
 * operating year (and next year, so navigation never runs dry) is always browsable. */
export function yearOfMonthTabs(): string[] {
  const currentYear = Number(currentMonthKey().split("-")[0]);
  return monthRangeFrom(TRACKING_START, `${currentYear + 1}-12`);
}
