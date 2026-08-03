export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="vh-card relative overflow-hidden p-5">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-600 to-gold-400" />
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
