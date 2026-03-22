interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-slate-800 text-slate-200 border-slate-700',
  good: 'bg-emerald-900/70 text-emerald-200 border-emerald-700/80',
  warn: 'bg-amber-900/60 text-amber-200 border-amber-700/70',
  bad: 'bg-rose-900/60 text-rose-200 border-rose-700/80',
  accent: 'bg-blue-900/70 text-blue-200 border-blue-700/80',
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>{label}</span>;
}
