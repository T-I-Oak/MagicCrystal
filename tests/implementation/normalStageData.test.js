import { describe, expect, it } from 'vitest';
import { NORMAL_STAGE_COUNT } from '../../src/stageUnlock.js';
import { getNormalStageDifficulty, NORMAL_STAGE_DIFFICULTIES } from '../../src/normalStageData.js';

describe('normal stage data', () => {
    it('assigns level 1 difficulty to every normal stage for the initial release', () => {
        expect(NORMAL_STAGE_DIFFICULTIES).toHaveLength(NORMAL_STAGE_COUNT);
        expect(NORMAL_STAGE_DIFFICULTIES.every((difficulty) => difficulty === 1)).toBe(true);
    });

    it('returns level 1 for out-of-range stage indexes', () => {
        expect(getNormalStageDifficulty(-1)).toBe(1);
        expect(getNormalStageDifficulty(NORMAL_STAGE_COUNT)).toBe(1);
    });
});
