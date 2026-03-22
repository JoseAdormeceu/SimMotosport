interface DeltaStatProps {
  label: string;
  value: number;
  delta: number;
}

export function DeltaStat({ label, value, delta }: DeltaStatProps) {
  const deltaPrefix = delta > 0 ? '+' : '';
  const tone = delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-rose-300' : 'text-slate-400';

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-medium text-slate-100">{value}</p>
      <p className={`text-xs ${tone}`}>{delta === 0 ? 'No change' : `${deltaPrefix}${delta} since last update`}</p>
    </div>
  );
}
