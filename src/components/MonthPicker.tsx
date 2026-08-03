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
    <div className="flex flex-col items-end gap-2">
      {years.length > 1 && (
        <div className="flex gap-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setActiveYear(y)}
              className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
                y === activeYear ? "text-brand-700" : "text-ink-400 hover:text-brand-600"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-1.5 rounded-xl2 border border-ink-100 bg-white p-1.5">
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
