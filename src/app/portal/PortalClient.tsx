"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { MonthPicker } from "@/components/MonthPicker";
import {
  TRACKING_START,
  aggregateBilling,
  currentMonthKey,
  formatDate,
  monthKey,
  monthLabel,
  yearOfMonthTabs,
} from "@/lib/postType";

interface CompanyDetail {
  slug: string;
  name: string;
  branches: string[];
}

interface VideoRow {
  id: number;
  branch_name: string;
  video_date: string;
  drive_link: string;
  duration_seconds: number;
}

export function PortalClient({ slug, companyName }: { slug: string; companyName: string }) {
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [videos, setVideos] = useState<VideoRow[] | null>(null);
  const [month, setMonth] = useState<string>(() => {
    const now = currentMonthKey();
    return now < TRACKING_START ? TRACKING_START : now;
  });
  const [branchFilter, setBranchFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [companyRes, videosRes] = await Promise.all([
        fetch(`/api/companies/${slug}`),
        fetch(`/api/companies/${slug}/videos`),
      ]);
      const companyData = await companyRes.json();
      const videosData = await videosRes.json();
      if (companyRes.ok) setCompany(companyData.company);
      if (videosRes.ok) setVideos(videosData.videos);
    })();
  }, [slug]);

  const availableMonths = useMemo(() => yearOfMonthTabs(), []);

  const monthVideos = useMemo(
    () => (videos ?? []).filter((v) => monthKey(v.video_date) === month),
    [videos, month]
  );

  const filteredVideos = useMemo(
    () =>
      (branchFilter === "all" ? monthVideos : monthVideos.filter((v) => v.branch_name === branchFilter)).sort(
        (a, b) => (a.video_date < b.video_date ? 1 : -1)
      ),
    [monthVideos, branchFilter]
  );

  const totalSeconds = monthVideos.reduce((sum, v) => sum + v.duration_seconds, 0);
  const billing = aggregateBilling(totalSeconds);

  return (
    <>
      <Topbar title="Delivery Portal" subtitle={companyName || "Client portal"} />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-ink-900">{companyName}</h1>
            <p className="text-sm text-ink-500">Your completed AI video deliveries from Uslu Digital.</p>
          </div>

          <MonthPicker months={availableMonths} value={month} onChange={setMonth} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Videos delivered" value={monthVideos.length} hint={monthLabel(month)} />
          <StatCard label="Total seconds" value={totalSeconds} />
          <StatCard label="Billable blocks (15s)" value={billing.blocks} />
        </div>

        {company && company.branches.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            <button
              onClick={() => setBranchFilter("all")}
              className={`vh-tab ${branchFilter === "all" ? "vh-tab-active" : "bg-white border border-ink-100"}`}
            >
              All branches
            </button>
            {company.branches.map((b) => (
              <button
                key={b}
                onClick={() => setBranchFilter(b)}
                className={`vh-tab ${branchFilter === b ? "vh-tab-active" : "bg-white border border-ink-100"}`}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          {videos === null && <p className="text-sm text-ink-400">Loading your deliveries…</p>}

          {videos !== null && filteredVideos.length === 0 && (
            <EmptyState
              title={`No deliveries yet for ${monthLabel(month)}`}
              description="Confirmed video links from Uslu Digital will appear here automatically as soon as they're delivered."
            />
          )}

          {filteredVideos.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map((v) => (
                <div key={v.id} className="vh-card vh-card-hover flex flex-col overflow-hidden">
                  <div className="border-b border-ink-100 bg-brand-50/60 px-5 py-3">
                    <p className="text-sm font-semibold text-ink-900">{v.branch_name}</p>
                    <p className="text-xs text-ink-500">{formatDate(v.video_date)}</p>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm text-ink-500">
                      Duration <span className="font-semibold tabular-nums text-ink-800">{v.duration_seconds}s</span>
                    </p>

                    <a
                      href={v.drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vh-btn-primary mt-5 w-full"
                    >
                      Open video
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
