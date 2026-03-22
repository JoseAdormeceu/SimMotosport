'use client';

import { useCareerStore } from '@/lib/store/career-store';

export default function CareerDashboardPage() {
  const { world, advanceDay, simulateQualifying, simulateRace, simulateWeekend, applyDecision } = useCareerStore();
  const rival = world.relationships.find((r) => r.label === 'rival');
  const ally = world.relationships.find((r) => r.label === 'ally');
  const activeEvent = world.inbox[0];

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold">Career Dashboard</h1>

      <section className="flex flex-wrap gap-2">
        <button className="rounded bg-slate-700 px-3 py-2 text-sm" onClick={() => advanceDay()}>
          Advance Day
        </button>
        <button className="rounded bg-blue-700 px-3 py-2 text-sm" onClick={() => simulateQualifying(world.currentSeason.round * 100 + 7)}>
          Sim Qualifying
        </button>
        <button className="rounded bg-indigo-700 px-3 py-2 text-sm" onClick={() => simulateRace(world.currentSeason.round * 100 + 19)}>
          Sim Race
        </button>
        <button className="rounded bg-emerald-700 px-3 py-2 text-sm" onClick={() => simulateWeekend(world.currentSeason.round * 100 + 31)}>
          Sim Full Weekend
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Player</h2>
          <p className="mt-2 text-xl font-medium">{world.player.name}</p>
          <p className="text-slate-300">{world.player.nationality} · {world.player.archetype}</p>
          <p className="mt-2 text-slate-200">Popularity {world.player.publicImage.popularity} · Confidence {world.confidence}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Team</h2>
          <p className="mt-2 text-xl font-medium">{world.teams[0]?.name ?? 'No team'}</p>
          <p className="text-slate-300">Car strength {world.teams[0]?.carStrength ?? '-'}</p>
          <p className="mt-2 text-slate-200">Trust {world.teams[0]?.trustInPlayer ?? '-'} · Morale {world.teams[0]?.morale ?? '-'}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Season Snapshot</h2>
          <p className="mt-2 text-xl font-medium">{world.currentSeason.year} {world.currentSeason.category.toUpperCase()}</p>
          <p className="text-slate-300">Round {world.currentSeason.round}/{world.currentSeason.totalRounds} · {world.currentSeason.weekendStage}</p>
          <p className="mt-2 text-slate-200">Points {world.currentSeason.playerPoints}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Latest Weekend</h2>
          {world.lastWeekend ? (
            <>
              <p className="mt-2 text-lg font-medium">{world.lastWeekend.venue}</p>
              <p className="text-slate-300">Q: P{world.lastWeekend.qualifyingPosition} · R: P{world.lastWeekend.racePosition}</p>
              <p className="text-slate-200">Points: {world.lastWeekend.pointsEarned}</p>
            </>
          ) : (
            <p className="mt-2 text-slate-300">No weekend simulated yet.</p>
          )}
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Recent Headlines</h2>
          <ul className="mt-2 space-y-2 text-slate-200">
            {world.newsFeed.length ? world.newsFeed.slice(0, 3).map((item) => <li key={item.id}>• {item.headline}</li>) : <li>• No headlines yet.</li>}
          </ul>
        </article>
      </section>

      {activeEvent && (
        <section className="rounded-xl border border-amber-700/60 bg-amber-950/30 p-4">
          <h2 className="text-sm uppercase text-amber-200">Decision Pending</h2>
          <p className="mt-1 text-lg font-medium text-amber-50">{activeEvent.title}</p>
          <p className="text-amber-100/90">{activeEvent.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeEvent.choices.map((choice) => (
              <button
                key={choice.id}
                className="rounded bg-amber-700 px-3 py-2 text-sm text-white"
                onClick={() =>
                  applyDecision({
                    id: `decision-${choice.id}-${world.currentDate}`,
                    eventInstanceId: activeEvent.id,
                    choiceId: choice.id,
                    decidedAt: world.currentDate,
                  })
                }
              >
                {choice.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Active Rival</h2>
          <p className="mt-2 text-slate-200">Hostility {rival?.hostility ?? 0} · Trust {rival?.trust ?? 0}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm uppercase text-slate-400">Active Ally</h2>
          <p className="mt-2 text-slate-200">Trust {ally?.trust ?? 0} · Closeness {ally?.closeness ?? 0}</p>
        </article>
      </section>
    </main>
  );
}
