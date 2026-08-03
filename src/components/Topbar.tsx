"use client";

import { useRouter } from "next/navigation";

export function Topbar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-ink-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-400/40 bg-white/5 font-display text-sm font-semibold text-gold-300">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-white">VideoHub</span>
              <span className="text-white/20">/</span>
              <span className="text-sm text-white/60">{title}</span>
            </div>
            {subtitle && <p className="text-xs text-white/35">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {right}
          <button onClick={logout} className="vh-btn-ghost-dark">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
