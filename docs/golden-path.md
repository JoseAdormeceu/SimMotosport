# Golden Path Manual Scenario

Use this deterministic scenario to manually verify the vertical loop:

1. Open `/new-career`.
2. Create a career with default values.
3. Go to `/career/local`.
4. Click **Sim Qualifying** (seed derived from round).
5. Click **Sim Race**.
6. Observe:
   - latest weekend card updates with Q/R positions and points,
   - news feed gains qualifying and race headlines,
   - a decision card appears.
7. Click the first decision option.
8. Confirm state changed:
   - decision card disappears,
   - player/team metrics change,
   - history receives a new entry.

Expected deterministic test seed reference: `simulateWeekend(777)` should produce identical `lastWeekend` across fresh runs.
