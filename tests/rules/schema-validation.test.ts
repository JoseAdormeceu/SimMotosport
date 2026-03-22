import { describe, expect, test } from 'vitest';
import { driverProfileSchema, worldStateSchema } from '@/lib/schema';
import { useCareerStore } from '@/lib/store/career-store';

describe('schema validation', () => {
  test('validates sample world from store', () => {
    const parsed = worldStateSchema.safeParse(useCareerStore.getState().world);
    expect(parsed.success).toBe(true);
  });

  test('rejects invalid driver skill values', () => {
    const parsed = driverProfileSchema.safeParse({
      id: 'x',
      name: 'Invalid Driver',
      age: 20,
      nationality: 'US',
      archetype: 'prodigy',
      traits: {},
      skills: {
        rawPace: 101,
        qualifyingPace: 80,
        racePace: 80,
        tyreManagement: 80,
        wetWeather: 80,
        consistency: 80,
        racecraft: 80,
        starts: 80,
        adaptability: 80,
        pressureHandling: 80,
        feedbackQuality: 80,
        developmentInfluence: 80,
      },
      personality: {
        aggression: 50,
        discipline: 50,
        confidence: 50,
        ego: 50,
        diplomacy: 50,
        honesty: 50,
        ruthlessness: 50,
        independence: 50,
        mediaSavvy: 50,
        loyalty: 50,
      },
      values: {},
      publicImage: {
        popularity: 50,
        respect: 50,
        controversy: 50,
        mystique: 50,
        authenticity: 50,
        villainAura: 50,
        superstarAura: 50,
      },
      hiddenModifiers: {},
    });

    expect(parsed.success).toBe(false);
  });
});
