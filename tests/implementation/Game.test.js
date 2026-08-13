import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../src/Game.js';
import { createBlankHeldMap, HELD_MAP_LIMIT } from '../../src/extraMapData.js';
import { decodeSharedMap, encodeSharedMap } from '../../src/sharedMapCodec.js';
import packageData from '../../package.json';

describe('Game Class', () => {
    let mockCanvas;
    let mockAssets;

    const savedExtraMaps = () => JSON.parse(localStorage.getItem('magic-crystal')).extraMaps.d.maps;

    beforeEach(() => {
        globalThis.history.replaceState(null, '', '/');
        const values = new Map();
        Object.defineProperty(globalThis, 'localStorage', {
            value: {
                getItem: vi.fn(key => values.get(key) ?? null),
                setItem: vi.fn((key, value) => values.set(key, String(value))),
                clear: vi.fn(() => values.clear())
            },
            configurable: true
        });

        mockCanvas = {
            getContext: () => ({}),
            width: 0,
            height: 0
        };
        mockAssets = {
            load: vi.fn(),
            player: { life: {} },
            getTile: vi.fn()
        };

        global.document = {
            getElementById: vi.fn().mockReturnValue(null),
            querySelectorAll: vi.fn().mockReturnValue([])
        };
    });

    it('should initialize with correct version from Vite define', () => {
        const game = new Game(mockCanvas, mockAssets);
        expect(game.version).toBe(packageData.version);
        expect(game.state).toBe('TITLE');
    });

    it('should have 3 lives initially', () => {
        const game = new Game(mockCanvas, mockAssets);
        expect(game.lives).toBe(3);
    });

    it('keeps settings FPS at the lower bound used by the slider', () => {
        localStorage.setItem('magic-crystal', JSON.stringify({
            settings: {
                v: 0,
                d: {
                    targetFPS: 10
                }
            }
        }));
        const game = new Game(mockCanvas, mockAssets);

        expect(game.targetFPS).toBe(10);

        game.state = 'SETTINGS';
        game.settingsCursor = 0;
        game.input.actions.left = true;
        game.updateSettings();

        expect(game.targetFPS).toBe(10);
    });

    it('unlocks only the first ten play stages initially', () => {
        const game = new Game(mockCanvas, mockAssets);

        expect(game.getSelectableStageCount()).toBe(10);
        expect(game.getUnlockedStageCount()).toBe(10);
        expect(game.isStageSelectable(9)).toBe(true);
        expect(game.isStageSelectable(10)).toBe(false);
    });

    it('unlocks the next stage block after clearing the current block', () => {
        const game = new Game(mockCanvas, mockAssets);

        for (let stage = 0; stage < 10; stage++) {
            game.stage = stage;
            game.handleLevelClear();
        }

        expect(game.getUnlockedStageCount()).toBe(20);
        expect(game.getSelectableStageCount()).toBe(10);
        expect(game.isStageSelectable(0)).toBe(false);
        expect(game.isStageSelectable(19)).toBe(true);
        expect(game.isStageSelectable(20)).toBe(false);
    });

    it('keeps past clear history selectable while blocking stages cleared in the current game', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.stageClearHistory[0] = true;

        expect(game.isStageSelectable(0)).toBe(true);

        game.stage = 0;
        game.handleLevelClear();

        expect(game.isStageClearedBefore(0)).toBe(true);
        expect(game.isStageClearedInCurrentGame(0)).toBe(true);
        expect(game.isStageSelectable(0)).toBe(false);
    });

    it('moves the stage cursor across the full stage grid', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.stage = 0;
        game.handleLevelClear();
        game.selectCursor = 0;

        game.input.actions.right = true;
        game.updateSelect();

        expect(game.selectCursor).toBe(1);
    });

    it('cycles select stage functions with smart keys', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'SELECT';

        expect(game.getSelectStageActionItems().map(item => item.id)).toEqual(['play', 'settings']);

        game.input.actions.smartRight = true;
        game.updateSelect();
        expect(game.selectStageFunctionCursor).toBe(1);

        game.input.prevActions.smartRight = true;
        game.input.actions.smartRight = false;
        game.input.actions.smartLeft = true;
        game.updateSelect();
        expect(game.selectStageFunctionCursor).toBe(0);
    });

    it('opens settings from select stage and returns to select', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'SELECT';
        game.selectStageFunctionCursor = 1;
        game.input.actions.confirm = true;

        game.updateSelect();

        expect(game.state).toBe('SETTINGS');
        expect(game.settingsReturnState).toBe('SELECT');

        game.input.prevActions.confirm = true;
        game.input.actions.confirm = false;
        game.input.actions.cancel = true;
        game.updateSettings();

        expect(game.state).toBe('SELECT');
    });

    it('keeps the stage cursor on the cleared stage after returning to stage select', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.selectCursor = 0;
        game.stage = 0;

        game.handleLevelClear();
        for (let i = 0; i < 60; i++) {
            game.update();
        }

        expect(game.state).toBe('SELECT');
        expect(game.selectCursor).toBe(0);
        expect(game.isStageSelectable(game.selectCursor)).toBe(false);
    });

    it('opens the congratulations screen after clearing all stages in one normal game', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.currentGameClearedStages.fill(true);
        game.currentGameClearedStages[49] = false;
        game.stage = 49;

        game.handleLevelClear();
        for (let i = 0; i < 60; i++) {
            game.update();
        }

        expect(game.state).toBe('CONGRATULATIONS');
        expect(game.congratulationsCursor).toBe(0);
    });

    it('returns from congratulations to title with the cancel action', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'CONGRATULATIONS';
        game.input.actions.cancel = true;

        game.update();

        expect(game.state).toBe('TITLE');
    });

    it('selects title from congratulations actions', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'CONGRATULATIONS';

        game.executeCongratulationsAction(1);

        expect(game.state).toBe('TITLE');
        expect(game.congratulationsCursor).toBe(1);
    });

    it('keeps the unavailable extra map title item on the title screen', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.titleCursor = 2;
        game.input.actions.confirm = true;

        game.updateTitle();

        expect(game.canOpenExtraMap()).toBe(false);
        expect(game.state).toBe('TITLE');
    });

    it('opens extra map from the title when editing is unlocked', () => {
        const game = new Game(mockCanvas, mockAssets);
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }
        game.titleCursor = 2;
        game.input.actions.confirm = true;

        game.updateTitle();

        expect(game.canOpenExtraMap()).toBe(true);
        expect(game.state).toBe('EXTRA_MAP');
    });

    it('moves the extra map cursor across the full held-map grid', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        game.input.actions.down = true;

        game.updateExtraMap();

        expect(game.extraMapCursor).toBe(10);
    });

    it('creates a blank held map from an empty slot with the extra map function bar', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.input.actions.smartRight = true;
        game.updateExtraMap();
        game.input.prevActions.smartRight = true;
        game.input.actions.smartRight = false;
        game.input.actions.confirm = true;
        game.updateExtraMap();

        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.extraMapCursor).toBe(0);
        expect(game.extraMapActionMenu).toBeNull();
        expect(game.state).toBe('EDITOR');
        expect(game.isEditingExtraMap()).toBe(true);
        expect(game.extraMaps[0].stage[0][0]).toBe(3);
        expect(savedExtraMaps()).toHaveLength(HELD_MAP_LIMIT);
        expect(savedExtraMaps()[0]).not.toHaveProperty('stage');
        expect(decodeSharedMap(savedExtraMaps()[0].mapData).tiles[0][0]).toBe(3);
    });

    it('shows stable extra map function items for a created map', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.saveExtraMapEdit();
        game.openExtraMapActionMenu(0);

        expect(game.getExtraMapActionItems().map(item => item.id)).toEqual([
            'play',
            'edit',
            'copy',
            'paste',
            'favorite',
            'share',
            'delete'
        ]);
        expect(game.getExtraMapActionItems().find(item => item.id === 'delete').label).toBe('DELETE');
        expect(game.getExtraMapActionItems().filter(item => item.enabled).map(item => item.id)).toEqual([
            'play',
            'edit',
            'copy',
            'favorite',
            'delete'
        ]);
    });

    it('starts playing a held map and returns to extra map after clear', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.saveExtraMapEdit();
        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(0);

        expect(game.state).toBe('WAIT_START');
        expect(game.isPlayingExtraMap()).toBe(true);
        expect(game.lives).toBe(1);
        expect(game.extraMapActionMenu).toBeNull();
        expect(game.extraMapCursor).toBe(0);
        expect(game.level.getTile(0, 0)).toBe(3);

        const originalStageHistory = [...game.stageClearHistory];
        game.handleLevelClear();

        expect(game.extraMaps[0].cleared).toBe(true);
        expect(game.lives).toBe(1);
        expect(game.stageClearHistory).toEqual(originalStageHistory);
        expect(game.state).toBe('WAIT_CLEAR');

        game.onTimerEnd();

        expect(game.state).toBe('EXTRA_MAP');
        expect(game.isPlayingExtraMap()).toBe(false);
        expect(JSON.parse(localStorage.getItem('magic-crystal')).extraMaps.d.maps[0].cleared).toBe(true);
    });

    it('returns to extra map after a held-map miss without changing clear status', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        game.extraMaps = [createBlankHeldMap(1, 1)];
        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(0);

        expect(game.state).toBe('WAIT_START');
        expect(game.lives).toBe(1);

        game.handleGameOver();

        expect(game.lives).toBe(1);
        expect(game.extraMaps[0].cleared).toBe(false);
        expect(game.state).toBe('WAIT_MISS');

        game.onTimerEnd();

        expect(game.state).toBe('EXTRA_MAP');
        expect(game.isPlayingExtraMap()).toBe(false);
    });

    it('keeps paste disabled until a held map stage is copied', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);

        expect(game.getExtraMapActionItems()[3]).toMatchObject({ id: 'paste', enabled: false });

        game.executeExtraMapAction(3);

        expect(game.extraMaps).toEqual(new Array(HELD_MAP_LIMIT).fill(null));
        expect(game.noticeText).toBe(game.t('extraMap.notice.noCopiedStage'));
        expect(game.extraMapFunctionCursor).toBe(3);
    });

    it('copies a held map stage and pastes it into an empty slot', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 20; stage++) {
            game.stageClearHistory[stage] = true;
        }
        game.extraMaps = [createBlankHeldMap(2, 1)];
        game.extraMaps[0].stage[0][1] = 4;
        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(2);

        expect(game.hasCopiedExtraMapStage()).toBe(true);
        expect(game.extraMapActionMenu).toBeNull();

        game.openExtraMapActionMenu(1);
        expect(game.getExtraMapActionItems()[3]).toMatchObject({ id: 'paste', enabled: true });
        game.executeExtraMapAction(3);

        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.extraMaps[0].stage[0][1]).toBe(4);
        expect(game.extraMaps[0].difficulty).toBe(2);
        expect(game.extraMaps[0].cleared).toBe(false);
        expect(game.extraMaps[1].stage[0][1]).toBe(4);
        expect(game.extraMaps[1].difficulty).toBe(2);
        expect(game.extraMaps[1].cleared).toBe(false);
        expect(game.extraMapCursor).toBe(1);
        expect(savedExtraMaps()).toHaveLength(HELD_MAP_LIMIT);
    });

    it('pastes over an existing held map and drops its clear status', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }
        game.extraMaps = [
            createBlankHeldMap(5, 1),
            {
                ...createBlankHeldMap(1, 2),
                cleared: true,
                favorite: true
            }
        ];
        game.extraMaps[0].stage[0][2] = 5;
        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(2);

        game.openExtraMapActionMenu(1);
        game.executeExtraMapAction(3);

        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.extraMaps[0].stage[0][2]).toBe(5);
        expect(game.extraMaps[1].stage[0][2]).toBe(5);
        expect(game.extraMaps[1].difficulty).toBe(1);
        expect(game.extraMaps[1].cleared).toBe(false);
        expect(game.extraMaps[1].favorite).toBe(true);
        expect(game.extraMaps[0].difficulty).toBe(5);
        expect(game.extraMapCursor).toBe(1);
    });

    it('keeps disabled held-map actions from changing extra map state', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.saveExtraMapEdit();
        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(game.getExtraMapActionItems().findIndex(item => item.id === 'share'));

        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.state).toBe('EXTRA_MAP');
        expect(game.noticeText).toBe(game.t('extraMap.notice.shareRequiresClear'));
        expect(game.extraMapFunctionCursor).toBe(game.getExtraMapActionItems().findIndex(item => item.id === 'share'));
    });

    it('prepares shared map data for a cleared held map', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        globalThis.history.replaceState(null, '', '/MagicCrystal/?debug=1#editor');
        game.extraMaps = [{
            ...createBlankHeldMap(3, 1),
            cleared: true
        }];
        game.extraMaps[0].stage[0][1] = 4;

        game.openExtraMapActionMenu(0);
        const shareIndex = game.getExtraMapActionItems().findIndex(item => item.id === 'share');
        expect(game.getExtraMapActionItems()[shareIndex]).toMatchObject({ id: 'share', enabled: true });
        game.executeExtraMapAction(shareIndex);

        const decoded = decodeSharedMap(game.pendingExtraMapShare.mapData);
        expect(decoded.difficulty).toBe(3);
        expect(decoded.tiles).toEqual(game.pendingExtraMapShare.stage);
        const shareUrl = new URL(game.pendingExtraMapShare.url);
        expect(shareUrl.pathname).toBe('/MagicCrystal/');
        expect(shareUrl.searchParams.get('map')).toBe(game.pendingExtraMapShare.mapData);
        expect(shareUrl.searchParams.has('debug')).toBe(false);
        expect(shareUrl.hash).toBe('');
        expect(game.pendingExtraMapShare.image).toMatchObject({
            title: 'Magic Crystal',
            difficulty: 3,
            url: game.pendingExtraMapShare.url,
            copyrightText: '© T.I.OAK 2026 | GameWorks OAK'
        });
        expect(game.pendingExtraMapShare.stage[0][1]).toBe(4);
        expect(game.extraMapCursor).toBe(0);
        expect(game.extraMapActionMenu).toBeNull();
        expect(savedExtraMaps()[0]).not.toHaveProperty('stage');
        expect(decodeSharedMap(savedExtraMaps()[0].mapData).tiles[0][1]).toBe(4);
    });

    it('shows a notice when the share environment cannot create the required image', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        game.extraMaps = [{
            ...createBlankHeldMap(1, 1),
            cleared: true
        }];
        global.document.createElement = vi.fn(() => ({
            width: 0,
            height: 0,
            getContext: vi.fn(() => ({
                canvas: { width: 1200, height: 720 },
                createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
                fillRect: vi.fn(),
                strokeRect: vi.fn(),
                fillText: vi.fn(),
                drawImage: vi.fn()
            })),
            toBlob: vi.fn()
        }));

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(game.getExtraMapActionItems().findIndex(item => item.id === 'share'));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(game.noticeText).toBe(game.t('extraMap.notice.shareFailed'));
        consoleError.mockRestore();
    });

    it('loads a shared map query into held maps and starts extra map play', () => {
        const game = new Game(mockCanvas, mockAssets);
        const stage = createBlankHeldMap(2, 1).stage;
        stage[0][1] = 4;
        const mapData = encodeSharedMap(stage, 2);
        globalThis.history.replaceState(null, '', `/MagicCrystal/?map=${mapData}&debug=1#top`);

        expect(game.processSharedMapQuery()).toBe(true);

        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.extraMaps[0]).toMatchObject({
            difficulty: 2,
            cleared: false,
            favorite: false
        });
        expect(game.extraMaps[0].stage[0][1]).toBe(4);
        expect(game.state).toBe('WAIT_START');
        expect(game.isPlayingExtraMap()).toBe(true);
        expect(game.lives).toBe(1);
        expect(globalThis.location.search).toBe('?debug=1');
        expect(globalThis.location.hash).toBe('#top');
        expect(savedExtraMaps()).toHaveLength(HELD_MAP_LIMIT);
        expect(savedExtraMaps()[0]).not.toHaveProperty('stage');
        expect(decodeSharedMap(savedExtraMaps()[0].mapData).tiles[0][1]).toBe(4);
    });

    it('plays an existing held map without changing difficulty when shared map tiles are duplicated', () => {
        const game = new Game(mockCanvas, mockAssets);
        const stage = createBlankHeldMap(1, 1).stage;
        stage[1][1] = 5;
        game.extraMaps = [{
            stage,
            difficulty: 1,
            cleared: true,
            favorite: true
        }];
        const mapData = encodeSharedMap(stage, 4);
        globalThis.history.replaceState(null, '', `/MagicCrystal/?map=${mapData}`);

        game.processSharedMapQuery();

        expect(game.extraMaps).toHaveLength(1);
        expect(game.extraMaps[0]).toMatchObject({
            difficulty: 1,
            cleared: true,
            favorite: true
        });
        expect(game.extraMapCursor).toBe(0);
        expect(game.state).toBe('WAIT_START');
    });

    it('uses the first empty fixed slot when loading a new shared map query', () => {
        const game = new Game(mockCanvas, mockAssets);
        const stage = createBlankHeldMap(2).stage;
        stage[0][1] = 4;
        game.extraMaps = [createBlankHeldMap(1), null, createBlankHeldMap(3)];
        const mapData = encodeSharedMap(stage, 2);
        globalThis.history.replaceState(null, '', `/MagicCrystal/?map=${mapData}`);

        game.processSharedMapQuery();

        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.extraMaps[1]).toMatchObject({
            difficulty: 2,
            cleared: false,
            favorite: false
        });
        expect(game.extraMaps[1].stage[0][1]).toBe(4);
        expect(game.extraMapCursor).toBe(1);
        expect(game.state).toBe('WAIT_START');
    });

    it('opens extra map and shows a modal when shared map download has no empty slot', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.extraMaps = Array.from({ length: HELD_MAP_LIMIT }, () => createBlankHeldMap(1));
        const stage = createBlankHeldMap(2).stage;
        stage[0][1] = 4;
        const mapData = encodeSharedMap(stage, 2);
        globalThis.history.replaceState(null, '', `/MagicCrystal/?map=${mapData}&debug=1`);

        game.processSharedMapQuery();

        expect(game.state).toBe('EXTRA_MAP');
        expect(game.extraMapDownloadFullModalOpen).toBe(true);
        expect(game.extraMapCursor).toBe(0);
        expect(globalThis.location.search).toBe('?debug=1');

        game.input.actions.cancel = true;
        game.updateExtraMap();

        expect(game.extraMapDownloadFullModalOpen).toBe(false);
        expect(game.state).toBe('EXTRA_MAP');
    });

    it('shows the shared map load error modal for invalid map query data', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const game = new Game(mockCanvas, mockAssets);
        globalThis.history.replaceState(null, '', '/MagicCrystal/?map=invalid&debug=1');

        expect(game.processSharedMapQuery()).toBe(false);

        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.extraMaps.every(map => map === null)).toBe(true);
        expect(game.state).toBe('SHARED_MAP_LOAD_ERROR');
        expect(globalThis.location.search).toBe('?debug=1');

        game.input.prevActions.confirm = false;
        game.input.actions.confirm = true;
        game.updateSharedMapLoadError();

        expect(game.state).toBe('TITLE');
        consoleError.mockRestore();
    });

    it('toggles held-map favorite status without moving its slot', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.saveExtraMapEdit();
        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(game.getExtraMapActionItems().findIndex(item => item.id === 'favorite'));

        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.extraMaps[0].favorite).toBe(true);
        expect(game.extraMapCursor).toBe(0);
        expect(game.extraMapActionMenu).toBeNull();
        expect(savedExtraMaps()[0].favorite).toBe(true);

        game.openExtraMapActionMenu(0);
        const unfavoriteIndex = game.getExtraMapActionItems().findIndex(item => item.id === 'favorite');
        expect(game.getExtraMapActionItems()[unfavoriteIndex]).toMatchObject({ id: 'favorite', label: 'UNFAVORITE' });
        game.executeExtraMapAction(unfavoriteIndex);

        expect(game.extraMaps[0].favorite).toBe(false);
    });

    it('allows favorite status on every held map', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        game.extraMaps = [
            ...Array.from({ length: HELD_MAP_LIMIT - 1 }, (_, index) => ({
                ...createBlankHeldMap(1, index + 1),
                favorite: true
            })),
            createBlankHeldMap(1, HELD_MAP_LIMIT)
        ];
        const targetIndex = HELD_MAP_LIMIT - 1;

        game.openExtraMapActionMenu(targetIndex);
        const favoriteIndex = game.getExtraMapActionItems().findIndex(item => item.id === 'favorite');
        expect(game.getExtraMapActionItems()[favoriteIndex]).toMatchObject({ enabled: true });

        const saveCount = localStorage.setItem.mock.calls.length;
        game.executeExtraMapAction(favoriteIndex);

        expect(game.extraMaps[targetIndex].favorite).toBe(true);
        expect(game.noticeText).toBe('');
        expect(localStorage.setItem).toHaveBeenCalledTimes(saveCount + 1);
        expect(game.extraMapActionMenu).toBeNull();
    });

    it('deletes a held map only after delete confirmation', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        game.extraMaps = [createBlankHeldMap(1)];

        game.openExtraMapActionMenu(0);
        const deleteIndex = game.getExtraMapActionItems().findIndex(item => item.id === 'delete');

        expect(game.getExtraMapActionItems()[deleteIndex]).toMatchObject({
            id: 'delete',
            label: 'DELETE',
            enabled: true
        });

        game.executeExtraMapAction(deleteIndex);

        expect(game.extraMapDeleteConfirm).toEqual({ slotIndex: 0 });
        expect(game.extraMaps[0]).not.toBeNull();

        game.confirmExtraMapDelete();

        expect(game.extraMapDeleteConfirm).toBeNull();
        expect(game.extraMaps[0]).toBeNull();
        expect(savedExtraMaps()[0]).toBeNull();
    });

    it('keeps a held map when delete confirmation is cancelled', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        game.extraMaps = [createBlankHeldMap(1)];

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(game.getExtraMapActionItems().findIndex(item => item.id === 'delete'));
        game.closeExtraMapDeleteConfirm();

        expect(game.extraMapDeleteConfirm).toBeNull();
        expect(game.extraMaps[0]).not.toBeNull();
    });

    it('disables delete for favorite held maps', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        game.extraMaps = [{ ...createBlankHeldMap(1), favorite: true }];

        game.openExtraMapActionMenu(0);
        const deleteIndex = game.getExtraMapActionItems().findIndex(item => item.id === 'delete');

        expect(game.getExtraMapActionItems()[deleteIndex]).toMatchObject({
            id: 'delete',
            label: 'DELETE',
            enabled: false,
            noticeKey: 'extraMap.notice.favoriteDeleteProtected'
        });

        game.executeExtraMapAction(deleteIndex);

        expect(game.extraMapDeleteConfirm).toBeNull();
        expect(game.extraMaps[0]).not.toBeNull();
        expect(game.noticeText).toBe(game.t('extraMap.notice.favoriteDeleteProtected'));
    });

    it('starts held-map editing with help selected as the default editor function', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);

        expect(game.state).toBe('EDITOR');
        expect(game.isEditingExtraMap()).toBe(true);
        expect(game.extraMapActionMenu).toBeNull();
        expect(game.level.getTile(0, 0)).toBe(3);

        expect(game.getExtraMapEditorFunction()).toEqual({ id: 'controls' });
        expect(game.getExtraMapEditorFunctions().map(item => item.id)).toEqual([
            'controls',
            'tile',
            'tile',
            'tile',
            'tile',
            'tile',
            'tile',
            'tile',
            'tile',
            'difficulty',
            'save'
        ]);
    });

    it('opens and closes the extra map editor controls modal from the editor function bar', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);

        game.executeExtraMapEditorFunction();

        expect(game.extraMapEditorSession.controlsOpen).toBe(true);

        game.input.actions.cancel = true;
        game.updateExtraMapEditor();

        expect(game.extraMapEditorSession.controlsOpen).toBe(false);
        expect(game.state).toBe('EDITOR');
    });

    it('selects the editor function bar item before executing it', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);

        const initialTile = game.editor.selectedTile;
        game.selectExtraMapEditorFunctionBarItem('terrain');

        expect(game.getExtraMapEditorFunctionBarId()).toBe('terrain');
        expect(game.getExtraMapEditorFunction()).toEqual({ id: 'tile', tile: initialTile });

        game.selectExtraMapEditorTile(5);
        game.selectExtraMapEditorFunctionBarItem('terrain');

        expect(game.getExtraMapEditorFunctionBarId()).toBe('terrain');
        expect(game.getExtraMapEditorFunction()).toEqual({ id: 'tile', tile: 5 });
    });

    it('only places terrain from map-cell taps when the tapped cell is already selected', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);
        game.selectExtraMapEditorTile(5);

        game.tapExtraMapEditorCell(1, 0);

        expect(game.editor.cx).toBe(1);
        expect(game.editor.cy).toBe(0);
        expect(game.level.getTile(1, 0)).not.toBe(5);

        game.tapExtraMapEditorCell(1, 0);

        expect(game.level.getTile(1, 0)).toBe(5);
    });

    it('does not execute non-terrain editor functions from map-cell taps', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);
        game.selectExtraMapEditorFunctionById('save');

        game.tapExtraMapEditorCell(game.editor.cx, game.editor.cy);

        expect(game.state).toBe('EDITOR');
        expect(game.getExtraMapEditorFunctionBarId()).toBe('save');
    });

    it('does not close the extra map editor controls modal with confirm', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);
        game.openExtraMapEditorControls();

        game.input.actions.confirm = true;
        game.updateExtraMapEditor();

        expect(game.extraMapEditorSession.controlsOpen).toBe(true);
    });

    it('scrolls the extra map editor controls modal while it is open', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);
        game.openExtraMapEditorControls();

        game.input.actions.down = true;
        game.updateExtraMapEditor();

        expect(game.extraMapEditorSession.controlsScroll).toBeGreaterThan(0);
        expect(game.extraMapEditorSession.controlsOpen).toBe(true);
    });

    it('returns from how to play with cancel but not confirm', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'HOW_TO_PLAY';
        game.input.actions.confirm = true;

        game.updateHowToPlay();

        expect(game.state).toBe('HOW_TO_PLAY');

        game.input.actions.confirm = false;
        game.input.actions.cancel = true;
        game.updateHowToPlay();

        expect(game.state).toBe('TITLE');
    });

    it('changes edit difficulty through the difficulty modal without dropping clear status on save', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 20; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.extraMaps[0].cleared = true;
        game.startExtraMapEdit(0);

        game.selectExtraMapEditorFunctionById('difficulty');
        game.executeExtraMapEditorFunction();
        game.input.actions.right = true;
        game.updateExtraMapEditor();
        game.input.prevActions.right = true;
        game.input.actions.right = false;
        game.input.actions.cancel = true;
        game.updateExtraMapEditor();
        game.saveExtraMapEdit();

        expect(game.state).toBe('EXTRA_MAP');
        expect(game.extraMaps[0].difficulty).toBe(2);
        expect(game.extraMaps[0].cleared).toBe(true);
    });

    it('closes the difficulty modal without reverting immediate editor difficulty changes', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 20; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.extraMaps[0].difficulty = 1;
        game.startExtraMapEdit(0);
        game.selectExtraMapEditorFunctionById('difficulty');
        game.executeExtraMapEditorFunction();

        game.input.actions.right = true;
        game.updateExtraMapEditor();
        expect(game.extraMapEditorSession.difficulty).toBe(2);

        game.input.prevActions.right = true;
        game.input.actions.right = false;
        game.input.actions.cancel = true;
        game.updateExtraMapEditor();

        expect(game.extraMapEditorSession.difficultyOpen).toBe(false);
        expect(game.extraMapEditorSession.difficulty).toBe(2);
    });

    it('cycles editor functions with smart keys and places terrain with confirm', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);
        game.editor.cx = 1;
        game.editor.cy = 0;

        game.input.actions.smartRight = true;
        game.updateExtraMapEditor();
        game.input.prevActions.smartRight = true;
        game.input.actions.smartRight = false;
        game.input.actions.confirm = true;
        game.updateExtraMapEditor();

        expect(game.editor.selectedTile).toBe(0);
        expect(game.level.getTile(1, 0)).toBe(0);

        game.input.prevActions.confirm = true;
        game.input.actions.confirm = false;
        game.input.prevActions.smartRight = false;
        game.input.actions.smartRight = true;
        game.updateExtraMapEditor();
        game.input.prevActions.smartRight = true;
        game.input.actions.smartRight = false;
        game.input.prevActions.confirm = false;
        game.input.actions.confirm = true;
        game.updateExtraMapEditor();

        expect(game.editor.selectedTile).toBe(1);
        expect(game.level.getTile(1, 0)).toBe(1);
    });

    it('discards extra map editing through the hold cancel action', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);
        game.level.setTile(1, 0, 1);

        game.input.setVirtualKey('x', true);
        for (let i = 0; i < game.giveUpMax; i++) {
            game.updateExtraMapEditor();
        }

        expect(game.state).toBe('EXTRA_MAP');
        expect(game.extraMaps[0].stage[0][1]).toBe(0);
    });

    it('saves edited stages and drops clear status when the stage changed', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.extraMaps[0].cleared = true;
        game.startExtraMapEdit(0);
        game.level.setTile(1, 0, 1);

        game.saveExtraMapEdit();

        expect(game.state).toBe('EXTRA_MAP');
        expect(game.extraMaps[0].stage[0][1]).toBe(1);
        expect(game.extraMaps[0].cleared).toBe(false);
        const savedMap = JSON.parse(localStorage.getItem('magic-crystal')).extraMaps.d.maps[0];
        expect(savedMap).not.toHaveProperty('stage');
        expect(decodeSharedMap(savedMap.mapData).tiles[0][1]).toBe(1);
    });

    it('discards edited stages without saving them', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);
        game.startExtraMapEdit(0);
        game.level.setTile(1, 0, 1);

        game.discardExtraMapEdit();

        expect(game.state).toBe('EXTRA_MAP');
        expect(game.extraMaps[0].stage[0][1]).toBe(0);
    });

    it('removes a newly created held map when the first edit is discarded', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        game.openExtraMapActionMenu(0);
        game.executeExtraMapAction(1);

        expect(game.state).toBe('EDITOR');
        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);

        game.discardExtraMapEdit();

        expect(game.state).toBe('EXTRA_MAP');
        expect(game.extraMaps).toHaveLength(HELD_MAP_LIMIT);
        expect(game.extraMaps[0]).toBeNull();
        expect(savedExtraMaps()[0]).toBeNull();
    });

    it('does not create a blank held map when extra map editing is locked', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';
        game.openExtraMapActionMenu(0);

        expect(game.getExtraMapActionItems()[1]).toMatchObject({ id: 'create', enabled: false });

        game.executeExtraMapAction(1);

        expect(game.extraMaps).toEqual(new Array(HELD_MAP_LIMIT).fill(null));
        expect(game.extraMapFunctionCursor).toBe(1);
    });

    it('cycles extra map functions with smart keys', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';

        game.input.actions.smartRight = true;
        game.updateExtraMap();
        expect(game.extraMapFunctionCursor).toBe(1);

        game.input.prevActions.smartRight = true;
        game.input.actions.smartRight = false;
        game.input.actions.smartLeft = true;
        game.updateExtraMap();
        expect(game.extraMapFunctionCursor).toBe(0);
    });

    it('limits max difficulty by normal stage clear progress', () => {
        const game = new Game(mockCanvas, mockAssets);

        expect(game.isExtraMapEditUnlocked()).toBe(false);
        expect(game.getMaxExtraMapDifficulty()).toBe(1);

        for (let stage = 0; stage < 10; stage++) {
            game.stageClearHistory[stage] = true;
        }

        expect(game.isExtraMapEditUnlocked()).toBe(true);
        expect(game.getMaxExtraMapDifficulty()).toBe(1);

        for (let stage = 10; stage < 20; stage++) {
            game.stageClearHistory[stage] = true;
        }

        expect(game.getMaxExtraMapDifficulty()).toBe(2);

        for (let stage = 20; stage < 50; stage++) {
            game.stageClearHistory[stage] = true;
        }

        expect(game.getMaxExtraMapDifficulty()).toBe(5);
    });

    it('returns from extra map to title with cancel', () => {
        const game = new Game(mockCanvas, mockAssets);
        game.state = 'EXTRA_MAP';

        game.input.actions.cancel = true;
        game.updateExtraMap();

        expect(game.state).toBe('TITLE');
        expect(game.selectExitTimer).toBe(0);
    });
});
