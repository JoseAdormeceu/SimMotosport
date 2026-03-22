import type { RecentPerformanceItem } from '@/lib/schema';
import { Badge } from './badge';

interface RecentPerformanceListProps {
  items: RecentPerformanceItem[];
}

function bandTone(band: RecentPerformanceItem['band']): 'good' | 'neutral' | 'bad' {
  if (band === 'overperformance') return 'good';
  if (band === 'underperformance') return 'bad';
  return 'warn';
}

export function RecentPerformanceList({ items }: RecentPerformanceListProps) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">No race trend data yet.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {[...items].reverse().map((item) => (
        <li key={`rp-${item.round}`} className="flex items-center justify-between rounded-xl border border-slate-800/90 bg-zinc-900/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-100">Round {item.round}: P{item.finishPosition}</p>
            <p className="text-xs text-slate-400">Expected P{item.expectedPosition} · {item.points} pts</p>
          </div>
          <Badge label={item.band.replace('-', ' ')} tone={bandTone(item.band)} />
        </li>
      ))}
    </ul>
  );
}
