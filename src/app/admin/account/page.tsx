"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";

interface Account {
  login: string;
  name: string | null;
  source: "database" | "environment";
}

export default function AdminAccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/api/account");
      if (!res.ok) return;
      const data = await res.json();
      setAccount(data.account);
      setName(data.account.name ?? "");
      setLogin(data.account.login);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (password && password !== confirm) {
      setError("The new passwords do not match.");
      return;
    }

    setSaving(true);
    const res = await apiFetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, login, currentPassword, password: password || undefined }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save your account.");
      return;
    }

    setAccount(data.account);
    setCurrentPassword("");
    setPassword("");
    setConfirm("");
    setSaved(true);
  }

  return (
    <>
      <Topbar
        title="Admin account"
        subtitle="Uslu Digital admin"
        right={
          <Link href="/admin" className="vh-btn-ghost-dark">
            ← Companies
          </Link>
        }
      />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-black">Your admin login</h1>
        <p className="mt-1 text-sm font-bold text-black/40">
          Change the VideoHub ID and password you use to manage every company.
        </p>

        {account?.source === "environment" && (
          <div className="mt-6 rounded-2xl border-2 border-vh-blue/20 bg-vh-blue/5 px-5 py-4">
            <p className="text-sm font-black text-black">This login still comes from server settings</p>
            <p className="mt-1 text-sm font-bold text-black/50">
              Saving here moves it into the database so you can change it any time from this page.
            </p>
          </div>
        )}

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <div className="vh-card p-6">
            <div className="space-y-5">
              <div>
                <label className="vh-label" htmlFor="acc-name">
                  Display name
                </label>
                <input
                  id="acc-name"
                  className="vh-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Edip Uslu"
                />
              </div>
              <div>
                <label className="vh-label" htmlFor="acc-login">
                  VideoHub ID
                </label>
                <input
                  id="acc-login"
                  className="vh-input"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
          </div>

          <div className="vh-card p-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-black">Change password</h2>
            <p className="mt-1 text-sm font-bold text-black/40">
              Leave the new password blank to keep your current one.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label className="vh-label" htmlFor="acc-new">
                  New password
                </label>
                <input
                  id="acc-new"
                  type="password"
                  className="vh-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="vh-label" htmlFor="acc-confirm">
                  Confirm new password
                </label>
                <input
                  id="acc-confirm"
                  type="password"
                  className="vh-input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="vh-card border-vh-blue/30 p-6">
            <label className="vh-label" htmlFor="acc-current">
              Current password (required to save)
            </label>
            <input
              id="acc-current"
              type="password"
              className="vh-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {saved && (
            <div className="rounded-xl border-2 border-vh-lime bg-vh-lime/20 px-3.5 py-2.5 text-sm font-black text-black">
              Saved. Use your new details next time you sign in.
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" className="vh-btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
