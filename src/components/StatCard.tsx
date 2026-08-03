export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  /** Highlight the headline metric in lime. */
  accent?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[1.5rem] border-2 p-5 transition-all duration-200 ${
        accent ? "border-vh-lime bg-vh-lime" : "border-vh-line bg-white"
      }`}
    >
      <p className={`text-[11px] font-black uppercase tracking-wide ${accent ? "text-black/60" : "text-black/40"}`}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums leading-none text-black">{value}</p>
      {hint && (
        <p className={`mt-1.5 text-[11px] font-bold ${accent ? "text-black/50" : "text-black/35"}`}>{hint}</p>
      )}
    </div>
  );
}
