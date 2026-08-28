import { describe, expect, it } from 'vitest';
import { isBackfilledSession, isLoggableDate } from './date';

describe('session dates', () => {
  it('accepts today and any valid past date', () => {
    expect(isLoggableDate('2026-08-28', '2026-08-28')).toBe(true);
    expect(isLoggableDate('2020-01-01', '2026-08-28')).toBe(true);
  });

  it('rejects future and invalid dates', () => {
    expect(isLoggableDate('2026-08-29', '2026-08-28')).toBe(false);
    expect(isLoggableDate('2026-02-30', '2026-08-28')).toBe(false);
    expect(isLoggableDate('', '2026-08-28')).toBe(false);
  });

  it('marks a session created after its training date as backfilled', () => {
    const createdAt = new Date('2026-08-28T12:00:00').getTime();
    expect(isBackfilledSession({ date: '2026-08-26', createdAt })).toBe(true);
    expect(isBackfilledSession({ date: '2026-08-28', createdAt })).toBe(false);
  });
});
