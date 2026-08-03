"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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

// Matches the reference card's literal color variants (green/orange/red/blue).
const BRANCH_CARD_COLORS = ["#01c3a8", "#ffb741", "#a63d2a", "#1890ff"];

interface CompanyDetail {
  slug: string;
  name: string;
  login: string;
  branches: string[];
}

interface VideoRow {
  id: number;
  company_slug: string;
  branch_name: string;
  video_date: string;
  drive_link: string;
  duration_seconds: number;
  created_at: string;
}

export default function CompanyAdminDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [videos, setVideos] = useState<VideoRow[] | null>(null);
  const [month, setMonth] = useState<string>(() => {
    const now = currentMonthKey();
    return now < TRACKING_START ? TRACKING_START : now;
  });
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoFormBranch, setVideoFormBranch] = useState<string | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [branchDeleteTarget, setBranchDeleteTarget] = useState<string | null>(null);
  const [deletingBranch, setDeletingBranch] = useState(false);

  async function load() {
    const [companyRes, videosRes] = await Promise.all([
      fetch(`/api/companies/${slug}`),
      fetch(`/api/companies/${slug}/videos`),
    ]);
    const companyData = await companyRes.json();
    const videosData = await videosRes.json();
    if (companyRes.ok) setCompany(companyData.company);
    if (videosRes.ok) setVideos(videosData.videos);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const availableMonths = useMemo(() => yearOfMonthTabs(), []);

  const monthVideos = useMemo(
    () => (videos ?? []).filter((v) => monthKey(v.video_date) === month),
    [videos, month]
  );

  const filteredVideos = useMemo(
    () => (branchFilter === "all" ? monthVideos : monthVideos.filter((v) => v.branch_name === branchFilter)),
    [monthVideos, branchFilter]
  );

  const totalSeconds = monthVideos.reduce((sum, v) => sum + v.duration_seconds, 0);
  const billing = aggregateBilling(totalSeconds);
  const branchTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of monthVideos) map.set(v.branch_name, (map.get(v.branch_name) ?? 0) + 1);
    return map;
  }, [monthVideos]);

  async function handleDeleteVideo() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/videos/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  }

  async function handleDeleteBranch() {
    if (!branchDeleteTarget) return;
    setDeletingBranch(true);
    await fetch(`/api/companies/${slug}/branches`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: branchDeleteTarget }),
    });
    setDeletingBranch(false);
    setBranchDeleteTarget(null);
    if (branchFilter === branchDeleteTarget) setBranchFilter("all");
    load();
  }

  if (!company) {
    return (
      <>
        <Topbar title="Company dashboard" subtitle="Uslu Digital admin" />
        <main className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm text-ink-400">Loading company…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={company.name}
        subtitle="Uslu Digital admin"
        right={
          <>
            <Link href="/admin" className="vh-btn-secondary">
              ← Companies
            </Link>
            <Link href={`/admin/companies/${company.slug}/receipt?month=${month}`} className="vh-btn-secondary">
              Print receipt
            </Link>
            <button className="vh-btn-secondary" onClick={() => setShowBranchForm(true)}>
              + Branch
            </button>
            <button
              className="vh-btn-primary"
              onClick={() => {
                setVideoFormBranch(null);
                setShowVideoForm(true);
              }}
            >
              + Add delivery
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-ink-900">{company.name}</h1>
            <p className="text-sm text-ink-500">Client login ID: {company.login}</p>
          </div>

          <MonthPicker months={availableMonths} value={month} onChange={setMonth} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Videos this month" value={monthVideos.length} />
          <StatCard label="Total seconds" value={totalSeconds} />
          <StatCard label="Sections" value={company.branches.length} />
          <StatCard label="Billable blocks (15s)" value={billing.blocks} hint="Full 15s blocks, pooled" />
          <StatCard label="Leftover seconds" value={billing.leftover} hint="Unbilled remainder" />
        </div>

        {company.branches.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {company.branches.map((b, i) => {
              const color = BRANCH_CARD_COLORS[i % BRANCH_CARD_COLORS.length];
              const count = branchTotals.get(b) ?? 0;
              const sharePercent = monthVideos.length > 0 ? Math.round((count / monthVideos.length) * 100) : 0;
              return (
                <div
                  key={b}
                  style={{ backgroundColor: color }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl p-4 text-white shadow-card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-cardHover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-white/70">{monthLabel(month)}</span>
                    <button
                      onClick={() => setBranchDeleteTarget(b)}
                      title={`Delete ${b}`}
                      className="shrink-0 rounded-md p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <circle cx="12" cy="5" r="1.6" />
                        <circle cx="12" cy="12" r="1.6" />
                        <circle cx="12" cy="19" r="1.6" />
                      </svg>
                    </button>
                  </div>

                  <h3 className="mt-3 text-base font-semibold leading-snug">{b}</h3>
                  <p className="text-sm text-white/70">
                    {count} deliver{count === 1 ? "y" : "ies"} logged
                  </p>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <span>Share of month</span>
                      <span>{sharePercent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <div className="h-full rounded-full bg-white" style={{ width: `${sharePercent}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setVideoFormBranch(b);
                        setShowVideoForm(true);
                      }}
                      title={`Add delivery for ${b}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setBranchFilter(b)}
                      className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-white/25"
                    >
                      View →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Deliveries <span className="text-ink-300">·</span> {monthLabel(month)}
          </h2>
          {company.branches.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
        </div>

        {videos === null && <p className="mt-4 text-sm text-ink-400">Loading deliveries…</p>}

        {videos !== null && filteredVideos.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No deliveries logged for this month"
              description="Confirmed video links you add for this company will appear here automatically."
            />
          </div>
        )}

        {filteredVideos.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl2 border border-ink-100 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredVideos.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-brand-50/40">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-700">
                      {formatDate(v.video_date)}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{v.branch_name}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-700">{v.duration_seconds}s</td>
                    <td className="px-4 py-3">
                      <a
                        href={v.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand-700 hover:underline"
                      >
                        Open video
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="vh-btn-danger" onClick={() => setDeleteTarget(v)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showVideoForm && (
        <AddVideoModal
          slug={company.slug}
          branches={company.branches}
          initialBranch={videoFormBranch}
          onClose={() => setShowVideoForm(false)}
          onCreated={() => {
            setShowVideoForm(false);
            load();
          }}
        />
      )}

      {showBranchForm && (
        <AddBranchModal
          slug={company.slug}
          onClose={() => setShowBranchForm(false)}
          onCreated={() => {
            setShowBranchForm(false);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this video link?"
        description="This removes the delivery from the client's portal immediately. This cannot be undone."
        confirmWord="DELETE"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteVideo}
        loading={deleting}
      />

      <ConfirmDialog
        open={!!branchDeleteTarget}
        title={`Delete ${branchDeleteTarget ?? "this branch"}?`}
        description="This removes the branch/section from the company. Deliveries already logged under it keep their history and stay visible."
        confirmWord="DELETE"
        onCancel={() => setBranchDeleteTarget(null)}
        onConfirm={handleDeleteBranch}
        loading={deletingBranch}
      />
    </>
  );
}

function AddVideoModal({
  slug,
  branches,
  initialBranch,
  onClose,
  onCreated,
}: {
  slug: string;
  branches: string[];
  initialBranch?: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [branchName, setBranchName] = useState(initialBranch ?? branches[0] ?? "");
  const [videoDate, setVideoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [driveLink, setDriveLink] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const duration = Number(durationSeconds);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!branchName) {
      setError("Add a branch to this company before logging a delivery.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/companies/${slug}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchName, videoDate, driveLink, durationSeconds: duration }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save this delivery.");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-cardHover">
        <h3 className="text-base font-semibold text-ink-900">Log a video delivery</h3>
        <p className="mt-1 text-sm text-ink-500">
          Billing is calculated from the pooled total seconds delivered each month, in full 15-second
          blocks.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="vh-label">Branch / section</label>
            <select className="vh-input" value={branchName} onChange={(e) => setBranchName(e.target.value)}>
              {branches.length === 0 && <option value="">No branches yet</option>}
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="vh-label">Video date</label>
            <input
              type="date"
              className="vh-input"
              value={videoDate}
              min="2026-07-01"
              onChange={(e) => setVideoDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="vh-label">Drive / video delivery link</label>
            <input
              className="vh-input"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/…"
              required
            />
          </div>
          <div>
            <label className="vh-label">Duration (seconds)</label>
            <input
              type="number"
              min={1}
              className="vh-input"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              placeholder="e.g. 12"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="vh-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="vh-btn-primary" disabled={loading || branches.length === 0}>
              {loading ? "Saving…" : "Save delivery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddBranchModal({
  slug,
  onClose,
  onCreated,
}: {
  slug: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/companies/${slug}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add branch.");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-cardHover">
        <h3 className="text-base font-semibold text-ink-900">Add a branch / section</h3>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="vh-label">Branch name</label>
            <input
              className="vh-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pharmacy"
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="vh-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="vh-btn-primary" disabled={loading}>
              {loading ? "Adding…" : "Add branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
