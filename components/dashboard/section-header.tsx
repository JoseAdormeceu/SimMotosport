interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div>
      {eyebrow ? <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p> : null}
      <h1 className="mt-1 text-3xl font-semibold text-slate-100">{title}</h1>
      {description ? <p className="mt-2 text-base text-slate-400">{description}</p> : null}
    </div>
  );
}
