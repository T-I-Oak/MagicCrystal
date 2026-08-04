import { DataManager } from '../../GameWorksOAK/src/lib/core/dataManager.js';
import { normalizeHeldMaps } from './extraMapData.js';
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
            maps: normalizeHeldMaps(data.maps)
        };
    }

    saveExtraMaps(extraMaps) {
        this.dataManager.setSavedData(EXTRA_MAPS_KEY, {
            maps: normalizeHeldMaps(extraMaps.maps)
        });
    }
}
