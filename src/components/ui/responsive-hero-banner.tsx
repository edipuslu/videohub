"use client";

import React, { useState } from "react";
import Velaris from "@/components/ui/velaris";

interface NavLink {
  label: string;
  href: string;
  isActive?: boolean;
}

interface ResponsiveHeroBannerProps {
  navLinks?: NavLink[];
  ctaButtonText?: string;
  ctaButtonHref?: string;
  badgeLabel?: string;
  badgeText?: string;
  title?: string;
  titleLine2?: string;
  description?: string;
  bullets?: string[];
  partnersTitle?: string;
  /** Rendered beside the headline, above the fold — e.g. a sign-in card. */
  formSlot?: React.ReactNode;
  children?: React.ReactNode;
}

const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
  navLinks = [
    { label: "Overview", href: "#overview", isActive: true },
    { label: "Industries", href: "#industries" },
  ],
  ctaButtonText = "Sign in",
  ctaButtonHref = "#signin",
  badgeLabel = "Secure",
  badgeText = "Private portal for Uslu Digital clients",
  title = "The secure portal for",
  titleLine2 = "Uslu Digital's AI video work",
  description = "VideoHub is where Uslu Digital manages client companies, branches, and video requests — and where clients sign in to view their finished AI video deliveries, organized by branch, month, and date.",
  bullets = [],
  partnersTitle = "Industries we deliver for",
  formSlot,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section id="overview" className="relative isolate w-full overflow-hidden bg-[#09090b]">
      <Velaris
        bg="#000000"
        colors={["#86efac", "#4ade80", "#059669", "#000000"]}
        speed={1.2}
        grain={0.25}
        className="absolute inset-0 h-full w-full"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#09090b]/70 via-[#09090b]/55 to-[#09090b]/95" />

      <header className="relative z-10 xl:top-4">
        <div className="mx-6">
          <div className="flex items-center justify-between pt-4">
            <a href="#overview" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3f3f46] bg-white/5 font-display text-lg font-semibold text-[#fafafa] backdrop-blur-sm">
                V
              </div>
              <span className="font-display text-lg font-semibold tracking-tight text-[#fafafa]">VideoHub</span>
            </a>

            <nav className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`px-3 py-2 font-sans text-sm font-medium transition-colors hover:text-[#fafafa] ${
                      link.isActive ? "text-[#e4e4e7]" : "text-[#a1a1aa]"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href={ctaButtonHref}
                  className="ml-1 inline-flex items-center gap-2 rounded-full bg-[#fafafa] px-3.5 py-2 font-sans text-sm font-medium text-[#09090b] transition-colors hover:bg-white/90"
                >
                  {ctaButtonText}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                </a>
              </div>
            </nav>

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-[#e4e4e7]"
              >
                <path d="M4 5h16" />
                <path d="M4 12h16" />
                <path d="M4 19h16" />
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mt-3 flex flex-col gap-1 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur md:hidden">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 font-sans text-sm font-medium text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-[#fafafa]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={ctaButtonHref}
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 rounded-lg bg-[#fafafa] px-3 py-2 text-center font-sans text-sm font-medium text-[#09090b]"
              >
                {ctaButtonText}
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-14 sm:pt-16">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur">
                <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 font-sans text-xs font-medium text-[#09090b]">
                  {badgeLabel}
                </span>
                <span className="font-sans text-sm font-medium text-[#e4e4e7]">{badgeText}</span>
              </div>

              <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-[#fafafa] sm:text-5xl">
                {title}
                <br />
                {titleLine2}
              </h1>

              <p className="mt-6 max-w-xl text-base text-[#a1a1aa] sm:text-lg">{description}</p>

              {bullets.length > 0 && (
                <ul className="mt-8 space-y-3 text-sm text-[#a1a1aa]">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#fafafa]" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {formSlot && <div id="signin" className="scroll-mt-24">{formSlot}</div>}
          </div>

          <div id="industries" className="mx-auto mt-20 max-w-5xl scroll-mt-24">
            <p className="text-center text-sm text-[#a1a1aa]">{partnersTitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResponsiveHeroBanner;
