import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../../src/levels.js';
import {
    decodeSharedMap,
    encodeSharedMap,
    encodeSharedMapDictionary,
    encodeSharedMapFixed,
    encodeSharedMapRle,
    encodeSharedMapRle2,
    SHARED_MAP_DICTIONARY_PATTERNS,
    SHARED_MAP_FORMAT_DICTIONARY,
    SHARED_MAP_FORMAT_FIXED,
    SHARED_MAP_FORMAT_RLE,
    SHARED_MAP_FORMAT_RLE2
} from '../../src/sharedMapCodec.js';

describe('shared map codec', () => {
    it('encodes fixed shared map data as 158 characters including format and difficulty', () => {
        const encoded = encodeSharedMapFixed(ALL_LEVELS[0], 3);

        expect(encoded[0]).toBe(SHARED_MAP_FORMAT_FIXED);
        expect(encoded[1]).toBe('3');
        expect(encoded).toHaveLength(158);
        expect(decodeSharedMap(encoded)).toEqual({
            format: SHARED_MAP_FORMAT_FIXED,
            difficulty: 3,
            tiles: ALL_LEVELS[0]
        });
    });

    it('encodes and decodes RLE shared map data', () => {
        const encoded = encodeSharedMapRle(ALL_LEVELS[0], 2);

        expect(encoded[0]).toBe(SHARED_MAP_FORMAT_RLE);
        expect(encoded[1]).toBe('2');
        expect(decodeSharedMap(encoded)).toEqual({
            format: SHARED_MAP_FORMAT_RLE,
            difficulty: 2,
            tiles: ALL_LEVELS[0]
        });
    });

    it('encodes RLE values with tile in the low bits', () => {
        const map = [[0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ...Array.from({ length: 12 }, () => Array(24).fill(0))];
        map[12][23] = 3;
        const encoded = encodeSharedMapRle(map, 1);

        expect(encoded.slice(2, 4)).toBe('A5');
        expect(decodeSharedMap(encoded).tiles[0].slice(0, 9)).toEqual([0, 1, 1, 1, 1, 1, 1, 1, 1]);
    });

    it('encodes and decodes RLE-2 shared map data', () => {
        const encoded = encodeSharedMapRle2(ALL_LEVELS[0], 4);

        expect(encoded[0]).toBe(SHARED_MAP_FORMAT_RLE2);
        expect(encoded[1]).toBe('4');
        expect(decodeSharedMap(encoded)).toEqual({
            format: SHARED_MAP_FORMAT_RLE2,
            difficulty: 4,
            tiles: ALL_LEVELS[0]
        });
    });

    it('encodes and decodes dictionary shared map data', () => {
        const encoded = encodeSharedMapDictionary(ALL_LEVELS[34], 5);

        expect(encoded[0]).toBe(SHARED_MAP_FORMAT_DICTIONARY);
        expect(encoded[1]).toBe('5');
        expect(decodeSharedMap(encoded)).toEqual({
            format: SHARED_MAP_FORMAT_DICTIONARY,
            difficulty: 5,
            tiles: ALL_LEVELS[34]
        });
    });

    it('defines the fixed D format dictionary patterns', () => {
        expect(SHARED_MAP_DICTIONARY_PATTERNS).toEqual([
            [1, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 4, 0],
            [0, 2, 0],
            [0, 2, 2, 0]
        ]);
    });

    it('requires decoded shared maps to contain exactly one portal', () => {
        const noPortal = ALL_LEVELS[0].map(row => row.map(tile => (tile === 3 ? 0 : tile)));
        const twoPortals = ALL_LEVELS[0].map(row => [...row]);
        twoPortals[0][0] = 3;

        expect(() => decodeSharedMap(encodeSharedMapFixed(noPortal, 1))).toThrow();
        expect(() => decodeSharedMap(encodeSharedMapDictionary(twoPortals, 1))).toThrow();
    });

    it('chooses the shorter format for each normal stage', () => {
        for (const level of ALL_LEVELS) {
            const encoded = encodeSharedMap(level, 1);
            const fixed = encodeSharedMapFixed(level, 1);
            const rle = encodeSharedMapRle(level, 1);
            const rle2 = encodeSharedMapRle2(level, 1);
            const dictionary = encodeSharedMapDictionary(level, 1);

            expect(encoded.length).toBe(Math.min(fixed.length, rle.length, rle2.length, dictionary.length));
            expect(decodeSharedMap(encoded).tiles).toEqual(level);
        }
    });

    it('keeps the manual dictionary useful for both normal stage halves', () => {
        const firstHalf = ALL_LEVELS.slice(0, 25);
        const secondHalf = ALL_LEVELS.slice(25);
        const firstHalfGain = firstHalf.reduce((sum, level) => (
            sum + encodeSharedMapRle2(level, 1).length - encodeSharedMapDictionary(level, 1).length
        ), 0);
        const secondHalfGain = secondHalf.reduce((sum, level) => (
            sum + encodeSharedMapRle2(level, 1).length - encodeSharedMapDictionary(level, 1).length
        ), 0);

        expect(firstHalfGain).toBeGreaterThan(0);
        expect(secondHalfGain).toBeGreaterThan(0);
    });

    it('rejects invalid difficulty and malformed map data', () => {
        expect(() => encodeSharedMap(ALL_LEVELS[0], 0)).toThrow();
        expect(() => decodeSharedMap('A0')).toThrow();
        expect(() => decodeSharedMap('A1A')).toThrow();
        expect(() => decodeSharedMap('Z1abc')).toThrow();
        expect(() => decodeSharedMap('B1A')).toThrow();
        expect(() => decodeSharedMap('C1g')).toThrow();
        expect(() => decodeSharedMap('D1g')).toThrow();
    });
});
