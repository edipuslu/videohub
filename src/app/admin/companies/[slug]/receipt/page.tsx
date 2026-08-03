"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MonthPicker } from "@/components/MonthPicker";
import { formatAmount } from "@/lib/billing";
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
  title: string | null;
  video_date: string;
  duration_seconds: number;
}

interface PaymentRow {
  pricePerBlock: number;
  blocksAmount: number;
  leftoverAmount: number;
  total: number;
  status: "paid" | "unpaid";
  saved: boolean;
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

  const [payment, setPayment] = useState<PaymentRow | null>(null);

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

  // Billing is per month, so it reloads whenever the month changes.
  useEffect(() => {
    (async () => {
      const res = await apiFetch(`/api/payments?month=${month}&company=${slug}`);
      if (!res.ok) {
        setPayment(null);
        return;
      }
      const data = await res.json();
      setPayment(data.rows?.[0] ?? null);
    })();
  }, [slug, month]);

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
    return <main className="mx-auto max-w-3xl px-6 py-10 text-sm font-bold text-black/35">Loading receipt…</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:px-10 print:py-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/companies/${slug}`} className="vh-btn-secondary">
          ← Back to dashboard
        </Link>
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
          <MonthPicker months={availableMonths} value={month} onChange={setMonth} />
          <button className="vh-btn-primary shrink-0" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border-2 border-vh-line bg-white print:rounded-none print:border-0">
        {/* Blue letterhead — dropped when printing to save ink */}
        <div className="flex items-start justify-between gap-4 bg-vh-blue px-5 py-6 sm:px-8 sm:py-7 print:bg-white print:px-0 print:pt-0">
          <div>
            <div className="flex items-center gap-1">
              <span className="rounded-xl rounded-bl-sm bg-white px-2.5 py-1 text-[11px] font-black text-black print:border print:border-black">
                VIDEO
              </span>
              <span className="rounded-full border-2 border-white bg-vh-lime px-2.5 py-1 text-[11px] font-black text-black print:border-black">
                HUB
              </span>
            </div>
            <p className="mt-3 text-2xl font-black uppercase tracking-tight text-white print:text-black">
              Uslu Digital
            </p>
            <p className="text-xs font-black uppercase tracking-wide text-white/60 print:text-black/50">
              Video Delivery Receipt
            </p>
          </div>
          <div className="text-right text-xs font-bold text-white/70 print:text-black/60">
            <p>Generated {generatedOn}</p>
            <p className="text-sm font-black text-vh-lime print:text-black">{monthLabel(month)}</p>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-7 print:px-0">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-black/40">Client company</p>
            <p className="text-xl font-black uppercase tracking-tight text-black">{company.name}</p>
            <p className="text-xs font-bold text-black/35">Login ID: {company.login}</p>
          </div>

          {monthVideos.length === 0 ? (
            <p className="mt-8 text-sm font-bold text-black/35">
              No deliveries logged for {monthLabel(month)}.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-vh-line print:overflow-visible print:rounded-none print:border-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-vh-mist text-[11px] font-black uppercase tracking-wide text-black/40 print:bg-transparent">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-vh-line">
                  {monthVideos.map((v) => (
                    <tr key={v.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-black text-black">
                        {formatDate(v.video_date)}
                      </td>
                      <td className="px-4 py-3 font-bold text-black">
                        {v.title || "Video delivery"}
                      </td>
                      <td className="px-4 py-3 font-bold text-black/60">{v.branch_name}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums text-black">
                        {v.duration_seconds}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-7 grid grid-cols-2 gap-3 border-t-2 border-vh-line pt-7 sm:grid-cols-4">
            <div className="rounded-2xl bg-vh-mist px-4 py-3 print:bg-transparent print:px-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-black/40">Post Done</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-black">{monthVideos.length}</p>
            </div>
            <div className="rounded-2xl bg-vh-mist px-4 py-3 print:bg-transparent print:px-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-black/40">Amount</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-black">{totalSeconds}s</p>
            </div>
            <div className="rounded-2xl bg-vh-lime px-4 py-3 print:border print:border-black print:bg-transparent">
              <p className="text-[11px] font-black uppercase tracking-wide text-black/60">
                Full 15s blocks billed
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-black">{billing.blocks}</p>
            </div>
            <div className="rounded-2xl bg-vh-mist px-4 py-3 print:bg-transparent print:px-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-black/40">Left over</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-black">{billing.leftover}s</p>
            </div>
          </div>

          {/* The company's fixed rate is enough — no per-month setup needed. */}
          {payment && payment.pricePerBlock > 0 && (
            <div className="mt-7 border-t-2 border-vh-line pt-7">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight text-black">Amount due</h3>
                <span
                  className={`vh-pill ${
                    payment.status === "paid"
                      ? "bg-vh-lime text-black print:border print:border-black"
                      : "border-2 border-vh-line bg-white text-black/45"
                  }`}
                >
                  {payment.status === "paid" ? "Paid" : "Unpaid"}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm font-bold text-black/50">
                  <span>
                    {billing.blocks} block{billing.blocks === 1 ? "" : "s"} × {payment.pricePerBlock}
                  </span>
                  <span className="tabular-nums text-black">{formatAmount(payment.blocksAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-black/50">
                  <span>
                    {billing.leftover}s ÷ 15 × {payment.pricePerBlock}
                  </span>
                  <span className="tabular-nums text-black">
                    {formatAmount(payment.leftoverAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t-2 border-vh-line pt-3">
                  <span className="text-base font-black uppercase tracking-wide text-black">Total</span>
                  <span className="text-3xl font-black tabular-nums text-black">
                    {formatAmount(payment.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="mt-6 text-xs font-bold leading-relaxed text-black/35">
            Billing is calculated on the total seconds delivered this month, pooled together — not per
            video. {totalSeconds}s total = {billing.blocks} full 15-second block
            {billing.blocks === 1 ? "" : "s"} ({billing.blocks * 15}s) with {billing.leftover}s left
            over, unbilled.
          </p>
        </div>
      </div>
    </main>
  );
}
