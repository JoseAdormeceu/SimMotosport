interface DeltaStatProps {
  label: string;
  value: number;
  delta: number;
}

export function DeltaStat({ label, value, delta }: DeltaStatProps) {
  const deltaPrefix = delta > 0 ? '+' : '';
  const tone = delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-rose-300' : 'text-slate-400';

  return (
    <div className="rounded-xl border border-slate-800/90 bg-zinc-900/70 p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
      <p className={`mt-1 text-xs ${tone}`}>{delta === 0 ? 'No change' : `${deltaPrefix}${delta} since last update`}</p>
    </div>
  );
}
