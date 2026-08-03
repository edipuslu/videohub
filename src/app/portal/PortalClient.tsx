"use client";

import { apiFetch } from "@/lib/api";
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
  title: string | null;
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
        apiFetch(`/api/companies/${slug}`),
        apiFetch(`/api/companies/${slug}/videos`),
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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">{companyName}</h1>
            <p className="mt-1 text-sm font-bold text-black/40">
              Your completed AI video deliveries from Uslu Digital.
            </p>
          </div>

          <MonthPicker months={availableMonths} value={month} onChange={setMonth} />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Videos delivered" value={monthVideos.length} hint={monthLabel(month)} accent />
          <StatCard label="Total seconds" value={totalSeconds} />
          <StatCard label="Billable blocks (15s)" value={billing.blocks} />
        </div>

        {company && company.branches.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-1.5">
            <button
              onClick={() => setBranchFilter("all")}
              className={`vh-tab ${
                branchFilter === "all" ? "vh-tab-active" : "border-2 border-vh-line bg-white"
              }`}
            >
              All branches
            </button>
            {company.branches.map((b) => (
              <button
                key={b}
                onClick={() => setBranchFilter(b)}
                className={`vh-tab ${
                  branchFilter === b ? "vh-tab-active" : "border-2 border-vh-line bg-white"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        <div className="mt-7">
          {videos === null && <p className="text-sm font-bold text-black/35">Loading your deliveries…</p>}

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
                  <div className="bg-vh-blue px-5 py-4">
                    <p className="text-[11px] font-black uppercase tracking-wide text-white/50">
                      {v.branch_name}
                    </p>
                    <p className="mt-0.5 text-base font-black leading-tight text-white">
                      {v.title || "Video delivery"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/50">{formatDate(v.video_date)}</p>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wide text-black/40">
                        Duration
                      </span>
                      <span className="rounded-full bg-vh-lime px-3 py-1 text-sm font-black tabular-nums text-black">
                        {v.duration_seconds}s
                      </span>
                    </div>

                    <a
                      href={v.drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vh-btn-primary mt-6 w-full"
                    >
                      Open video →
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
