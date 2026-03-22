interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-slate-800 text-slate-200 border-slate-700',
  good: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/70',
  warn: 'bg-amber-900/50 text-amber-200 border-amber-700/60',
  bad: 'bg-rose-900/50 text-rose-200 border-rose-700/70',
  accent: 'bg-indigo-900/60 text-indigo-200 border-indigo-700/70',
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${toneClasses[tone]}`}>{label}</span>;
}
