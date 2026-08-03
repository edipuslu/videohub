"use client";

import React from "react";
import { motion } from "framer-motion";
import { Marquee } from "@/components/ui/marquee";

const CompanyLogo = ({ mark, name }: { mark: string; name: string }) => (
  <div className="mx-8 flex min-w-fit items-center gap-3 text-white/75">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xl font-black opacity-90">
      {mark}
    </span>
    <span className="whitespace-nowrap text-xl font-black tracking-tight">{name}</span>
  </div>
);

const COMPANY_LOGOS = [
  { mark: "F", name: "Furniture" },
  { mark: "H", name: "Hotel" },
  { mark: "R", name: "Restaurant" },
  { mark: "P", name: "Pharmacy" },
  { mark: "E", name: "Real Estate" },
  { mark: "G", name: "Gym" },
  { mark: "C", name: "Clinic" },
  { mark: "S", name: "Salon" },
];

interface FloatingGlassCardProps {
  label: string;
  detail: string;
  badge: string;
  className?: string;
  /** Static tilt in degrees; composes with the floating animation. */
  rotate?: number;
}

const FloatingGlassCard = ({ label, detail, badge, className, rotate = 0 }: FloatingGlassCardProps) => (
  <motion.div
    style={{ rotate }}
    animate={{ y: [0, -16, 0] }}
    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
    className={`pointer-events-none absolute z-20 hidden md:block ${className ?? ""}`}
  >
    <div className="relative flex aspect-[3/3.35] w-40 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/40 bg-white/[0.18] p-4 text-center text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/60 bg-[#0038ff]">
        <span className="text-base font-black text-[#ccff00]">{badge}</span>
      </div>
      <p className="relative mt-4 text-base font-black leading-tight">{label}</p>
      <p className="relative mt-1 text-[11px] font-semibold leading-tight text-white/75">{detail}</p>
    </div>
  </motion.div>
);

const CircularBadge = () => (
  <div className="relative flex h-28 w-28 rotate-12 items-center justify-center rounded-full border-[3px] border-white/30 bg-[#ccff00] text-black shadow-2xl md:h-36 md:w-36">
    <div className="absolute inset-2 animate-[spin_12s_linear_infinite]">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        <path id="videoHubCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
        <text className="text-[8.5px] font-black uppercase tracking-[0.18em]" fill="black">
          <textPath href="#videoHubCirclePath">USLU DIGITAL • USLU DIGITAL • USLU DIGITAL •</textPath>
        </text>
      </svg>
    </div>
    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black md:h-16 md:w-16">
      <span className="font-display text-3xl font-black text-[#ffdf00] md:text-4xl">U</span>
    </div>
  </div>
);

export function Component({ formSlot }: { formSlot?: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0038ff] font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff18_1px,transparent_1px),linear-gradient(to_bottom,#ffffff18_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <main className="relative z-10 flex min-h-[102vh] w-full items-center justify-center px-5 pb-36 pt-10 md:min-h-[112vh] md:pb-52">
        {/* min-w-0 on the children stops the oversized headline from forcing
            the grid wider than a phone screen. */}
        <section className="relative grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:-translate-x-10 xl:-translate-x-16">
          {/* Decorative ring behind the layout */}
          <div className="pointer-events-none absolute left-[58%] top-1/2 hidden h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 md:block" />

          {/* Floating brand pill */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute left-[56%] top-[-1.5rem] z-20 hidden md:block"
          >
            <span className="whitespace-nowrap rounded-full bg-[#ccff00] px-5 py-2.5 text-sm font-black text-black shadow-xl">
              USLU DIGITAL
            </span>
          </motion.div>

          <div className="relative min-w-0 text-center lg:text-left">
            <div className="mx-auto mb-8 flex w-fit items-center gap-1 lg:mx-0">
              <span className="relative rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-sm font-black text-black">
                VIDEO
              </span>
              <span className="rounded-full border-2 border-white bg-[#ccff00] px-4 py-2 text-sm font-black text-black">
                HUB
              </span>
            </div>

            <h1
              className="text-[clamp(2.75rem,11vw,10rem)] font-black uppercase leading-[0.85] tracking-tight text-white"
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                // Shadow scales with the type so it doesn't swamp small screens.
                textShadow: "0.14em 0.14em 0 #001a99",
              }}
            >
              <span className="text-[#ccff00]">Video</span>
              <br />
              Delivery
              <br />
              Portal
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-base font-semibold text-white/75 lg:mx-0">
              A private place for Uslu Digital admins and clients to manage video deliveries,
              branches, monthly links, and receipts.
            </p>

            <div className="mt-8 w-full max-w-lg overflow-hidden border-y border-white/10 py-1.5 lg:max-w-xl">
              <Marquee speed={32} pauseOnHover>
                {COMPANY_LOGOS.map((logo) => (
                  <CompanyLogo key={logo.name} {...logo} />
                ))}
              </Marquee>
            </div>
          </div>

          <div className="relative mx-auto w-full min-w-0 max-w-[420px]">
            {formSlot}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [12, 7, 12] }}
              transition={{ duration: 5.5, repeat: Infinity }}
              className="absolute -bottom-24 -right-4 z-20 hidden md:block"
            >
              <CircularBadge />
            </motion.div>
          </div>

          <FloatingGlassCard
            label="Client view"
            detail="Finished links monthly"
            badge="CL"
            rotate={8}
            className="left-[52%] top-[88%]"
          />
          <FloatingGlassCard
            label="Client links"
            detail="Videos ready to open"
            badge="VL"
            rotate={-5}
            className="left-[47%] top-[1.5rem] w-28"
          />
        </section>
      </main>
    </div>
  );
}
