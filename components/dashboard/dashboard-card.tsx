import type { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  titleAction?: ReactNode;
}

export function DashboardCard({ title, subtitle, children, className = '', titleAction }: DashboardCardProps) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur ${className}`.trim()}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {titleAction}
      </header>
      {children}
    </section>
  );
}
