export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-vh-line bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-vh-blue text-vh-lime">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      </div>
      <h3 className="text-lg font-black uppercase tracking-tight text-black">{title}</h3>
      <p className="max-w-sm text-sm font-bold text-black/40">{description}</p>
    </div>
  );
}
