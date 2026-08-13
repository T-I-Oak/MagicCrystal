import {
    MAX_SHARED_MAP_DIFFICULTY,
    MIN_SHARED_MAP_DIFFICULTY,
    SHARED_MAP_COLS,
    SHARED_MAP_ROWS
} from './sharedMapCodec.js';

export const HELD_MAP_LIMIT = 50;

export function createBlankHeldMap(difficulty) {
    return {
        stage: createBlankStage(),
        difficulty: normalizeDifficulty(difficulty),
        cleared: false,
        favorite: false
    };
}

export function createBlankStage() {
    const stage = new Array(SHARED_MAP_ROWS)
        .fill(null)
        .map(() => new Array(SHARED_MAP_COLS).fill(0));
    stage[0][0] = 3;
    return stage;
}

export function createEmptyHeldMapSlots() {
    return Array.from({ length: HELD_MAP_LIMIT }, () => null);
}

export function normalizeHeldMaps(maps) {
    const slots = createEmptyHeldMapSlots();
    if (!Array.isArray(maps)) return slots;

    for (let index = 0; index < Math.min(maps.length, HELD_MAP_LIMIT); index++) {
        slots[index] = normalizeHeldMap(maps[index]);
    }

    return slots;
}

export function normalizeHeldMap(map) {
    if (!map || typeof map !== 'object') return null;
    const stage = normalizeStage(map.stage);
    if (!stage) return null;

    return {
        stage,
        difficulty: normalizeDifficulty(map.difficulty),
        cleared: map.cleared === true,
        favorite: map.favorite === true
    };
}

export function countFavorites(maps) {
    return normalizeHeldMaps(maps).filter((map) => map?.favorite).length;
}

export function setHeldMapFavorite(maps, index, favorite) {
    const slots = normalizeHeldMaps(maps);
    if (index < 0 || index >= HELD_MAP_LIMIT || !slots[index]) {
        return { maps: slots, index: -1, changed: false };
    }

    slots[index] = {
        ...slots[index],
        favorite: favorite === true
    };
    return { maps: slots, index, changed: true };
}

export function setHeldMapAtSlot(maps, index, heldMap) {
    const slots = normalizeHeldMaps(maps);
    if (index < 0 || index >= HELD_MAP_LIMIT) {
        return { maps: slots, index: -1, changed: false };
    }

    const normalizedMap = normalizeHeldMap(heldMap);
    if (!normalizedMap) return { maps: slots, index: -1, changed: false };

    slots[index] = normalizedMap;
    return { maps: slots, index, changed: true };
}

export function clearHeldMapSlot(maps, index) {
    const slots = normalizeHeldMaps(maps);
    if (index < 0 || index >= HELD_MAP_LIMIT) {
        return { maps: slots, index: -1, changed: false };
    }

    slots[index] = null;
    return { maps: slots, index, changed: true };
}

export function findFirstEmptyHeldMapSlot(maps) {
    return normalizeHeldMaps(maps).findIndex((map) => map === null);
}

function normalizeStage(stage) {
    if (!Array.isArray(stage) || stage.length !== SHARED_MAP_ROWS) return null;

    const normalized = [];
    for (const row of stage) {
        if (!Array.isArray(row) || row.length !== SHARED_MAP_COLS) return null;
        const normalizedRow = [];
        for (const tile of row) {
            if (!Number.isInteger(tile) || tile < 0 || tile > 7) return null;
            normalizedRow.push(tile);
        }
        normalized.push(normalizedRow);
    }
    return normalized;
}

function normalizeDifficulty(difficulty) {
    if (!Number.isInteger(difficulty)) return MIN_SHARED_MAP_DIFFICULTY;
    return Math.min(MAX_SHARED_MAP_DIFFICULTY, Math.max(MIN_SHARED_MAP_DIFFICULTY, difficulty));
}
