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

// Branch cards alternate the brand's blue/lime pairing, same as the login hero.
const BRANCH_VARIANTS = [
  {
    bg: "#0038ff",
    title: "text-white",
    muted: "text-white/60",
    track: "bg-white/20",
    bar: "bg-vh-lime",
    chip: "bg-white/15 text-white hover:bg-white/25",
  },
  {
    bg: "#ccff00",
    title: "text-black",
    muted: "text-black/50",
    track: "bg-black/15",
    bar: "bg-vh-blue",
    chip: "bg-black/10 text-black hover:bg-black/20",
  },
];

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

interface CompanyUserRow {
  id: number;
  name: string | null;
  login: string;
  role: "owner" | "worker";
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
  const [users, setUsers] = useState<CompanyUserRow[] | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState<CompanyUserRow | null>(null);
  const [userDeleteTarget, setUserDeleteTarget] = useState<CompanyUserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showCompanyLoginForm, setShowCompanyLoginForm] = useState(false);

  async function load() {
    const [companyRes, videosRes, usersRes] = await Promise.all([
      fetch(`/api/companies/${slug}`),
      fetch(`/api/companies/${slug}/videos`),
      fetch(`/api/companies/${slug}/users`),
    ]);
    const companyData = await companyRes.json();
    const videosData = await videosRes.json();
    if (companyRes.ok) setCompany(companyData.company);
    if (videosRes.ok) setVideos(videosData.videos);
    // The users table needs a one-time migration; tolerate it not being ready yet.
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      setUsers(usersData.users);
    } else {
      setUsers([]);
    }
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

  async function handleDeleteUser() {
    if (!userDeleteTarget) return;
    setDeletingUser(true);
    await fetch(`/api/users/${userDeleteTarget.id}`, { method: "DELETE" });
    setDeletingUser(false);
    setUserDeleteTarget(null);
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
        <main className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-sm font-bold text-black/35">Loading company…</p>
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
            <Link href="/admin" className="vh-btn-ghost-dark">
              ← Companies
            </Link>
            <Link
              href={`/admin/companies/${company.slug}/receipt?month=${month}`}
              className="vh-btn-ghost-dark"
            >
              Print receipt
            </Link>
            <button className="vh-btn-ghost-dark" onClick={() => setShowBranchForm(true)}>
              + Branch
            </button>
            <button
              className="vh-btn-onblue"
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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">{company.name}</h1>
            <p className="mt-1 text-sm font-bold text-black/40">Client login ID: {company.login}</p>
          </div>

          <MonthPicker months={availableMonths} value={month} onChange={setMonth} />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Videos this month" value={monthVideos.length} />
          <StatCard label="Total seconds" value={totalSeconds} />
          <StatCard label="Sections" value={company.branches.length} />
          <StatCard label="Billable blocks (15s)" value={billing.blocks} hint="Full 15s blocks, pooled" accent />
          <StatCard label="Leftover seconds" value={billing.leftover} hint="Unbilled remainder" />
        </div>

        {company.branches.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {company.branches.map((b, i) => {
              const v = BRANCH_VARIANTS[i % BRANCH_VARIANTS.length];
              const count = branchTotals.get(b) ?? 0;
              const sharePercent = monthVideos.length > 0 ? Math.round((count / monthVideos.length) * 100) : 0;
              return (
                <div
                  key={b}
                  style={{ backgroundColor: v.bg }}
                  className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${v.title}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[11px] font-black uppercase tracking-wide ${v.muted}`}>
                      {monthLabel(month)}
                    </span>
                    <button
                      onClick={() => setBranchDeleteTarget(b)}
                      title={`Delete ${b}`}
                      className={`shrink-0 rounded-full p-1 transition-colors ${v.chip}`}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <circle cx="12" cy="5" r="1.6" />
                        <circle cx="12" cy="12" r="1.6" />
                        <circle cx="12" cy="19" r="1.6" />
                      </svg>
                    </button>
                  </div>

                  <h3 className="mt-3 text-lg font-black uppercase leading-tight tracking-tight">{b}</h3>
                  <p className={`text-sm font-bold ${v.muted}`}>
                    {count} deliver{count === 1 ? "y" : "ies"} logged
                  </p>

                  <div className="mt-5">
                    <div className={`flex items-center justify-between text-[11px] font-black ${v.muted}`}>
                      <span>Share of month</span>
                      <span>{sharePercent}%</span>
                    </div>
                    <div className={`mt-1.5 h-2 w-full overflow-hidden rounded-full ${v.track}`}>
                      <div
                        className={`h-full rounded-full ${v.bar}`}
                        style={{ width: `${sharePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setVideoFormBranch(b);
                        setShowVideoForm(true);
                      }}
                      title={`Add delivery for ${b}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${v.chip}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setBranchFilter(b)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-black transition-colors ${v.chip}`}
                    >
                      View →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t-2 border-vh-line pt-7">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">
            Deliveries <span className="text-black/20">·</span> {monthLabel(month)}
          </h2>
          {company.branches.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
        </div>

        {videos === null && <p className="mt-4 text-sm font-bold text-black/35">Loading deliveries…</p>}

        {videos !== null && filteredVideos.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No deliveries logged for this month"
              description="Confirmed video links you add for this company will appear here automatically."
            />
          </div>
        )}

        {filteredVideos.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border-2 border-vh-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-vh-mist text-[11px] font-black uppercase tracking-wide text-black/40">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Branch</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Link</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-vh-line">
                {filteredVideos.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-vh-blue/5">
                    <td className="whitespace-nowrap px-5 py-4 font-black text-black">
                      {formatDate(v.video_date)}
                    </td>
                    <td className="px-5 py-4 font-bold text-black/60">{v.branch_name}</td>
                    <td className="px-5 py-4 font-black tabular-nums text-black">{v.duration_seconds}s</td>
                    <td className="px-5 py-4">
                      <a
                        href={v.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-black text-vh-bright hover:underline"
                      >
                        Open video →
                      </a>
                    </td>
                    <td className="px-5 py-4 text-right">
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

        {/* Team access — people who can sign in for this company */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t-2 border-vh-line pt-7">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black">Team access</h2>
            <p className="mt-1 text-sm font-bold text-black/40">
              People at {company.name} who can sign in and see this company&rsquo;s deliveries.
            </p>
          </div>
          <button className="vh-btn-primary" onClick={() => setShowUserForm(true)}>
            + Add person
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border-2 border-vh-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-vh-mist text-[11px] font-black uppercase tracking-wide text-black/40">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">VideoHub ID</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-vh-line">
              {/* The company's own shared login always works and can't be removed here. */}
              <tr className="bg-vh-blue/5">
                <td className="px-5 py-4 font-black text-black">Company login</td>
                <td className="px-5 py-4 font-bold text-black/60">{company.login}</td>
                <td className="px-5 py-4">
                  <span className="vh-pill bg-vh-blue text-white">Primary</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="vh-btn-secondary" onClick={() => setShowCompanyLoginForm(true)}>
                    Edit
                  </button>
                </td>
              </tr>

              {users?.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-vh-blue/5">
                  <td className="px-5 py-4 font-black text-black">{u.name ?? "—"}</td>
                  <td className="px-5 py-4 font-bold text-black/60">{u.login}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`vh-pill ${
                        u.role === "owner" ? "bg-vh-lime text-black" : "bg-vh-mist text-black/60"
                      }`}
                    >
                      {u.role === "owner" ? "Owner" : "Worker"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="vh-btn-secondary" onClick={() => setEditUserTarget(u)}>
                        Edit
                      </button>
                      <button className="vh-btn-danger" onClick={() => setUserDeleteTarget(u)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users !== null && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-sm font-bold text-black/30">
                    No extra people yet — add an owner or worker to give them their own login.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showUserForm && (
        <AddUserModal
          slug={company.slug}
          onClose={() => setShowUserForm(false)}
          onCreated={() => {
            setShowUserForm(false);
            load();
          }}
        />
      )}

      {editUserTarget && (
        <EditUserModal
          user={editUserTarget}
          onClose={() => setEditUserTarget(null)}
          onSaved={() => {
            setEditUserTarget(null);
            load();
          }}
        />
      )}

      {showCompanyLoginForm && (
        <EditCompanyLoginModal
          slug={company.slug}
          currentLogin={company.login}
          onClose={() => setShowCompanyLoginForm(false)}
          onSaved={() => {
            setShowCompanyLoginForm(false);
            load();
          }}
        />
      )}

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
        open={!!userDeleteTarget}
        title={`Remove ${userDeleteTarget?.name ?? "this person"}?`}
        description="They will no longer be able to sign in to VideoHub. The company's deliveries are not affected."
        confirmLabel="Remove"
        confirmWord="DELETE"
        onCancel={() => setUserDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        loading={deletingUser}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vh-deep/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.5rem] border-2 border-vh-line bg-white p-7 shadow-2xl">
        <h3 className="text-xl font-black uppercase tracking-tight text-black">Log a video delivery</h3>
        <p className="mt-2 text-sm font-bold text-black/45">
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
            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vh-deep/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[1.5rem] border-2 border-vh-line bg-white p-7 shadow-2xl">
        <h3 className="text-xl font-black uppercase tracking-tight text-black">Add a branch / section</h3>
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
            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">
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

function AddUserModal({
  slug,
  onClose,
  onCreated,
}: {
  slug: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "worker">("worker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/companies/${slug}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, login, password, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add this person.");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vh-deep/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.5rem] border-2 border-vh-line bg-white p-7 shadow-2xl">
        <h3 className="text-xl font-black uppercase tracking-tight text-black">Add a person</h3>
        <p className="mt-2 text-sm font-bold text-black/45">
          They get their own VideoHub ID and password, and see only this company&rsquo;s deliveries.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="vh-label">Full name</label>
            <input
              className="vh-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayse Yilmaz"
              required
            />
          </div>
          <div>
            <label className="vh-label">VideoHub ID</label>
            <input
              className="vh-input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="e.g. ayse@company.com"
              required
            />
          </div>
          <div>
            <label className="vh-label">Password</label>
            <input
              className="vh-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set an initial password"
              required
            />
          </div>
          <div>
            <label className="vh-label">Role</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`vh-tab flex-1 ${
                  role === "owner" ? "vh-tab-active" : "border-2 border-vh-line bg-white"
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`vh-tab flex-1 ${
                  role === "worker" ? "vh-tab-active" : "border-2 border-vh-line bg-white"
                }`}
              >
                Worker
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="vh-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="vh-btn-primary" disabled={loading}>
              {loading ? "Adding…" : "Add person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: CompanyUserRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [login, setLogin] = useState(user.login);
  const [role, setRole] = useState<"owner" | "worker">(user.role);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, login, role, password: password || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save changes.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vh-deep/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.5rem] border-2 border-vh-line bg-white p-7 shadow-2xl">
        <h3 className="text-xl font-black uppercase tracking-tight text-black">Edit person</h3>
        <p className="mt-2 text-sm font-bold text-black/45">
          Leave the password blank to keep their current one.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="vh-label">Full name</label>
            <input
              className="vh-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="vh-label">VideoHub ID</label>
            <input
              className="vh-input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="vh-label">New password (optional)</label>
            <input
              className="vh-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="vh-label">Role</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`vh-tab flex-1 ${
                  role === "owner" ? "vh-tab-active" : "border-2 border-vh-line bg-white"
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`vh-tab flex-1 ${
                  role === "worker" ? "vh-tab-active" : "border-2 border-vh-line bg-white"
                }`}
              >
                Worker
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="vh-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="vh-btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCompanyLoginModal({
  slug,
  currentLogin,
  onClose,
  onSaved,
}: {
  slug: string;
  currentLogin: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [login, setLogin] = useState(currentLogin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/companies/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password: password || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save changes.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vh-deep/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.5rem] border-2 border-vh-line bg-white p-7 shadow-2xl">
        <h3 className="text-xl font-black uppercase tracking-tight text-black">Edit company login</h3>
        <p className="mt-2 text-sm font-bold text-black/45">
          This is the company&rsquo;s shared VideoHub ID. Leave the password blank to keep the
          current one.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="vh-label">Client login ID</label>
            <input
              className="vh-input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="vh-label">New password (optional)</label>
            <input
              className="vh-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="vh-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="vh-btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
