"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  login: string;
  branches: string[];
}

interface VideoRow {
  id: number;
  branch_name: string;
  video_date: string;
  duration_seconds: number;
}

export default function ReceiptPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [videos, setVideos] = useState<VideoRow[] | null>(null);
  const [month, setMonth] = useState(() => {
    const fromQuery = searchParams.get("month");
    if (fromQuery) return fromQuery;
    const now = currentMonthKey();
    return now < TRACKING_START ? TRACKING_START : now;
  });

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
    () =>
      (videos ?? [])
        .filter((v) => monthKey(v.video_date) === month)
        .sort((a, b) => (a.video_date < b.video_date ? -1 : 1)),
    [videos, month]
  );

  const totalSeconds = useMemo(
    () => monthVideos.reduce((sum, v) => sum + v.duration_seconds, 0),
    [monthVideos]
  );
  const billing = aggregateBilling(totalSeconds);

  const generatedOn = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    []
  );

  if (!company || !month) {
    return <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-ink-400">Loading receipt…</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-10 print:py-6">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/admin/companies/${slug}`} className="vh-btn-secondary">
          ← Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <MonthPicker months={availableMonths} value={month} onChange={setMonth} />
          <button className="vh-btn-primary" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="rounded-xl2 border border-ink-100 bg-white p-8 shadow-card print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-ink-100 pb-6">
          <div>
            <p className="font-display text-xl font-semibold text-ink-900">Uslu Digital</p>
            <p className="text-sm text-ink-500">Video Delivery Receipt</p>
          </div>
          <div className="text-right text-sm text-ink-500">
            <p>Generated {generatedOn}</p>
            <p>{monthLabel(month)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Client company</p>
            <p className="text-lg font-semibold text-ink-900">{company.name}</p>
            <p className="text-xs text-ink-400">Login ID: {company.login}</p>
          </div>
        </div>

        {monthVideos.length === 0 ? (
          <p className="mt-8 text-sm text-ink-400">No deliveries logged for {monthLabel(month)}.</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-lg border border-ink-100 print:overflow-visible print:rounded-none print:border-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500 print:bg-transparent">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Branch</th>
                  <th className="px-3 py-2">Post</th>
                  <th className="px-3 py-2 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {monthVideos.map((v) => (
                  <tr key={v.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-ink-700">{formatDate(v.video_date)}</td>
                    <td className="px-3 py-2 text-ink-700">{v.branch_name}</td>
                    <td className="px-3 py-2 text-ink-700">Post</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-700">{v.duration_seconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Post Done</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{monthVideos.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Amount</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{totalSeconds}s</p>
          </div>
          <div className="rounded-lg border border-gold-300 bg-gold-50 px-3 py-2 print:border-ink-900 print:bg-transparent">
            <p className="text-xs uppercase tracking-wide text-gold-800 print:text-ink-500">
              Full 15s blocks billed
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-gold-900 print:text-ink-900">
              {billing.blocks}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Left over</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{billing.leftover}s</p>
          </div>
        </div>

        <p className="mt-6 text-xs text-ink-400">
          Billing is calculated on the total seconds delivered this month, pooled together — not per
          video. {totalSeconds}s total = {billing.blocks} full 15-second block
          {billing.blocks === 1 ? "" : "s"} ({billing.blocks * 15}s) with {billing.leftover}s left over,
          unbilled.
        </p>
      </div>
    </main>
  );
}
