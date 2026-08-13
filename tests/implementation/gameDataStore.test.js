import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setAppVersion } from '../../../GameWorksOAK/src/lib/utils/env.js';
import {
    GAME_DATA_ID,
    GameDataStore
} from '../../src/gameDataStore.js';
import { HELD_MAP_LIMIT } from '../../src/extraMapData.js';
import { decodeSharedMap } from '../../src/sharedMapCodec.js';

function installLocalStorageMock() {
    const values = new Map();
    Object.defineProperty(globalThis, 'localStorage', {
        value: {
            getItem: vi.fn(key => values.get(key) ?? null),
            setItem: vi.fn((key, value) => values.set(key, String(value))),
            removeItem: vi.fn(key => values.delete(key)),
            clear: vi.fn(() => values.clear())
        },
        configurable: true
    });
}

describe('GameDataStore', () => {
    beforeEach(() => {
        setAppVersion('0.3.1');
        installLocalStorageMock();
    });

    it('stores settings in the Magic Crystal DataManager namespace', () => {
        const store = new GameDataStore();

        store.saveSettings({
            padType: 2,
            padPosX: 30,
            padPosY: 40,
            padSize: 110,
            screenSize: 90,
            targetFPS: 60
        });

        const saved = JSON.parse(localStorage.getItem(GAME_DATA_ID));
        expect(saved.settings.d).toMatchObject({
            padType: 2,
            padPosX: 30,
            padPosY: 40,
            padSize: 110,
            screenSize: 90,
            targetFPS: 60
        });
    });

    it('initializes settings from the provided defaults', () => {
        const store = new GameDataStore();
        const settings = store.loadSettings({
            padType: 1,
            padPosX: 50,
            padPosY: 25,
            padSize: 100,
            screenSize: 100,
            targetFPS: 45
        });

        expect(settings).toMatchObject({
            padType: 1,
            padPosX: 50,
            screenSize: 100,
            targetFPS: 45
        });
        expect(JSON.parse(localStorage.getItem(GAME_DATA_ID)).settings.d.screenSize).toBe(100);
    });

    it('stores and loads the editor level in the DataManager namespace', () => {
        const store = new GameDataStore();

        expect(store.loadEditorLevel()).toBeUndefined();
        store.saveEditorLevel('serialized-level');

        expect(store.loadEditorLevel()).toBe('serialized-level');
        expect(JSON.parse(localStorage.getItem(GAME_DATA_ID)).editorLevel.d.serializedLevel).toBe('serialized-level');
    });

    it('stores and loads normal stage clear progress in the DataManager namespace', () => {
        const store = new GameDataStore();
        const clearedStages = new Array(50).fill(false);
        clearedStages[0] = true;

        expect(store.loadStageProgress().clearedStages).toEqual(new Array(50).fill(false));

        store.saveStageProgress({ clearedStages });

        expect(store.loadStageProgress().clearedStages[0]).toBe(true);
        expect(JSON.parse(localStorage.getItem(GAME_DATA_ID)).stageProgress.d.clearedStages[0]).toBe(true);
    });

    it('stores and loads extra maps in the DataManager namespace', () => {
        const store = new GameDataStore();
        const stage = new Array(13).fill(null).map(() => new Array(24).fill(0));
        stage[0][0] = 3;

        expect(store.loadExtraMaps().maps).toEqual(new Array(HELD_MAP_LIMIT).fill(null));

        store.saveExtraMaps({
            maps: [{
                stage,
                difficulty: 3,
                cleared: true,
                favorite: true
            }]
        });

        const loaded = store.loadExtraMaps().maps;
        expect(loaded).toHaveLength(HELD_MAP_LIMIT);
        expect(loaded[0]).toMatchObject({
            difficulty: 3,
            cleared: true,
            favorite: true
        });
        expect(loaded[1]).toBeNull();
        const savedMap = JSON.parse(localStorage.getItem(GAME_DATA_ID)).extraMaps.d.maps[0];
        expect(savedMap).toMatchObject({
            cleared: true,
            favorite: true
        });
        expect(savedMap).not.toHaveProperty('stage');
        expect(decodeSharedMap(savedMap.mapData)).toMatchObject({
            difficulty: 3,
            tiles: stage
        });
    });

    it('drops old unencoded extra map storage entries', () => {
        const store = new GameDataStore();
        const stage = new Array(13).fill(null).map(() => new Array(24).fill(0));
        stage[0][0] = 3;

        store.dataManager.setSavedData('extraMaps', {
            maps: [{
                stage,
                difficulty: 3,
                cleared: true,
                favorite: true
            }]
        });

        expect(store.loadExtraMaps().maps).toEqual(new Array(HELD_MAP_LIMIT).fill(null));
    });
});
