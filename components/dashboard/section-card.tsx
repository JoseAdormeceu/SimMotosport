import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
      <header className="mb-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </header>
      {children}
    </article>
  );
}
