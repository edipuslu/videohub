"use client";

import React from "react";

const CurvedArrow = () => (
  <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0 text-black" fill="none">
    <path
      d="M4 14 C 14 6, 26 6, 34 16"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M27 12 L35 16 L31 24"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export function HowItWorks() {
  return (
    <section className="relative z-10 -mt-12 rounded-t-[2.5rem] bg-white px-5 pb-24 pt-16 md:-mt-20 md:rounded-t-[3rem] md:pt-20">
      <div className="mx-auto grid max-w-6xl items-start gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {/* Step 1 */}
        <div className="rounded-3xl bg-[#f4f5fa] p-8">
          <h3 className="text-2xl font-black uppercase leading-tight text-black">
            Request
            <br />
            video work
          </h3>
          <p className="mt-4 text-sm text-black/60">
            Uslu Digital admins organize each company, branch, date, and delivery link.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-full bg-[#0038ff] p-2 pr-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-black text-white">
              UD
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">Client project</p>
              <p className="truncate text-xs text-white/60">Branch videos ready</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#ccff00] px-2.5 py-1 text-[10px] font-black text-black">
              NEW
            </span>
          </div>
        </div>

        <div className="hidden items-center justify-center pt-24 md:flex">
          <CurvedArrow />
        </div>

        {/* Step 2 */}
        <div className="rounded-3xl bg-[#f4f5fa] p-8">
          <h3 className="text-2xl font-black uppercase leading-tight text-black">
            Track
            <br />
            monthly delivery
          </h3>
          <p className="mt-4 text-sm text-black/60">
            Seconds, videos, branches, and 15-second billing blocks stay simple.
          </p>
          <div className="relative mt-8 inline-flex items-center gap-3 rounded-full bg-[#0038ff] py-3 pl-3 pr-8">
            <span className="rounded-full bg-[#001a99] px-3 py-1.5 text-sm font-black text-white">15s</span>
            <span className="text-sm font-black text-white">BLOCKS</span>
            <span className="absolute -bottom-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#ccff00] text-black shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M9 7h8v8" />
              </svg>
            </span>
          </div>
        </div>

        <div className="hidden items-center justify-center pt-24 md:flex">
          <CurvedArrow />
        </div>

        {/* Step 3 */}
        <div className="rounded-3xl bg-[#f4f5fa] p-8">
          <h3 className="text-2xl font-black uppercase leading-tight text-black">
            Receive
            <br />
            final videos
          </h3>
          <p className="mt-4 text-sm text-black/60">
            Clients sign in to see finished links by branch, month, and date.
          </p>
          <div className="mt-8 flex items-end gap-3">
            <div className="relative rounded-2xl rounded-bl-sm bg-[#ccff00] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-black/60">Client portal</p>
              <p className="text-lg font-black leading-tight text-black">Ready</p>
            </div>
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#0038ff] p-2 shadow-lg">
              <p className="text-[9px] font-black uppercase leading-none text-[#ccff00]">Video</p>
              <p className="text-[9px] font-black uppercase leading-none text-white">Delivery</p>
              <p className="text-[9px] font-black uppercase leading-none text-white">Portal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
