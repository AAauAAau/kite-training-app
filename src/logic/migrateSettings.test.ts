import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../data/seed';
import { migrateSettings } from './migrateSettings';

describe('migrateSettings', () => {
  it('renames a legacy hamburgDays field to gymDays', () => {
    const migrated = migrateSettings({
      id: 'settings', bodyweightLog: [], loadThreshold7d: 10, hamburgDays: [1, 5], kiteFocusTags: []
    });
    expect(migrated.gymDays).toEqual([1, 5]);
    expect('hamburgDays' in migrated).toBe(false);
  });

  it('keeps an explicit gymDays value over a legacy hamburgDays', () => {
    expect(migrateSettings({ hamburgDays: [1], gymDays: [2, 3] }).gymDays).toEqual([2, 3]);
  });

  it('fills missing fields from defaultSettings', () => {
    expect(migrateSettings({}).gymDays).toEqual(defaultSettings.gymDays);
    expect(migrateSettings(undefined)).toEqual(defaultSettings);
  });

  it('preserves unrelated persisted fields', () => {
    const migrated = migrateSettings({
      hamburgDays: [2], loadThreshold7d: 14,
      injuries: [{ region: 'knee', since: '2026-01-01', until: '2026-01-15' }]
    });
    expect(migrated.loadThreshold7d).toBe(14);
    expect(migrated.injuries).toHaveLength(1);
  });
});
