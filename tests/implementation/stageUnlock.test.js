import { describe, expect, it } from 'vitest';
import {
    createEmptyStageClearFlags,
    getUnlockedStageCount,
    isStageUnlocked,
    normalizeStageClearFlags
} from '../../src/stageUnlock.js';

describe('stage unlock', () => {
    it('unlocks only the first ten stages initially', () => {
        const clearedStages = createEmptyStageClearFlags();

        expect(getUnlockedStageCount(clearedStages)).toBe(10);
        expect(isStageUnlocked(9, clearedStages)).toBe(true);
        expect(isStageUnlocked(10, clearedStages)).toBe(false);
    });

    it('unlocks the next ten stages when the current block is fully cleared', () => {
        const clearedStages = createEmptyStageClearFlags();
        for (let index = 0; index < 10; index++) {
            clearedStages[index] = true;
        }

        expect(getUnlockedStageCount(clearedStages)).toBe(20);
        expect(isStageUnlocked(19, clearedStages)).toBe(true);
        expect(isStageUnlocked(20, clearedStages)).toBe(false);
    });

    it('normalizes saved clear flags to the normal stage count', () => {
        expect(normalizeStageClearFlags([true, false, 'yes']).slice(0, 4)).toEqual([
            true,
            false,
            false,
            false
        ]);
        expect(normalizeStageClearFlags([])).toHaveLength(50);
    });
});
