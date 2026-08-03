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
    <header className="relative overflow-hidden bg-vh-blue">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff18_1px,transparent_1px),linear-gradient(to_bottom,#ffffff18_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {/* VIDEO / HUB lockup, same as the login hero */}
          <div className="flex items-center gap-1">
            <span className="rounded-xl rounded-bl-sm bg-white px-2.5 py-1 text-[11px] font-black text-black">
              VIDEO
            </span>
            <span className="rounded-full border-2 border-white bg-vh-lime px-2.5 py-1 text-[11px] font-black text-black">
              HUB
            </span>
          </div>

          <div className="hidden h-8 w-px bg-white/20 sm:block" />

          <div className="min-w-0">
            <p className="truncate text-base font-black uppercase leading-tight tracking-tight text-white sm:text-lg">
              {title}
            </p>
            {subtitle && (
              <p className="truncate text-[11px] font-bold uppercase tracking-wide text-white/50 sm:text-xs">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {right}
          <button onClick={logout} className="vh-btn-ghost-dark">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
