export const headlineTemplates = {
  overperformance: {
    praise: [
      '{driver} drags the car to P{finish} in a statement drive at {venue}',
      'Brilliant P{finish} from {driver} puts paddock on notice',
      '{driver} overdelivers again with a clinical P{finish}',
    ],
    hype: [
      'Hype explodes: {driver} storms to P{finish} and rewrites expectations',
      '{driver} fuels title buzz after stunning P{finish} at {venue}',
      'P{finish} heroics: {driver} turns whispers into headlines',
    ],
    neutral: [
      '{driver} beats projections with P{finish} at {venue}',
      'Over target: {driver} converts pace into P{finish}',
    ],
    criticism: [
      'Despite off-track noise, {driver} still secures P{finish}',
      '{driver} answers doubters with P{finish} result',
    ],
  },
  expected: {
    neutral: [
      '{driver} finishes P{finish} in line with weekend pace',
      'No surprises: {driver} brings home P{finish} at {venue}',
      'Measured execution nets {driver} a P{finish} finish',
    ],
    praise: [
      'Solid and composed: {driver} converts opportunity into P{finish}',
      '{driver} executes cleanly for expected P{finish}',
    ],
    criticism: [
      'P{finish} leaves little movement for {driver} this weekend',
      '{driver} stays in expected window with P{finish}',
    ],
    hype: [
      'P{finish} keeps {driver} in the conversation heading to next round',
      '{driver} banks a useful P{finish} amid rising pressure',
    ],
  },
  underperformance: {
    criticism: [
      '{driver} slips to P{finish} after a difficult race at {venue}',
      'Under pressure, {driver} settles for P{finish}',
      'Questions grow as {driver} misses target with P{finish}',
    ],
    neutral: [
      '{driver} falls short of projection with P{finish}',
      'Tough outing: {driver} records P{finish}',
    ],
    praise: [
      'Damage limitation: {driver} salvages P{finish} on a rough weekend',
      'After setbacks, {driver} rescues P{finish}',
    ],
    hype: [
      'Pressure spikes as {driver} leaves {venue} with P{finish}',
      'P{finish} intensifies spotlight on {driver} ahead of next round',
    ],
  },
} as const;
