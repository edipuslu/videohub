"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Component as Hero } from "@/components/ui/hero";
import { HowItWorks } from "@/components/ui/how-it-works";

export default function LoginPage() {
  const router = useRouter();
  const [videohubId, setVideohubId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videohubId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        setLoading(false);
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
    <Hero
      formSlot={
        <div className="relative z-30 w-full rounded-3xl border border-white/30 bg-white/15 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl">
          <h2 className="text-2xl font-black text-white">Sign in to VideoHub</h2>
          <p className="mt-1.5 text-sm font-medium text-white/75">
            Enter your VideoHub ID and password. Admins land on the companies dashboard;
            clients see only their own delivery portal.
          </p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/75" htmlFor="videohubId">
                VideoHub ID
              </label>
              <input
                id="videohubId"
                className="w-full rounded-xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-sm text-white
                placeholder:text-white/50 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoComplete="username"
                value={videohubId}
                onChange={(e) => setVideohubId(e.target.value)}
                placeholder="e.g. uslu-admin"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-white/75" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-sm text-white
                placeholder:text-white/50 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-300/40 bg-red-500/20 px-3.5 py-2.5 text-sm text-white">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-[#ccff00] px-4 py-3 text-sm font-black text-black
              transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-white/60">
            Private Uslu Digital system &middot; videohub.usludigital.com
          </p>
        </div>
      }
    />
    <HowItWorks />
    </>
  );
}
