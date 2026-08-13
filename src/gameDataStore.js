import { DataManager } from '../../GameWorksOAK/src/lib/core/dataManager.js';
import { normalizeHeldMaps } from './extraMapData.js';
import { decodeSharedMap, encodeSharedMap } from './sharedMapCodec.js';
import { createEmptyStageClearFlags, normalizeStageClearFlags } from './stageUnlock.js';

export const GAME_DATA_ID = 'magic-crystal';

const SETTINGS_KEY = 'settings';
const EDITOR_LEVEL_KEY = 'editorLevel';
const STAGE_PROGRESS_KEY = 'stageProgress';
const EXTRA_MAPS_KEY = 'extraMaps';

export class GameDataStore {
    constructor(dataManager = new DataManager(GAME_DATA_ID)) {
        this.dataManager = dataManager;
    }

    loadSettings(defaultSettings) {
        return this.dataManager.getSavedData(SETTINGS_KEY, {
            init: () => ({ ...defaultSettings })
        });
    }

    saveSettings(settings) {
        this.dataManager.setSavedData(SETTINGS_KEY, settings);
    }

    loadEditorLevel() {
        const data = this.dataManager.getSavedData(EDITOR_LEVEL_KEY, {
            init: () => ({
                serializedLevel: undefined
            })
        });
        return data.serializedLevel;
    }

    saveEditorLevel(serializedLevel) {
        this.dataManager.setSavedData(EDITOR_LEVEL_KEY, { serializedLevel });
    }

    loadStageProgress() {
        const data = this.dataManager.getSavedData(STAGE_PROGRESS_KEY, {
            init: () => ({
                clearedStages: createEmptyStageClearFlags()
            })
        });

        return {
            clearedStages: normalizeStageClearFlags(data.clearedStages)
        };
    }

    saveStageProgress(progress) {
        this.dataManager.setSavedData(STAGE_PROGRESS_KEY, {
            clearedStages: normalizeStageClearFlags(progress.clearedStages)
        });
    }

    loadExtraMaps() {
        const data = this.dataManager.getSavedData(EXTRA_MAPS_KEY, {
            init: () => ({
                maps: []
            })
        });

        return {
            maps: normalizeHeldMaps(decodeSavedExtraMaps(data.maps))
        };
    }

    saveExtraMaps(extraMaps) {
        this.dataManager.setSavedData(EXTRA_MAPS_KEY, {
            maps: encodeSavedExtraMaps(extraMaps.maps)
        });
    }
}

function decodeSavedExtraMaps(maps) {
    if (!Array.isArray(maps)) return [];
    return maps.map((map) => {
        if (!map || typeof map !== 'object' || typeof map.mapData !== 'string') return null;
        try {
            const decoded = decodeSharedMap(map.mapData);
            return {
                stage: decoded.tiles,
                difficulty: decoded.difficulty,
                cleared: map.cleared === true,
                favorite: map.favorite === true
            };
        } catch {
            return null;
        }
    });
}

function encodeSavedExtraMaps(maps) {
    return normalizeHeldMaps(maps).map((map) => {
        if (!map) return null;
        return {
            mapData: encodeSharedMap(map.stage, map.difficulty),
            cleared: map.cleared === true,
            favorite: map.favorite === true
        };
    });
}
