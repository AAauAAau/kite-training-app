import { describe, expect, it } from 'vitest';
import { mobilityChecklists } from '../data/seed';
import type { Session, SessionType } from '../types';
import { hipItemsForSession, offersPostSessionHip } from './mobility';

function session(entries: Session['entries'] = []): Session {
  return { id: 'session', date: '2026-08-28', type: 'B', entries, createdAt: 1 };
}

describe('post-session hip routine', () => {
  it('is offered only after A, B, rings, KB and kite sessions', () => {
    const allTypes: SessionType[] = ['A', 'B', 'RINGS', 'KB', 'SPRINT', 'MOBILITY', 'KITE', 'PADEL', 'BOARD_OFF', 'OTHER'];
    expect(allTypes.filter(offersPostSessionHip)).toEqual(['A', 'B', 'RINGS', 'KB', 'KITE']);
  });

  it('hides Copenhagen when it was already part of the same session', () => {
    const items = mobilityChecklists.find((template) => template.variant === 'hip')!.items;
    const visible = hipItemsForSession(items, session([{ exerciseId: 'copenhagen-plank', sets: [] }]));
    expect(visible.map((item) => item.id)).not.toContain('hip-copenhagen-plank');
    expect(visible).toHaveLength(4);
  });

  it('keeps Copenhagen when the same session did not contain it', () => {
    const items = mobilityChecklists.find((template) => template.variant === 'hip')!.items;
    expect(hipItemsForSession(items, session()).map((item) => item.id)).toContain('hip-copenhagen-plank');
  });
});
