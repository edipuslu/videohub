"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface CompanyRow {
  slug: string;
  name: string;
  login: string;
  created_at: string;
  branches: string[];
  video_count: number;
}

export default function CompaniesDashboardPage() {
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch("/api/companies");
    const data = await res.json();
    if (res.ok) setCompanies(data.companies);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/companies/${deleteTarget.slug}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  }

  const totalCompanies = companies?.length ?? 0;
  const totalBranches = companies?.reduce((sum, c) => sum + c.branches.length, 0) ?? 0;
  const totalVideos = companies?.reduce((sum, c) => sum + c.video_count, 0) ?? 0;

  return (
    <>
      <Topbar
        title="Companies Dashboard"
        subtitle="Uslu Digital admin"
        right={
          <>
            <Link href="/admin/account" className="vh-btn-ghost-dark">
              My account
            </Link>
            <button className="vh-btn-onblue" onClick={() => setShowForm(true)}>
              + New company
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total companies" value={totalCompanies} accent />
          <StatCard label="Total sections / branches" value={totalBranches} />
          <StatCard label="Total video requests / deliveries" value={totalVideos} />
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">Client companies</h2>

          {companies === null && (
            <p className="mt-4 text-sm font-bold text-black/35">Loading companies…</p>
          )}

          {companies?.length === 0 && (
            <div className="mt-4">
              <EmptyState
                title="No companies yet"
                description="Create your first client company to start tracking branches and video deliveries."
              />
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies?.map((c) => (
              <div key={c.slug} className="vh-card vh-card-hover flex flex-col p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black uppercase tracking-tight text-black">
                      {c.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs font-bold text-black/35">ID: {c.login}</p>
                  </div>
                  <button
                    className="vh-btn-danger shrink-0"
                    onClick={() => setDeleteTarget(c)}
                    title="Delete company"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-vh-bright px-4 py-3">
                    <p className="text-2xl font-black tabular-nums leading-none text-white">
                      {c.branches.length}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/60">
                      Sections
                    </p>
                  </div>
                  <div className="rounded-2xl bg-vh-lime px-4 py-3">
                    <p className="text-2xl font-black tabular-nums leading-none text-black">
                      {c.video_count}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-black/50">
                      Deliveries
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {c.branches.slice(0, 4).map((b) => (
                    <span key={b} className="vh-pill bg-vh-mist text-black/60">
                      {b}
                    </span>
                  ))}
                  {c.branches.length > 4 && (
                    <span className="vh-pill bg-vh-mist text-black/40">
                      +{c.branches.length - 4} more
                    </span>
                  )}
                  {c.branches.length === 0 && (
                    <span className="text-xs font-bold text-black/30">No sections added yet</span>
                  )}
                </div>

                <Link href={`/admin/companies/${c.slug}`} className="vh-btn-primary mt-6 w-full">
                  Open dashboard →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showForm && (
        <NewCompanyModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.name ?? "this company"}?`}
        description="This permanently removes the company, all its branches, and all logged video deliveries. This cannot be undone."
        confirmWord="DELETE"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}

function NewCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [clientLoginId, setClientLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [branchesText, setBranchesText] = useState("Restaurant, Hotel, Pharmacy");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const branches = branchesText
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, clientLoginId, password, branches }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create company.");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vh-deep/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.5rem] border-2 border-vh-line bg-white p-7 shadow-2xl">
        <h3 className="text-xl font-black uppercase tracking-tight text-black">New client company</h3>
        <p className="mt-2 text-sm font-bold text-black/45">
          Set up the company&rsquo;s VideoHub login and initial branches or sections.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="vh-label">Company name</label>
            <input
              className="vh-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ashley Group"
              required
            />
          </div>
          <div>
            <label className="vh-label">Client login ID</label>
            <input
              className="vh-input"
              value={clientLoginId}
              onChange={(e) => setClientLoginId(e.target.value)}
              placeholder="e.g. ashley-group"
              required
            />
          </div>
          <div>
            <label className="vh-label">Client password</label>
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
            <label className="vh-label">Branches / sections (comma-separated)</label>
            <input
              className="vh-input"
              value={branchesText}
              onChange={(e) => setBranchesText(e.target.value)}
              placeholder="Restaurant, Hotel, Pharmacy"
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
              {loading ? "Creating…" : "Create company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
