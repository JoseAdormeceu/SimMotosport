import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800/90 bg-slate-900/85 p-6 shadow-lg shadow-black/20">
      <header className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-100">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
      </header>
      {children}
    </article>
  );
}
