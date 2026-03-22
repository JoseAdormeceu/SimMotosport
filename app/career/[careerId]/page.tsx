'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, DashboardCard, DeltaIndicator, RecentPerformanceList, SectionHeader, StatPill, StatRow } from '@/components/dashboard';
import type { NewsItem, WorldState } from '@/lib/schema';
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

function bandTone(band: 'overperformance' | 'expected' | 'underperformance'): 'good' | 'warn' | 'bad' {
  if (band === 'overperformance') return 'good';
  if (band === 'underperformance') return 'bad';
  return 'warn';
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function findHeadlineTone(item: NewsItem): { label: string; tone: 'neutral' | 'good' | 'warn' | 'bad' | 'accent' } {
  if (item.tags.includes('tone-hype')) return { label: 'Hype', tone: 'accent' };
  if (item.tags.includes('tone-praise')) return { label: 'Praise', tone: 'good' };
  if (item.tags.includes('tone-criticism')) return { label: 'Criticism', tone: 'bad' };
  return { label: 'Neutral', tone: 'neutral' };
}

const actionButton = 'rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700';
const primaryButton = 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500';

export default function CareerDashboardPage() {
  const { world, advanceDay, simulateQualifying, simulateRace, simulateWeekend, applyDecision, submitIntent } = useCareerStore();
  const [intentText, setIntentText] = useState('');
  const rival = world.relationships.find((relationship) => relationship.label === 'rival');
  const ally = world.relationships.find((relationship) => relationship.label === 'ally');
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
  const seasonProgress = Math.round((world.currentSeason.round / world.currentSeason.totalRounds) * 100);

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_50%)] px-4 py-6 text-slate-100 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30">
          <SectionHeader
            eyebrow="PAX Motorsport"
            title="Career Dashboard"
            description="Shape your driver’s life, reputation, and legacy — on and off the circuit."
          />

          <div className="mt-5 flex flex-wrap gap-2">
            <button className={actionButton} onClick={() => advanceDay()}>Advance Day</button>
            <button className={actionButton} onClick={() => simulateQualifying(world.currentSeason.round * 100 + 7)}>Sim Qualifying</button>
            <button className={actionButton} onClick={() => simulateRace(world.currentSeason.round * 100 + 19)}>Sim Race</button>
            <button className={primaryButton} onClick={() => simulateWeekend(world.currentSeason.round * 100 + 31)}>Sim Full Weekend</button>
          </div>

          <div className="mt-5 grid gap-3 rounded-xl border border-slate-800 bg-zinc-900/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill label="Category" value={world.currentCategory.toUpperCase()} />
            <StatPill label="Round" value={`${world.currentSeason.round}/${world.currentSeason.totalRounds}`} />
            <StatPill label="Season Progress" value={`${seasonProgress}%`} />
            <StatPill label="Current Team" value={world.teams[0]?.name ?? 'Unsigned'} />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <DashboardCard
            title="Define Your Next Move"
            subtitle="Player expression drives your story arc"
            className="lg:col-span-2"
          >
            <textarea
              value={intentText}
              onChange={(event) => setIntentText(event.target.value)}
              className="min-h-44 w-full rounded-xl border border-slate-700 bg-zinc-900/70 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              placeholder={'Visit Verstappen to learn from him\nIgnore media and focus on qualifying\nTrain aggressively before the next race\nSpend time with the team to rebuild trust'}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className={primaryButton}
                onClick={() => {
                  submitIntent(intentText);
                  setIntentText('');
                }}
              >
                Commit Intent
              </button>
              <p className="text-sm text-slate-400">Your intent influences relationships, confidence, events, and upcoming race preparation.</p>
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Last submitted intent</p>
              {world.playerIntent ? (
                <>
                  <p className="mt-2 text-sm text-slate-200">{world.playerIntent.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {world.playerIntent.tags.map((tag, index) => (
                      <Badge key={`intent-tag-${tag}-${index}`} label={tag} tone="accent" />
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No intent submitted yet.</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard title="Driver Story Snapshot" subtitle="Current protagonist and career state">
            <p className="text-2xl font-semibold text-slate-100">{world.player.name}</p>
            <p className="mt-1 text-sm text-slate-400">{world.player.nationality} · {titleCase(world.player.archetype)}</p>
            <p className="mt-3 rounded-lg border border-slate-800 bg-zinc-900/70 px-3 py-2 text-sm text-slate-300">{world.teams[0]?.name ?? 'No team assigned'}</p>

            <div className="mt-4 space-y-1">
              <StatRow label="Popularity" value={world.player.publicImage.popularity} />
              <StatRow label="Confidence" value={world.confidence} />
              <StatRow label="Controversy" value={world.player.publicImage.controversy} />
              <StatRow label="Team Trust" value={world.teams[0]?.trustInPlayer ?? 0} />
              <StatRow label="Morale" value={world.teams[0]?.morale ?? 0} />
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <DashboardCard title="Momentum" subtitle="Narrative continuity across recent rounds">
            <div className="flex flex-wrap gap-2">
              <Badge label={`Form: ${titleCase(world.form)}`} tone={formTone(world.form)} />
              <Badge label={`Arc: ${titleCase(world.narrativeArc)}`} tone={arcTone(world.narrativeArc)} />
              {latestTrend ? <Badge label={`Latest: ${titleCase(latestTrend.band)}`} tone={bandTone(latestTrend.band)} /> : null}
            </div>
            <p className="mt-3 text-sm text-slate-400">Momentum carries from weekend to weekend and shapes pressure, hype, and opportunity.</p>
            <div className="mt-4">
              <RecentPerformanceList items={world.recentPerformance} />
            </div>
          </DashboardCard>

          <DashboardCard title="Latest Weekend Analysis" subtitle="How did you perform against expectations?">
            {world.lastWeekend && latestTrend ? (
              <div className="space-y-1">
                <StatRow label="Track" value={world.lastWeekend.venue} valueClassName="text-slate-100" />
                <StatRow label="Expected Finish" value={`P${latestTrend.expectedPosition}`} />
                <StatRow label="Qualifying" value={`P${world.lastWeekend.qualifyingPosition}`} />
                <StatRow label="Race Result" value={`P${world.lastWeekend.racePosition}`} />
                <StatRow label="Points" value={world.lastWeekend.pointsEarned} />
                <div className="pt-2">
                  <Badge label={titleCase(latestTrend.band)} tone={bandTone(latestTrend.band)} />
                </div>
                <p className="pt-2 text-sm text-slate-400">
                  {latestTrend.band === 'overperformance'
                    ? 'You exceeded baseline expectations and elevated your paddock narrative.'
                    : latestTrend.band === 'underperformance'
                      ? 'You fell below the expected benchmark, increasing scrutiny for the next round.'
                      : 'You matched expected output, preserving stability heading into the next weekend.'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No completed weekend yet. Simulate qualifying and race sessions to generate analysis.</p>
            )}
          </DashboardCard>

          <DashboardCard title="Decision Queue" subtitle="Resolve active narrative events">
            {activeEvent ? (
              <>
                <p className="text-sm text-slate-300">{activeEvent.title}</p>
                <p className="mt-2 text-sm text-slate-400">{activeEvent.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeEvent.choices.map((choice) => (
                    <button
                      key={choice.id}
                      className="rounded-xl border border-amber-500/40 bg-amber-600/90 px-3 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-500"
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
              </>
            ) : (
              <p className="text-sm text-slate-400">No pending decision. The world will push new choices after major weekends and narrative swings.</p>
            )}
          </DashboardCard>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <DashboardCard title="Recent Changes" subtitle="Impact from your latest action">
            <div className="space-y-2">
              <DeltaIndicator label="Confidence" value={deltas.confidence} />
              <DeltaIndicator label="Team Trust" value={deltas.trust} />
              <DeltaIndicator label="Morale" value={deltas.morale} />
              <DeltaIndicator label="Popularity" value={deltas.popularity} />
              <DeltaIndicator label="Controversy" value={deltas.controversy} />
            </div>
          </DashboardCard>

          <DashboardCard title="World Reaction" subtitle="Latest media pulse">
            <ul className="space-y-2">
              {world.newsFeed.length ? (
                world.newsFeed.slice(0, 5).map((item, index) => {
                  const tone = findHeadlineTone(item);
                  return (
                    <li key={`${item.id}-${index}`} className="rounded-xl border border-slate-800 bg-zinc-900/70 px-3 py-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge label={tone.label} tone={tone.tone} />
                      </div>
                      <p className="text-sm text-slate-200">{item.headline}</p>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-xl border border-slate-800 bg-zinc-900/70 px-3 py-3 text-sm text-slate-400">No headlines yet.</li>
              )}
            </ul>
          </DashboardCard>

          <DashboardCard title="Paddock Relationships" subtitle="Living social context around your career">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-zinc-900/70 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-100">Main Rival</p>
                  <Badge label="Rival" tone="bad" />
                </div>
                <StatRow label="Trust" value={rival?.trust ?? 0} />
                <StatRow label="Hostility" value={rival?.hostility ?? 0} valueClassName="text-rose-300" />
                <StatRow label="Closeness" value={rival?.closeness ?? 0} />
              </div>

              <div className="rounded-xl border border-slate-800 bg-zinc-900/70 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-100">Main Ally</p>
                  <Badge label="Ally" tone="good" />
                </div>
                <StatRow label="Trust" value={ally?.trust ?? 0} valueClassName="text-emerald-300" />
                <StatRow label="Hostility" value={ally?.hostility ?? 0} />
                <StatRow label="Closeness" value={ally?.closeness ?? 0} />
              </div>
            </div>
          </DashboardCard>
        </section>
      </div>
    </main>
  );
}
