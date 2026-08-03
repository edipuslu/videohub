"use client";

import React from "react";

const CurvedArrow = () => (
  <svg viewBox="0 0 64 52" className="h-14 w-16 shrink-0" fill="none">
    <path
      d="M5 44 C 22 42, 38 32, 50 12"
      stroke="black"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M35 11 L52 9 L50 26"
      stroke="black"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowUpRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M8 7h9v9" />
  </svg>
);

function StepCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[2rem] bg-[#f5f6fa] px-8 py-12 text-center">
      <h3 className="whitespace-nowrap text-2xl font-black uppercase leading-[1.05] tracking-tight text-black lg:text-[1.75rem]">
        {title}
      </h3>
      <p className="mt-5 max-w-[17rem] text-sm font-bold leading-relaxed text-black/40">
        {description}
      </p>
      <div className="mt-auto pt-10">{children}</div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="relative z-10 -mt-12 rounded-t-[2.5rem] bg-white px-5 pb-24 pt-16 md:-mt-20 md:rounded-t-[3rem] md:pt-20">
      <div className="mx-auto grid max-w-7xl items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <StepCard
          title={
            <>
              Request
              <br />
              video work
            </>
          }
          description="Uslu Digital admins organize each company, branch, date, and delivery link."
        >
          <div className="flex items-center gap-3 rounded-full bg-[#1436ff] p-2 pr-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-black text-white">
              UD
            </span>
            <div className="text-left">
              <p className="text-base font-black leading-tight text-white">Client project</p>
              <p className="whitespace-nowrap text-xs font-semibold leading-tight text-white/70">
                Branch videos ready
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#ccff00] px-3.5 py-1.5 text-xs font-black text-black">
              NEW
            </span>
          </div>
        </StepCard>

        <div className="hidden items-center justify-center md:flex">
          <CurvedArrow />
        </div>

        <StepCard
          title={
            <>
              Track
              <br />
              monthly delivery
            </>
          }
          description="Seconds, videos, branches, and 15-second billing blocks stay simple."
        >
          <div className="relative inline-flex items-center gap-4 rounded-full bg-[#1436ff] p-2 pr-9">
            <span className="rounded-full bg-white/20 px-5 py-2.5 text-lg font-black text-white">15s</span>
            <span className="text-lg font-black tracking-tight text-white">BLOCKS</span>
            {/* Badge sits on the pill's bottom-right corner; the ring separates
                it from the pill so the two shapes don't visually collide. */}
            <span className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#ccff00] text-black ring-4 ring-[#f5f6fa]">
              <ArrowUpRight />
            </span>
          </div>
        </StepCard>

        <div className="hidden items-center justify-center md:flex">
          <CurvedArrow />
        </div>

        <StepCard
          title={
            <>
              Receive
              <br />
              final videos
            </>
          }
          description="Clients sign in to see finished links by branch, month, and date."
        >
          <div className="relative">
            <div className="relative rounded-[1.5rem] bg-[#ccff00] px-10 py-5">
              <p className="text-[11px] font-black uppercase tracking-wide text-black">Client portal</p>
              <p className="mt-0.5 text-3xl font-black leading-tight text-black">Ready</p>
              <span className="absolute -bottom-2 left-[22%] h-5 w-5 rotate-45 bg-[#ccff00]" />
            </div>
          </div>
        </StepCard>
      </div>
    </section>
  );
}
