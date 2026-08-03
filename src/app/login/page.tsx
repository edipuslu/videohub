"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ResponsiveHeroBanner from "@/components/ui/responsive-hero-banner";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

const CLIENT_VERTICALS = [
  "Restaurant",
  "Hotel",
  "Pharmacy",
  "Retail",
  "Furniture",
  "Real Estate",
  "Fitness",
  "Automotive",
];

const BULLETS = [
  "Company and branch management for every Uslu Digital client",
  "Delivery tracking with automatic post-type classification",
  "A private, month-by-month delivery view for each client",
];

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
    <div className="min-h-screen bg-[#09090b]">
      <ResponsiveHeroBanner
        bullets={BULLETS}
        formSlot={
          <div className="mx-auto w-full max-w-sm rounded-2xl bg-white/[0.06] p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            <h2 className="font-display text-2xl font-medium text-[#fafafa]">Sign in to VideoHub</h2>
            <p className="mt-1.5 text-sm text-[#a1a1aa]">
              Enter your VideoHub ID and password. Admins land on the companies dashboard;
              clients see only their own delivery portal.
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#a1a1aa]"
                  htmlFor="videohubId"
                >
                  VideoHub ID
                </label>
                <input
                  id="videohubId"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-[#fafafa]
                  placeholder:text-[#71717a] focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                  autoComplete="username"
                  value={videohubId}
                  onChange={(e) => setVideohubId(e.target.value)}
                  placeholder="e.g. uslu-admin"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#a1a1aa]"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-[#fafafa]
                  placeholder:text-[#71717a] focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#fafafa] px-4 py-2.5 text-sm font-semibold text-[#09090b]
                transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#71717a]">
              Private Uslu Digital system &middot; videohub.usludigital.com
            </p>
          </div>
        }
      >
        <InfiniteSlider gap={12} duration={28} className="w-full">
          {CLIENT_VERTICALS.map((v) => (
            <span
              key={v}
              className="whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-[#e4e4e7] backdrop-blur-sm"
            >
              {v}
            </span>
          ))}
        </InfiniteSlider>
      </ResponsiveHeroBanner>
    </div>
  );
}
