import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { ENCODED_LEVELS, NORMAL_LEVEL_DIFFICULTIES } from '../../src/levels.js';
import { NORMAL_STAGE_COUNT } from '../../src/stageUnlock.js';
import { getNormalStageDifficulty, NORMAL_STAGE_DIFFICULTIES } from '../../src/normalStageData.js';
import { decodeSharedMap, MAX_SHARED_MAP_DIFFICULTY, MIN_SHARED_MAP_DIFFICULTY } from '../../src/sharedMapCodec.js';

const EXPECTED_NORMAL_STAGE_DATA_HASH = 'e18a267d357335fe86562e4bd086bab28ccc2ad88f23cecbf3b0c5ffe723266c';
const EXPECTED_NORMAL_STAGE_DIFFICULTIES = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5
];

describe('normal stage data', () => {
    it('assigns a valid difficulty to every normal stage', () => {
        expect(NORMAL_STAGE_DIFFICULTIES).toHaveLength(NORMAL_STAGE_COUNT);
        expect(NORMAL_STAGE_DIFFICULTIES.every((difficulty) => (
            difficulty >= MIN_SHARED_MAP_DIFFICULTY && difficulty <= MAX_SHARED_MAP_DIFFICULTY
        ))).toBe(true);
        expect(NORMAL_STAGE_DIFFICULTIES).toBe(NORMAL_LEVEL_DIFFICULTIES);
    });

    it('stores normal stage difficulty in the encoded level data', () => {
        expect(ENCODED_LEVELS).toHaveLength(NORMAL_STAGE_COUNT);
        expect(ENCODED_LEVELS.map(mapData => decodeSharedMap(mapData).difficulty)).toEqual(EXPECTED_NORMAL_STAGE_DIFFICULTIES);
    });

    it('keeps the confirmed normal stage data unchanged', () => {
        const decodedStageData = ENCODED_LEVELS.map(mapData => {
            const { difficulty, tiles } = decodeSharedMap(mapData);
            return { difficulty, tiles };
        });
        const hash = createHash('sha256').update(JSON.stringify(decodedStageData)).digest('hex');

        expect(hash).toBe(EXPECTED_NORMAL_STAGE_DATA_HASH);
    });

    it('returns level 1 for out-of-range stage indexes', () => {
        expect(getNormalStageDifficulty(-1)).toBe(1);
        expect(getNormalStageDifficulty(NORMAL_STAGE_COUNT)).toBe(1);
    });
});
