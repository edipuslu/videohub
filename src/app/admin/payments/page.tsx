"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/StatCard";
import { MonthPicker } from "@/components/MonthPicker";
import { formatAmount } from "@/lib/billing";
import { TRACKING_START, currentMonthKey, monthLabel, yearOfMonthTabs } from "@/lib/postType";

interface PaymentRow {
  companySlug: string;
  companyName: string;
  videoCount: number;
  totalSeconds: number;
  blocks: number;
  leftoverSeconds: number;
  pricePerBlock: number;
  blocksAmount: number;
  leftoverAmount: number;
  total: number;
  status: "paid" | "unpaid";
  paidAt: string | null;
  saved: boolean;
}

export default function PaymentsPage() {
  const [month, setMonth] = useState<string>(() => {
    const now = currentMonthKey();
    return now < TRACKING_START ? TRACKING_START : now;
  });
  const [rows, setRows] = useState<PaymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const availableMonths = useMemo(() => yearOfMonthTabs(), []);

  async function load(forMonth: string) {
    const res = await apiFetch(`/api/payments?month=${forMonth}`);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setRows([]);
      setError(data?.error ?? "Could not load payments.");
      return;
    }
    const data = await res.json();
    setRows(data.rows);
    setError(null);
    // Seed the price inputs from what's saved.
    const seeded: Record<string, string> = {};
    for (const r of data.rows as PaymentRow[]) {
      seeded[r.companySlug] = r.pricePerBlock ? String(r.pricePerBlock) : "";
    }
    setDrafts(seeded);
  }

  useEffect(() => {
    load(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function save(slug: string, patch: { pricePerBlock?: string; status?: "paid" | "unpaid" }) {
    setBusy(slug);
    const res = await apiFetch("/api/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companySlug: slug, month, ...patch }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not save.");
      return;
    }
    load(month);
  }

  const totals = useMemo(() => {
    const list = rows ?? [];
    return {
      billed: list.reduce((s, r) => s + r.total, 0),
      paid: list.filter((r) => r.status === "paid").reduce((s, r) => s + r.total, 0),
      outstanding: list.filter((r) => r.status !== "paid").reduce((s, r) => s + r.total, 0),
    };
  }, [rows]);

  return (
    <>
      <Topbar
        title="Payments"
        subtitle="Uslu Digital admin"
        right={
          <Link href="/admin" className="vh-btn-ghost-dark">
            ← Companies
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              {monthLabel(month)}
            </h1>
            <p className="mt-1 text-sm font-bold text-black/40">
              Set each company&rsquo;s rate per 15-second block, then mark the month paid. Clients
              never see this page.
            </p>
          </div>
          <MonthPicker months={availableMonths} value={month} onChange={setMonth} />
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Billed this month" value={formatAmount(totals.billed)} accent />
          <StatCard label="Received" value={formatAmount(totals.paid)} />
          <StatCard label="Outstanding" value={formatAmount(totals.outstanding)} />
        </div>

        {error && (
          <div className="mt-6 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-7 overflow-x-auto rounded-[1.5rem] border-2 border-vh-line bg-white">
          <table className="w-full min-w-[62rem] text-left text-sm">
            <thead className="bg-vh-mist text-[11px] font-black uppercase tracking-wide text-black/40">
              <tr>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5 text-right">Videos</th>
                <th className="px-5 py-3.5 text-right">Blocks (15s)</th>
                <th className="px-5 py-3.5 text-right">Left over</th>
                <th className="px-5 py-3.5">Price / block</th>
                <th className="px-5 py-3.5 text-right">Blocks</th>
                <th className="px-5 py-3.5 text-right">Leftover</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-vh-line">
              {rows === null && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm font-bold text-black/30">
                    Loading…
                  </td>
                </tr>
              )}

              {rows?.length === 0 && !error && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm font-bold text-black/30">
                    No companies yet.
                  </td>
                </tr>
              )}

              {rows?.map((r) => (
                <tr key={r.companySlug} className="transition-colors hover:bg-vh-blue/5">
                  <td className="px-5 py-4">
                    <p className="font-black text-black">{r.companyName}</p>
                    {r.status === "paid" && r.paidAt && (
                      <p className="text-[11px] font-bold text-black/35">
                        Paid {new Date(r.paidAt).toLocaleDateString("en-US")}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-bold tabular-nums text-black/60">
                    {r.videoCount}
                  </td>
                  <td className="px-5 py-4 text-right font-black tabular-nums text-black">
                    {r.blocks}
                  </td>
                  <td className="px-5 py-4 text-right font-bold tabular-nums text-black/60">
                    {r.leftoverSeconds}s
                  </td>
                  <td className="px-5 py-4">
                    <input
                      className="vh-input w-28 py-1.5 text-right"
                      inputMode="decimal"
                      value={drafts[r.companySlug] ?? ""}
                      placeholder="e.g. 250"
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [r.companySlug]: e.target.value }))
                      }
                      onBlur={() => {
                        const next = drafts[r.companySlug] ?? "";
                        if (next !== "" && Number(next) !== r.pricePerBlock) {
                          save(r.companySlug, { pricePerBlock: next });
                        }
                      }}
                    />
                  </td>
                  <td className="px-5 py-4 text-right font-bold tabular-nums text-black/60">
                    {formatAmount(r.blocksAmount)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold tabular-nums text-black/60">
                    {formatAmount(r.leftoverAmount)}
                  </td>
                  <td className="px-5 py-4 text-right text-base font-black tabular-nums text-black">
                    {formatAmount(r.total)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      disabled={busy === r.companySlug}
                      onClick={() =>
                        save(r.companySlug, { status: r.status === "paid" ? "unpaid" : "paid" })
                      }
                      className={`vh-pill transition-colors disabled:opacity-50 ${
                        r.status === "paid"
                          ? "bg-vh-lime text-black"
                          : "border-2 border-vh-line bg-white text-black/45 hover:border-vh-blue/40"
                      }`}
                    >
                      {busy === r.companySlug ? "…" : r.status === "paid" ? "Paid" : "Mark paid"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs font-bold text-black/35">
          Leftover seconds are charged pro-rata from the same rate — at 250 per 15s block, 7 leftover
          seconds is 7 ÷ 15 × 250 = 116.67. Totals recalculate automatically if deliveries change.
        </p>
      </main>
    </>
  );
}
