interface StatRowProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

export function StatRow({ label, value, valueClassName = 'text-slate-100' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/70 py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-sm font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}
