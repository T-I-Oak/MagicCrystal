import { describe, expect, it } from 'vitest';
import {
    clearHeldMapSlot,
    countFavorites,
    createBlankHeldMap,
    createBlankStage,
    findFirstEmptyHeldMapSlot,
    HELD_MAP_LIMIT,
    normalizeHeldMaps,
    setHeldMapAtSlot,
    setHeldMapFavorite
} from '../../src/extraMapData.js';

describe('extra map data', () => {
    it('creates a blank held map with a portal at the upper-left', () => {
        const map = createBlankHeldMap(3);

        expect(map.stage).toHaveLength(13);
        expect(map.stage[0]).toHaveLength(24);
        expect(map.stage[0][0]).toBe(3);
        expect(map.stage[0][1]).toBe(0);
        expect(map.difficulty).toBe(3);
        expect(map).not.toHaveProperty('lastAccess');
    });

    it('normalizes held maps as fixed slots without sorting or compacting empties', () => {
        const mapA = createBlankHeldMap(1);
        const mapB = createBlankHeldMap(2);
        const maps = normalizeHeldMaps([mapA, null, mapB]);

        expect(maps).toHaveLength(HELD_MAP_LIMIT);
        expect(maps[0]).toEqual(mapA);
        expect(maps[1]).toBeNull();
        expect(maps[2]).toEqual(mapB);
        expect(maps.slice(3).every((map) => map === null)).toBe(true);
    });

    it('sets and clears a held map at the specified slot', () => {
        const result = setHeldMapAtSlot([], 7, createBlankHeldMap(4));

        expect(result.index).toBe(7);
        expect(result.maps[7].difficulty).toBe(4);
        expect(findFirstEmptyHeldMapSlot(result.maps)).toBe(0);

        const cleared = clearHeldMapSlot(result.maps, 7);

        expect(cleared.index).toBe(7);
        expect(cleared.maps[7]).toBeNull();
    });

    it('keeps all favorite states during normalization without changing slot positions', () => {
        const maps = Array.from({ length: HELD_MAP_LIMIT }, (_, index) => ({
            ...createBlankHeldMap(1),
            favorite: true,
            difficulty: index + 1
        }));

        const normalized = normalizeHeldMaps(maps);

        expect(countFavorites(normalized)).toBe(HELD_MAP_LIMIT);
        expect(normalized.every((map) => map.favorite)).toBe(true);
    });

    it('adds a favorite even when many held maps are already favorite', () => {
        const maps = Array.from({ length: HELD_MAP_LIMIT - 1 }, () => ({
            ...createBlankHeldMap(1),
            favorite: true
        }));
        maps.push(createBlankHeldMap(1));

        const result = setHeldMapFavorite(maps, HELD_MAP_LIMIT - 1, true);

        expect(result.changed).toBe(true);
        expect(result.index).toBe(HELD_MAP_LIMIT - 1);
        expect(countFavorites(result.maps)).toBe(HELD_MAP_LIMIT);
    });

    it('drops malformed saved maps into empty slots during normalization', () => {
        const maps = normalizeHeldMaps([
            createBlankHeldMap(1),
            { stage: [[9]], difficulty: 99 },
            { stage: createBlankStage(), difficulty: 99 }
        ]);

        expect(maps[0].difficulty).toBe(1);
        expect(maps[1]).toBeNull();
        expect(maps[2].difficulty).toBe(5);
    });
});
