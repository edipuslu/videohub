"use client";

import { useEffect, useMemo, useState } from "react";
import { monthShortLabel } from "@/lib/postType";

/** Two-tier year + month picker so a full year of tabs never turns into a wall of buttons. */
export function MonthPicker({
  months,
  value,
  onChange,
}: {
  months: string[];
  value: string;
  onChange: (month: string) => void;
}) {
  const years = useMemo(() => Array.from(new Set(months.map((m) => m.slice(0, 4)))), [months]);
  const [activeYear, setActiveYear] = useState(() => value.slice(0, 4));

  useEffect(() => {
    setActiveYear(value.slice(0, 4));
  }, [value]);

  const monthsInYear = useMemo(() => months.filter((m) => m.startsWith(activeYear)), [months, activeYear]);

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-2 sm:w-auto sm:items-end">
      {years.length > 1 && (
        <div className="flex gap-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setActiveYear(y)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-black transition-colors ${
                y === activeYear ? "bg-vh-lime text-black" : "text-black/35 hover:text-vh-blue"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
      {/* Scrolls sideways on phones rather than wrapping a stray month onto its own line. */}
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border-2 border-vh-line bg-white p-1.5 sm:flex-wrap sm:justify-end sm:overflow-visible">
        {monthsInYear.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`vh-tab ${m === value ? "vh-tab-active" : ""}`}
          >
            {monthShortLabel(m)}
          </button>
        ))}
      </div>
    </div>
  );
}
