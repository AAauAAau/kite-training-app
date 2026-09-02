import { describe, expect, it } from 'vitest';
import { boardOffLevels } from '../data/seed';
import type { BoardOffAssessment } from './boardoff';
import { boardOffLevelSlots, levelNeedsRig, recommendBoardOffLevel } from './boardoff';

const ready: BoardOffAssessment = {
  hasRig: true,
  activeCompression: true,
  longSit30s: true,
  shoulderFlexion: true,
  deadHang: 'over30',
  tailGrab: false,
  oneFooter: false,
  boardOffByFin: false,
  boardOffByHandle: false
};

describe('recommendBoardOffLevel', () => {
  it('drops to level 0 when a hard gate fails', () => {
    expect(recommendBoardOffLevel({ ...ready, activeCompression: false })).toBe(0);
    expect(recommendBoardOffLevel({ ...ready, longSit30s: false })).toBe(0);
    expect(recommendBoardOffLevel({ ...ready, deadHang: 'under20' })).toBe(0);
  });

  it('starts at level 1 when the physical gates pass but no skill is there yet', () => {
    expect(recommendBoardOffLevel(ready)).toBe(1);
  });

  it('follows the skill chain', () => {
    expect(recommendBoardOffLevel({ ...ready, tailGrab: true })).toBe(2);
    expect(recommendBoardOffLevel({ ...ready, tailGrab: true, oneFooter: true })).toBe(3);
    expect(recommendBoardOffLevel({ ...ready, tailGrab: true, oneFooter: true, boardOffByFin: true })).toBe(4);
    expect(recommendBoardOffLevel({ ...ready, tailGrab: true, oneFooter: true, boardOffByFin: true, boardOffByHandle: true })).toBe(5);
  });

  it('recommends level 5 only once the by-handle board-off is landed on the water', () => {
    expect(recommendBoardOffLevel({ ...ready, boardOffByHandle: true })).toBe(5);
    expect(recommendBoardOffLevel({ ...ready, boardOffByFin: true })).toBe(4);
  });

  it('keeps the hard gate ahead of every skill claim', () => {
    expect(recommendBoardOffLevel({ ...ready, boardOffByHandle: true, activeCompression: false })).toBe(0);
  });

  it('ignores shoulder flexion for the number', () => {
    expect(recommendBoardOffLevel({ ...ready, shoulderFlexion: false })).toBe(
      recommendBoardOffLevel({ ...ready, shoulderFlexion: true })
    );
  });
});

describe('boardOffLevelSlots', () => {
  it('returns the level slots unchanged with a rig', () => {
    for (const level of boardOffLevels) {
      expect(boardOffLevelSlots(level, true)).toBe(level.slots);
    }
  });

  it('swaps every rig-only slot for its floor alternative without a rig', () => {
    for (const level of boardOffLevels) {
      const slots = boardOffLevelSlots(level, false);
      expect(slots).toHaveLength(level.slots.length);
      expect(slots.some((slot) => slot.needsRig)).toBe(false);
    }
  });

  it('keeps four slots per level either way', () => {
    for (const level of boardOffLevels) {
      expect(boardOffLevelSlots(level, true)).toHaveLength(4);
      expect(boardOffLevelSlots(level, false)).toHaveLength(4);
    }
  });
});

describe('levelNeedsRig', () => {
  it('is false for the preparation level and true where a hang skill is trained', () => {
    expect(levelNeedsRig(boardOffLevels[0])).toBe(false);
    expect(levelNeedsRig(boardOffLevels[1])).toBe(true);
  });
});
