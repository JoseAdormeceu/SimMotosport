interface DeltaIndicatorProps {
  label: string;
  value: number;
}

export function DeltaIndicator({ label, value }: DeltaIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const tone = isPositive ? 'text-emerald-300' : isNegative ? 'text-rose-300' : 'text-slate-400';
  const sign = isPositive ? '+' : '';

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-zinc-900/70 px-3 py-2">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-sm font-semibold ${tone}`}>{isNegative || isPositive ? `${sign}${value}` : '0'}</span>
    </div>
  );
}
