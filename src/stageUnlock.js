export const NORMAL_STAGE_COUNT = 50;
export const STAGE_UNLOCK_BLOCK_SIZE = 10;

export function createEmptyStageClearFlags(stageCount = NORMAL_STAGE_COUNT) {
    return new Array(stageCount).fill(false);
}

export function normalizeStageClearFlags(flags, stageCount = NORMAL_STAGE_COUNT) {
    const normalized = createEmptyStageClearFlags(stageCount);
    if (!Array.isArray(flags)) return normalized;

    for (let index = 0; index < Math.min(flags.length, stageCount); index++) {
        normalized[index] = flags[index] === true;
    }
    return normalized;
}

export function getUnlockedStageCount(
    clearedStages,
    stageCount = NORMAL_STAGE_COUNT,
    blockSize = STAGE_UNLOCK_BLOCK_SIZE
) {
    const flags = normalizeStageClearFlags(clearedStages, stageCount);
    let unlockedCount = Math.min(blockSize, stageCount);

    while (unlockedCount < stageCount) {
        const blockStart = unlockedCount - blockSize;
        const currentBlockCleared = flags
            .slice(blockStart, unlockedCount)
            .every(Boolean);
        if (!currentBlockCleared) break;

        unlockedCount = Math.min(unlockedCount + blockSize, stageCount);
    }

    return unlockedCount;
}

export function isStageUnlocked(stageIndex, clearedStages) {
    return stageIndex >= 0 && stageIndex < getUnlockedStageCount(clearedStages);
}
