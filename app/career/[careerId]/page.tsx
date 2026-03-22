'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

const actionButton = 'rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-500';

export default function CareerDashboardPage() {
  const { world, advanceDay, simulateQualifying, simulateRace, simulateWeekend, applyDecision, submitIntent } = useCareerStore();
  const [intentText, setIntentText] = useState('');
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
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 p-6 lg:p-8">
      <header className="rounded-2xl border border-slate-800/80 bg-zinc-900/70 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100 lg:text-3xl">Career Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Simulate sessions, resolve decisions, and track momentum at a glance.</p>
      </header>

      <section className="flex flex-wrap gap-3">
        <button className={actionButton} onClick={() => advanceDay()}>Advance Day</button>
        <button className={actionButton} onClick={() => simulateQualifying(world.currentSeason.round * 100 + 7)}>Sim Qualifying</button>
        <button className={actionButton} onClick={() => simulateRace(world.currentSeason.round * 100 + 19)}>Sim Race</button>
        <button className={actionButton} onClick={() => simulateWeekend(world.currentSeason.round * 100 + 31)}>Sim Full Weekend</button>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Driver & Team">
          <p className="text-xl font-semibold text-slate-100">{world.player.name}</p>
          <p className="text-sm text-slate-400">{world.player.nationality} · {world.player.archetype}</p>
          <p className="mt-3 text-sm text-slate-200">Team: <span className="font-medium">{world.teams[0]?.name ?? 'No team'}</span></p>
          <p className="text-sm text-slate-400">Round {world.currentSeason.round}/{world.currentSeason.totalRounds} · {world.currentSeason.weekendStage}</p>
        </SectionCard>

        <SectionCard title="Momentum" subtitle="Short-term narrative state">
          <div className="flex flex-wrap gap-2">
            <Badge label={`Form: ${world.form}`} tone={formTone(world.form)} />
            <Badge label={`Arc: ${world.narrativeArc}`} tone={arcTone(world.narrativeArc)} />
            {latestTrend ? <Badge label={`Latest: ${latestTrend.band}`} tone={latestTrend.band === 'overperformance' ? 'good' : latestTrend.band === 'underperformance' ? 'bad' : 'warn'} /> : null}
          </div>
          <p className="mt-3 text-sm text-slate-400">Recent form reflects your last five race weekends and influences paddock reactions.</p>
        </SectionCard>

        <SectionCard title="Latest Weekend Analysis" subtitle="Expectation vs result">
          {world.lastWeekend && latestTrend ? (
            <>
              <p className="text-sm text-slate-200">{world.lastWeekend.venue}</p>
              <p className="mt-1 text-sm text-slate-300">Qualifying <span className="font-medium text-slate-100">P{world.lastWeekend.qualifyingPosition}</span> · Race <span className="font-medium text-slate-100">P{world.lastWeekend.racePosition}</span></p>
              <p className="text-sm text-slate-300">Expected <span className="font-medium text-slate-100">P{latestTrend.expectedPosition}</span> · Result <span className="font-medium text-slate-100">P{latestTrend.finishPosition}</span></p>
              <p className="mt-2 text-sm text-slate-400">Points earned: {world.lastWeekend.pointsEarned}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No completed weekend yet.</p>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Recent Performance History" subtitle="Last five rounds timeline">
          <RecentPerformanceList items={world.recentPerformance} />
        </SectionCard>

        <SectionCard title="Recent Changes" subtitle="Live deltas from latest action">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DeltaStat label="Confidence" value={world.confidence} delta={deltas.confidence} />
            <DeltaStat label="Team Trust" value={world.teams[0]?.trustInPlayer ?? 0} delta={deltas.trust} />
            <DeltaStat label="Morale" value={world.teams[0]?.morale ?? 0} delta={deltas.morale} />
            <DeltaStat label="Popularity" value={world.player.publicImage.popularity} delta={deltas.popularity} />
            <DeltaStat label="Controversy" value={world.player.publicImage.controversy} delta={deltas.controversy} />
          </div>
        </SectionCard>

        <SectionCard title="Define Your Next Move" subtitle="Player-driven intent">
          <textarea
            value={intentText}
            onChange={(event) => setIntentText(event.target.value)}
            className="min-h-28 w-full rounded-xl border border-slate-700 bg-zinc-900/70 p-3 text-sm text-slate-100 placeholder:text-slate-500"
            placeholder={'Train aggressively for next race\nVisit a rival driver to build relationship\nIgnore media and focus on performance'}
          />
          <button
            className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            onClick={() => {
              submitIntent(intentText);
              setIntentText('');
            }}
          >
            Confirm Intent
          </button>
          {world.playerIntent ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-400">Last intent: <span className="text-slate-200">{world.playerIntent.text}</span></p>
              <div className="flex flex-wrap gap-2">
                {world.playerIntent.tags.map((tag, index) => (
                  <Badge key={`intent-tag-${tag}-${index}`} label={tag} tone="accent" />
                ))}
              </div>
              <p className="text-xs text-slate-400">Intent will influence next weekend and events.</p>
            </div>
          ) : null}
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Recent Headlines">
          <ul className="space-y-2 text-sm text-slate-200">
            {world.newsFeed.length
              ? world.newsFeed.slice(0, 4).map((item, index) => (
                  <li key={`${item.id}-${index}`} className="rounded-xl border border-slate-800/90 bg-zinc-900/60 px-4 py-3">{item.headline}</li>
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
                  className="rounded-xl bg-amber-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-amber-500"
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
            <p className="text-sm text-slate-300">Rival: hostility <span className="font-medium text-slate-100">{rival?.hostility ?? 0}</span>, trust <span className="font-medium text-slate-100">{rival?.trust ?? 0}</span></p>
            <p className="mt-2 text-sm text-slate-300">Ally: trust <span className="font-medium text-slate-100">{ally?.trust ?? 0}</span>, closeness <span className="font-medium text-slate-100">{ally?.closeness ?? 0}</span></p>
          </SectionCard>
        )}
      </section>
    </main>
  );
}
