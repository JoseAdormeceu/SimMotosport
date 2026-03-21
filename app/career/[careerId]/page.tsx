'use client';

import { useCareerStore } from '@/lib/store/career-store';

export default function CareerDashboardPage() {
  const world = useCareerStore((s) => s.world);
  const rival = world.relationships.find((r) => r.label === 'rival');
  const ally = world.relationships.find((r) => r.label === 'ally');

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold">Career Dashboard</h1>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Player</h2>
          <p className="mt-2 text-xl font-medium">{world.player.name}</p>
          <p className="text-slate-300">{world.player.nationality} · {world.player.archetype}</p>
          <p className="mt-2 text-slate-200">Popularity {world.player.publicImage.popularity}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Team</h2>
          <p className="mt-2 text-xl font-medium">{world.teams[0]?.name ?? 'No team'}</p>
          <p className="text-slate-300">Car strength {world.teams[0]?.carStrength ?? '-'}</p>
          <p className="mt-2 text-slate-200">Trust {world.teams[0]?.trustInPlayer ?? '-'}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Season Snapshot</h2>
          <p className="mt-2 text-xl font-medium">{world.currentSeason.year} {world.currentSeason.category.toUpperCase()}</p>
          <p className="text-slate-300">Round {world.currentSeason.round}/{world.currentSeason.totalRounds}</p>
          <p className="mt-2 text-slate-200">P{world.currentSeason.championshipPosition}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Next Weekend</h2>
          <p className="mt-2 text-lg font-medium">{world.currentSeason.nextVenue}</p>
          <p className="text-slate-300">Phase: {world.currentSeason.phase}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Recent Headlines</h2>
          <ul className="mt-2 space-y-2 text-slate-200">
            {world.newsFeed.length ? world.newsFeed.slice(0, 3).map((item) => <li key={item.id}>• {item.headline}</li>) : <li>• No headlines yet.</li>}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Active Rival</h2>
          <p className="mt-2 text-slate-200">Hostility {rival?.hostility ?? 0} · Respect {rival?.respect ?? 0}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Active Ally</h2>
          <p className="mt-2 text-slate-200">Trust {ally?.trust ?? 0} · Closeness {ally?.closeness ?? 0}</p>
        </article>
      </section>
    </main>
  );
}
