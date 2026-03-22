'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Badge, DeltaStat, RecentPerformanceList, SectionCard } from '@/components/dashboard';
import type { WorldState } from '@/lib/schema';
import { useCareerStore } from '@/lib/store/career-store';

function arcTone(arc: WorldState['narrativeArc']): 'accent' | 'warn' | 'bad' | 'good' | 'neutral' {
  if (arc === 'breakout-run' || arc === 'recovery') return 'good';
  if (arc === 'pressure-building') return 'warn';
  if (arc === 'slump') return 'bad';
  if (arc === 'consistency-streak') return 'accent';
  return 'neutral';
}

function formTone(form: WorldState['form']): 'good' | 'bad' | 'neutral' | 'warn' {
  if (form === 'improving') return 'good';
  if (form === 'declining') return 'bad';
  if (form === 'volatile') return 'warn';
  return 'neutral';
}

export default function CareerDashboardPage() {
  const { world, advanceDay, simulateQualifying, simulateRace, simulateWeekend, applyDecision } = useCareerStore();
  const rival = world.relationships.find((r) => r.label === 'rival');
  const ally = world.relationships.find((r) => r.label === 'ally');
  const activeEvent = world.inbox[0];

  const previousWorldRef = useRef<WorldState | null>(null);
  const previous = previousWorldRef.current;

  useEffect(() => {
    previousWorldRef.current = world;
  }, [world]);

  const deltas = useMemo(
    () => ({
      confidence: previous ? world.confidence - previous.confidence : 0,
      trust: previous ? (world.teams[0]?.trustInPlayer ?? 0) - (previous.teams[0]?.trustInPlayer ?? 0) : 0,
      morale: previous ? (world.teams[0]?.morale ?? 0) - (previous.teams[0]?.morale ?? 0) : 0,
      popularity: previous ? world.player.publicImage.popularity - previous.player.publicImage.popularity : 0,
      controversy: previous ? world.player.publicImage.controversy - previous.player.publicImage.controversy : 0,
    }),
    [previous, world],
  );

  const latestTrend = world.recentPerformance[world.recentPerformance.length - 1];

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Career Dashboard</h1>
        <p className="text-sm text-slate-400">Simulate sessions, resolve decisions, and track momentum at a glance.</p>
      </header>

      <section className="flex flex-wrap gap-2">
        <button className="rounded bg-slate-700 px-3 py-2 text-sm" onClick={() => advanceDay()}>Advance Day</button>
        <button className="rounded bg-blue-700 px-3 py-2 text-sm" onClick={() => simulateQualifying(world.currentSeason.round * 100 + 7)}>Sim Qualifying</button>
        <button className="rounded bg-indigo-700 px-3 py-2 text-sm" onClick={() => simulateRace(world.currentSeason.round * 100 + 19)}>Sim Race</button>
        <button className="rounded bg-emerald-700 px-3 py-2 text-sm" onClick={() => simulateWeekend(world.currentSeason.round * 100 + 31)}>Sim Full Weekend</button>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Driver & Team">
          <p className="text-xl font-medium">{world.player.name}</p>
          <p className="text-sm text-slate-300">{world.player.nationality} · {world.player.archetype}</p>
          <p className="mt-2 text-sm text-slate-200">Team: {world.teams[0]?.name ?? 'No team'}</p>
          <p className="text-sm text-slate-400">Round {world.currentSeason.round}/{world.currentSeason.totalRounds} · {world.currentSeason.weekendStage}</p>
        </SectionCard>

        <SectionCard title="Momentum" subtitle="Short-term narrative state">
          <div className="flex flex-wrap gap-2">
            <Badge label={`Form: ${world.form}`} tone={formTone(world.form)} />
            <Badge label={`Arc: ${world.narrativeArc}`} tone={arcTone(world.narrativeArc)} />
            {latestTrend ? <Badge label={`Latest: ${latestTrend.band}`} tone={latestTrend.band === 'overperformance' ? 'good' : latestTrend.band === 'underperformance' ? 'bad' : 'neutral'} /> : null}
          </div>
          <p className="mt-3 text-sm text-slate-300">Recent form reflects your last five race weekends and drives event pressure/hype direction.</p>
        </SectionCard>

        <SectionCard title="Latest Weekend Analysis" subtitle="Expectation vs result">
          {world.lastWeekend && latestTrend ? (
            <>
              <p className="text-sm text-slate-200">{world.lastWeekend.venue}</p>
              <p className="mt-1 text-sm text-slate-300">Qualifying P{world.lastWeekend.qualifyingPosition} · Race P{world.lastWeekend.racePosition}</p>
              <p className="text-sm text-slate-300">Expected P{latestTrend.expectedPosition} · Result P{latestTrend.finishPosition}</p>
              <p className="mt-2 text-sm text-slate-400">Points earned: {world.lastWeekend.pointsEarned}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No completed weekend yet.</p>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Recent Performance History" subtitle="Last five rounds timeline">
          <RecentPerformanceList items={world.recentPerformance} />
        </SectionCard>

        <SectionCard title="Recent Changes" subtitle="Live deltas from latest action">
          <div className="grid grid-cols-2 gap-3">
            <DeltaStat label="Confidence" value={world.confidence} delta={deltas.confidence} />
            <DeltaStat label="Team Trust" value={world.teams[0]?.trustInPlayer ?? 0} delta={deltas.trust} />
            <DeltaStat label="Morale" value={world.teams[0]?.morale ?? 0} delta={deltas.morale} />
            <DeltaStat label="Popularity" value={world.player.publicImage.popularity} delta={deltas.popularity} />
            <DeltaStat label="Controversy" value={world.player.publicImage.controversy} delta={deltas.controversy} />
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Recent Headlines">
          <ul className="space-y-2 text-sm text-slate-200">
            {world.newsFeed.length
              ? world.newsFeed.slice(0, 4).map((item, index) => (
                  <li key={`${item.id}-${index}`} className="rounded border border-slate-800 bg-slate-950/50 px-3 py-2">{item.headline}</li>
                ))
              : <li key="no-headlines" className="text-slate-400">No headlines yet.</li>}
          </ul>
        </SectionCard>

        {activeEvent ? (
          <SectionCard title="Decision Pending" subtitle={activeEvent.title}>
            <p className="text-sm text-slate-300">{activeEvent.description}</p>
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
          </SectionCard>
        ) : (
          <SectionCard title="Paddock Relationships">
            <p className="text-sm text-slate-200">Rival: hostility {rival?.hostility ?? 0}, trust {rival?.trust ?? 0}</p>
            <p className="mt-2 text-sm text-slate-200">Ally: trust {ally?.trust ?? 0}, closeness {ally?.closeness ?? 0}</p>
          </SectionCard>
        )}
      </section>
    </main>
  );
}
