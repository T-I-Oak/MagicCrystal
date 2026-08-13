import { NORMAL_STAGE_COUNT } from './stageUnlock.js';
import { MAX_SHARED_MAP_DIFFICULTY, MIN_SHARED_MAP_DIFFICULTY } from './sharedMapCodec.js';

export const NORMAL_STAGE_DIFFICULTIES = Array.from({ length: NORMAL_STAGE_COUNT }, () => 1);

export function getNormalStageDifficulty(stageIndex) {
    if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= NORMAL_STAGE_DIFFICULTIES.length) {
        return MIN_SHARED_MAP_DIFFICULTY;
    }
    return normalizeNormalStageDifficulty(NORMAL_STAGE_DIFFICULTIES[stageIndex]);
}

function normalizeNormalStageDifficulty(difficulty) {
    if (!Number.isInteger(difficulty)) return MIN_SHARED_MAP_DIFFICULTY;
    return Math.min(MAX_SHARED_MAP_DIFFICULTY, Math.max(MIN_SHARED_MAP_DIFFICULTY, difficulty));
}
