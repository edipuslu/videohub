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
          <button className="vh-btn-primary" onClick={() => setShowForm(true)}>
            + New company
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total companies" value={totalCompanies} />
          <StatCard label="Total sections / branches" value={totalBranches} />
          <StatCard label="Total video requests / deliveries" value={totalVideos} />
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Client companies
          </h2>

          {companies === null && (
            <p className="mt-4 text-sm text-ink-400">Loading companies…</p>
          )}

          {companies?.length === 0 && (
            <div className="mt-4">
              <EmptyState
                title="No companies yet"
                description="Create your first client company to start tracking branches and video deliveries."
              />
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies?.map((c) => (
              <div key={c.slug} className="vh-card vh-card-hover flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-ink-900">{c.name}</h3>
                    <p className="mt-0.5 text-xs text-ink-400">ID: {c.login}</p>
                  </div>
                  <button
                    className="vh-btn-danger"
                    onClick={() => setDeleteTarget(c)}
                    title="Delete company"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-brand-50 px-3 py-2">
                    <p className="text-lg font-semibold text-brand-800">{c.branches.length}</p>
                    <p className="text-[11px] uppercase tracking-wide text-brand-600">Sections</p>
                  </div>
                  <div className="rounded-lg bg-brand-50 px-3 py-2">
                    <p className="text-lg font-semibold text-brand-800">{c.video_count}</p>
                    <p className="text-[11px] uppercase tracking-wide text-brand-600">Deliveries</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.branches.slice(0, 4).map((b) => (
                    <span key={b} className="vh-pill bg-ink-50 text-ink-600">
                      {b}
                    </span>
                  ))}
                  {c.branches.length > 4 && (
                    <span className="vh-pill bg-ink-50 text-ink-500">
                      +{c.branches.length - 4} more
                    </span>
                  )}
                  {c.branches.length === 0 && (
                    <span className="text-xs text-ink-400">No sections added yet</span>
                  )}
                </div>

                <Link href={`/admin/companies/${c.slug}`} className="vh-btn-secondary mt-5 w-full">
                  Open dashboard
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-cardHover">
        <h3 className="text-base font-semibold text-ink-900">New client company</h3>
        <p className="mt-1 text-sm text-ink-500">
          Set up the company&rsquo;s VideoHub login and initial branches or sections.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
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
