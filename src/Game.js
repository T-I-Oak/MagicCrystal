import { Input } from './Input.js';
import { Level, LevelEditor } from './Level.js';
import { Physics } from './Physics.js';
import { Renderer } from './Renderer.js';
import packageData from '../package.json';
import { getActiveLanguage, onLanguageChange, setLanguage } from '../../GameWorksOAK/src/lib/core/i18n.js';
import { setAppVersion } from '../../GameWorksOAK/src/lib/utils/env.js';
import { SUPPORTED_LANGUAGES, t, tr } from './i18nText.js';
import { GameDataStore } from './gameDataStore.js';
import { createEmptyStageClearFlags, getUnlockedStageCount, isStageUnlocked, NORMAL_STAGE_COUNT } from './stageUnlock.js';
import { getNormalStageDifficulty } from './normalStageData.js';
import {
    clearHeldMapSlot,
    createBlankHeldMap,
    findFirstEmptyHeldMapSlot,
    setHeldMapFavorite,
    setHeldMapAtSlot
} from './extraMapData.js';
import { decodeSharedMap, encodeSharedMap } from './sharedMapCodec.js';
import {
    createCongratulationsShareImageBlob,
    createCongratulationsShareImagePayload,
    createExtraMapShareImageBlob,
    createExtraMapShareImagePayload
} from './shareImage.js';
import { createCongratulationsShareText, createExtraMapShareText, shareExtraMapImage } from './shareService.js';

const SETTINGS_ITEM_COUNT = 6;
const EXTRA_MAP_EDITOR_FUNCTIONS = [
    { id: 'controls' },
    { id: 'tile', tile: 0 },
    { id: 'tile', tile: 1 },
    { id: 'tile', tile: 2 },
    { id: 'tile', tile: 3 },
    { id: 'tile', tile: 4 },
    { id: 'tile', tile: 5 },
    { id: 'tile', tile: 6 },
    { id: 'tile', tile: 7 },
    { id: 'difficulty' },
    { id: 'save' }
];
const EDITOR_TILE_NAME_PATHS = [
    'howToPlay.terrain.empty.name',
    'howToPlay.terrain.soil.name',
    'howToPlay.terrain.rock.name',
    'howToPlay.terrain.portal.name',
    'howToPlay.terrain.redCrystal.name',
    'howToPlay.terrain.blueCrystal.name',
    'howToPlay.terrain.soilMemory.name',
    'howToPlay.terrain.rockMemory.name'
];
const HOW_TO_PLAY_SCROLL_MAX = 2300;
const EXTRA_MAP_EDITOR_CONTROLS_SCROLL_MAX = 470;
const SETTINGS_FPS_MIN = 10;
const SETTINGS_FPS_MAX = 60;

export class Game {
    constructor(canvas, assets) {
        setAppVersion(packageData.version);
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.assets = assets; // Injected (Loaded)
        this.version = packageData.version;

        // HIGH RES UPDATE: 40x40 per tile
        this.tileWidth = 40;
        this.tileHeight = 40;
        this.cols = 24;
        this.rows = 13;

        this.canvas.width = this.cols * this.tileWidth;
        this.canvas.height = this.rows * this.tileHeight + 140; // 80px Header + 60px Footer

        this.input = new Input();
        this.level = new Level(this.cols, this.rows);
        this.physics = new Physics();
        this.editor = new LevelEditor(this.level);
        this.renderer = new Renderer(this.ctx, this.assets);
        this.dataStore = new GameDataStore();

        this.targetFPS = 45;
        this.deltaTime = 1000 / this.targetFPS;
        this.accumulator = 0;

        // --- STATE MANAGEMENT ---
        this._state = 'TITLE';
        this.lastStateChange = Date.now();
        this.lives = 3;
        this.maxLives = 9;
        this.stageClearHistory = this.dataStore.loadStageProgress().clearedStages;
        this.extraMaps = this.dataStore.loadExtraMaps().maps;
        this.currentGameClearedStages = createEmptyStageClearFlags();
        this.stage = 0;
        this.stateTimer = 0;

        // UI State
        // Title menus are split into MAIN and SETTINGS screens
        this.titleCursor = 0;     // MAIN title menu cursor (0..3)
        this.settingsCursor = 0;  // SETTINGS menu cursor
        this.settingsReturnState = 'TITLE';
        this.selectCursor = 0;
        this.selectStageFunctionCursor = 0;
        this.extraMapCursor = 0;
        this.extraMapFunctionCursor = 0;
        this.congratulationsCursor = 0;
        this.extraMapActionMenu = null;
        this.extraMapEditorSession = null;
        this.extraMapPlaySession = null;
        this.extraMapDownloadFullModalOpen = false;
        this.extraMapDeleteConfirm = null;
        this.copiedExtraMapStage = null;
        this.pendingExtraMapShare = null;
        this.noticeText = '';
        this.noticeTimer = 0;
        this.supportedLanguages = SUPPORTED_LANGUAGES;
        this.language = getActiveLanguage();
        this.unsubscribeLanguageChange = onLanguageChange((language) => {
            this.language = language;
        });

        // Settings
        this.padType = 1; // 0: None, 1: Single, 2: Dual (Changed from 0:S, 1:D)
        this.padPosX = 50; // 0-100%
        this.padPosY = 25;  // 0-100% (Default 25 to avoid off-screen)
        this.padSize = 100;
        this.screenSize = 100; // 50-100% Game Screen Scale
        this.tempScreenSize = 100; // Preview
        this.loadSettings(); // Load saved settings (will update screenSize & tempScreenSize)
        this.updatePadLayout(); // Initial Apply

        this.crystalCount = 0;
        this.ES = 0;
        this.giveUpTimer = 0;
        this.giveUpMax = 60; // 1 sec hold
        this.selectExitTimer = 0; // Timer for exiting stage select
        this.howToPlayScroll = 0;
        this.isSaved = false;
    }

    get state() { return this._state; }
    set state(val) {
        if (this._state !== val) {
            this._state = val;
            this.lastStateChange = Date.now();
        }
    }

    updatePadLayout() {
        const ctrl = document.getElementById('touch-controls');
        if (!ctrl) return;

        const p1 = ctrl.querySelector('.primary-pad');
        const p2 = ctrl.querySelector('.secondary-pad');

        // Reset Styles
        ctrl.className = 'overlay-controls';
        if (p1) { p1.setAttribute('style', ''); }
        if (p2) { p2.setAttribute('style', ''); }

        const s = this.padSize / 100;

        if (this.padType === 0) {
            // NONE: Hide everything
            if (p1) p1.style.display = 'none';
            if (p2) p2.style.display = 'none';
        } else if (this.padType === 1) {
            // SINGLE
            if (p2) p2.style.display = 'none';
            if (p1) {
                p1.style.display = 'grid';
                p1.style.position = 'absolute';
                p1.style.left = `${this.padPosX}%`;
                p1.style.bottom = `${this.padPosY}%`;
                p1.style.transform = `translate(-50%, 50%) scale(${s})`;
            }
        } else {
            // DUAL
            if (p1) p1.style.display = 'grid';
            if (p2) p2.style.display = 'grid';

            const dist = this.padPosX;
            const bottom = this.padPosY;

            if (p1) {
                p1.style.position = 'absolute';
                p1.style.left = `${dist}%`;
                p1.style.bottom = `${bottom}%`;
                p1.style.transform = `translate(-50%, 50%) scale(${s})`;
            }

            if (p2) {
                p2.style.position = 'absolute';
                p2.style.right = `${dist}%`;
                p2.style.bottom = `${bottom}%`;
                p2.style.transform = `translate(50%, 50%) scale(${s})`;
            }
        }
    }

    loadStage(index) {
        this.stage = index;
        this.level.loadStage(index);
        this.resetPlayer();
    }

    resetPlayer() {
        let startX = 4, startY = 4;
        this.crystalCount = 0;
        for (let y = 0; y < this.level.rows; y++) {
            for (let x = 0; x < this.level.cols; x++) {
                if (this.level.data[y][x] === 3) { startX = x * 4; startY = y * 4; }
                if (this.level.data[y][x] === 4 || this.level.data[y][x] === 5) this.crystalCount++;
            }
        }
        this.player = { x: startX, y: startY, vx: 0, vy: 0, jumpState: 0, faceRight: true, lives: 3 };
        this.ES = 0; // Earthquake Switch
    }

    saveLevel() {
        this.dataStore.saveEditorLevel(this.level.serialize());
        this.isSaved = true;
    }

    loadLevel() {
        const data = this.dataStore.loadEditorLevel();
        if (data) {
            this.level.deserialize(data);
            this.resetPlayer();
            this.isSaved = true;
        }
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.boundLoop = this.loop.bind(this); // Bind once
        requestAnimationFrame(this.boundLoop);
    }

    loop(timestamp) {
        if (!this.running) return;
        const frameTime = timestamp - this.lastTime; this.lastTime = timestamp; this.accumulator += frameTime;

        while (this.accumulator >= this.deltaTime) {
            this.update(); // Update Logic
            this.input.update(); // Cycle Input (prevActions and Buffers)
            this.accumulator -= this.deltaTime;
        }

        this.render(); // Delegated Render
        requestAnimationFrame(this.boundLoop);
    }

    update() {
        // Timer Logic
        this.updateNotice();

        if (this.stateTimer > 0) {
            this.stateTimer -= this.deltaTime / 1000;
            if (this.stateTimer <= 0) {
                this.stateTimer = 0;
                this.onTimerEnd();
            }
        }

        switch (this.state) {
            case 'TITLE': this.updateTitle(); break;
            case 'SETTINGS': this.updateSettings(); break;
            case 'HOW_TO_PLAY': this.updateHowToPlay(); break;
            case 'SELECT': this.updateSelect(); break;
            case 'SHARED_MAP_LOAD_ERROR': this.updateSharedMapLoadError(); break;
            case 'EXTRA_MAP': this.updateExtraMap(); break;
            case 'WAIT_START': break; // Wait for timer (handled in update top)
            case 'PLAY': this.updatePlay(); break;
            case 'EDITOR':
                if (this.isEditingExtraMap()) {
                    this.updateExtraMapEditor();
                    break;
                }
                // Use giveUp (x key or Numpad3) for long-press back to SELECT
                if (this.input.giveUp) {
                    this.giveUpTimer++;
                    if (this.giveUpTimer >= this.giveUpMax) {
                        this.state = 'SELECT';
                        this.giveUpTimer = 0;
                    }
                } else {
                    this.giveUpTimer = 0;
                    this.editor.update(this.input);
                }
                break;
            case 'GAMEOVER': if (this.input.isJustPressed('confirm')) this.state = 'TITLE'; break;
            case 'ALLCLEAR':
            case 'CONGRATULATIONS':
                this.updateCongratulations();
                break;
        }
    }

    onTimerEnd() {
        if (this.state === 'WAIT_MISS') {
            if (this.isPlayingExtraMap()) {
                this.endExtraMapPlay();
                return;
            }
            if (this.lives > 0) this.state = 'SELECT';
            else this.state = 'GAMEOVER'; // Logical Fallback if lives went to 0 but state was WAIT_MISS
        } else if (this.state === 'WAIT_CLEAR') {
            if (this.isPlayingExtraMap()) {
                this.endExtraMapPlay();
                return;
            }
            if (this.shouldOpenCongratulations()) this.openCongratulations();
            else this.state = 'SELECT';
        } else if (this.state === 'WAIT_GAMEOVER') {
            this.state = 'TITLE';
        } else if (this.state === 'WAIT_START') {
            this.state = 'PLAY';
        }
    }

    updateTitle() {
        if (this.input.isJustPressed('down')) this.titleCursor = (this.titleCursor + 1) % 4;
        if (this.input.isJustPressed('up')) this.titleCursor = (this.titleCursor + 3) % 4; // -1

        // Title MAIN: never show drag handles
        document.querySelectorAll('.drag-handle').forEach(h => h.classList.remove('visible'));

        if (this.input.isJustPressed('confirm')) {
            if (this.titleCursor === 0) {
                this.selectCursor = 0;
                this.selectStageFunctionCursor = 0;
                this.lives = 3;
                this.currentGameClearedStages = createEmptyStageClearFlags();
                this.state = 'SELECT';
            } else if (this.titleCursor === 1) {
                this.howToPlayScroll = 0;
                this.state = 'HOW_TO_PLAY';
            } else if (this.titleCursor === 2) {
                if (!this.canOpenExtraMap()) return;
                this.state = 'EXTRA_MAP';
            } else if (this.titleCursor === 3) {
                this.settingsReturnState = 'TITLE';
                this.state = 'SETTINGS';
            }
        }
    }

    updateExtraMap() {
        if (this.extraMapDeleteConfirm) {
            if (this.input.isJustPressed('confirm')) {
                this.confirmExtraMapDelete();
            } else if (this.input.isJustPressed('cancel')) {
                this.closeExtraMapDeleteConfirm();
            }
            return;
        }

        if (this.extraMapDownloadFullModalOpen) {
            if (this.input.isJustPressed('confirm') || this.input.isJustPressed('cancel')) {
                this.closeExtraMapDownloadFullModal();
            }
            return;
        }

        if (this.input.isJustPressed('cancel')) {
            this.state = 'TITLE';
            this.selectExitTimer = 0;
            return;
        }

        const left = this.input.isJustPressed('left');
        const right = this.input.isJustPressed('right');
        const up = this.input.isJustPressed('up');
        const down = this.input.isJustPressed('down');

        if (right) this.extraMapCursor = (this.extraMapCursor + 1) % 50;
        if (left) this.extraMapCursor = (this.extraMapCursor + 49) % 50;
        if (down) this.extraMapCursor = (this.extraMapCursor + 10) % 50;
        if (up) this.extraMapCursor = (this.extraMapCursor + 40) % 50;

        const items = this.getExtraMapActionItems();
        if (this.input.isJustPressed('smartRight')) {
            this.extraMapFunctionCursor = (this.extraMapFunctionCursor + 1) % items.length;
        }
        if (this.input.isJustPressed('smartLeft')) {
            this.extraMapFunctionCursor = (this.extraMapFunctionCursor + items.length - 1) % items.length;
        }

        if (this.input.isJustPressed('confirm')) {
            this.executeExtraMapAction(this.extraMapFunctionCursor);
        }
    }

    updateSharedMapLoadError() {
        if (this.input.isJustPressed('confirm') || this.input.isJustPressed('cancel')) {
            this.state = 'TITLE';
        }
    }

    openExtraMapDownloadFullModal() {
        this.extraMapActionMenu = null;
        this.extraMapEditorSession = null;
        this.extraMapPlaySession = null;
        this.giveUpTimer = 0;
        this.extraMapDownloadFullModalOpen = true;
        this.state = 'EXTRA_MAP';
    }

    closeExtraMapDownloadFullModal() {
        this.extraMapDownloadFullModalOpen = false;
    }

    openExtraMapDeleteConfirm(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.extraMaps.length) return;
        if (!this.extraMaps[slotIndex] || this.extraMaps[slotIndex].favorite) return;

        this.extraMapDeleteConfirm = { slotIndex };
        this.closeExtraMapActionMenu();
    }

    closeExtraMapDeleteConfirm() {
        this.extraMapDeleteConfirm = null;
    }

    confirmExtraMapDelete() {
        const slotIndex = this.extraMapDeleteConfirm?.slotIndex ?? -1;
        this.closeExtraMapDeleteConfirm();
        this.deleteExtraMap(slotIndex);
    }

    openExtraMapActionMenu(slotIndex) {
        this.extraMapCursor = slotIndex;
        this.extraMapFunctionCursor = 0;
        this.extraMapActionMenu = null;
        this.selectExitTimer = 0;
    }

    closeExtraMapActionMenu() {
        this.extraMapActionMenu = null;
    }

    showNotice(message, duration = 120) {
        this.noticeText = message;
        this.noticeTimer = duration;
    }

    updateNotice() {
        if (this.noticeTimer <= 0) return;
        this.noticeTimer--;
        if (this.noticeTimer <= 0) {
            this.noticeText = '';
            this.noticeTimer = 0;
        }
    }

    getExtraMapActionItems(slotIndex = this.extraMapCursor) {
        const heldMap = this.extraMaps[slotIndex];
        const hasCopiedStage = this.hasCopiedExtraMapStage();
        const editUnlocked = this.isExtraMapEditUnlocked();

        return [
            { id: 'play', label: this.t('extraMap.actions.play'), enabled: !!heldMap },
            {
                id: heldMap ? 'edit' : 'create',
                label: this.t(heldMap ? 'extraMap.actions.edit' : 'extraMap.actions.create'),
                labelCandidates: [
                    this.t('extraMap.actions.edit'),
                    this.t('extraMap.actions.create')
                ],
                enabled: editUnlocked,
                noticeKey: editUnlocked ? null : 'extraMap.notice.editLocked'
            },
            { id: 'copy', label: this.t('extraMap.actions.copy'), enabled: !!heldMap },
            {
                id: 'paste',
                label: this.t('extraMap.actions.paste'),
                enabled: hasCopiedStage,
                noticeKey: hasCopiedStage ? null : 'extraMap.notice.noCopiedStage'
            },
            {
                id: 'favorite',
                label: this.t(heldMap?.favorite ? 'extraMap.actions.unfavorite' : 'extraMap.actions.favorite'),
                labelCandidates: [
                    this.t('extraMap.actions.favorite'),
                    this.t('extraMap.actions.unfavorite')
                ],
                enabled: !!heldMap
            },
            {
                id: 'share',
                label: this.t('extraMap.actions.share'),
                enabled: !!heldMap && heldMap.cleared === true,
                noticeKey: heldMap && heldMap.cleared !== true ? 'extraMap.notice.shareRequiresClear' : null
            },
            {
                id: 'delete',
                label: this.t('extraMap.actions.delete'),
                enabled: !!heldMap && heldMap.favorite !== true,
                noticeKey: heldMap?.favorite ? 'extraMap.notice.favoriteDeleteProtected' : null
            }
        ];
    }

    executeExtraMapAction(itemIndex = this.extraMapFunctionCursor, slotIndex = this.extraMapCursor) {
        const items = this.getExtraMapActionItems(slotIndex);
        const item = items[itemIndex];
        if (!item) return;
        this.extraMapFunctionCursor = itemIndex;
        if (!item.enabled) {
            if (item.noticeKey) this.showNotice(this.t(item.noticeKey));
            return;
        }

        if (item.id === 'play') {
            this.startExtraMapPlay(slotIndex);
            return;
        }

        if (item.id === 'copy') {
            this.copyExtraMapStage(slotIndex);
            return;
        }

        if (item.id === 'paste') {
            this.pasteExtraMapStage(slotIndex);
            return;
        }

        if (item.id === 'share') {
            this.prepareExtraMapShare(slotIndex);
            return;
        }

        if (item.id === 'create') {
            const result = setHeldMapAtSlot(
                this.extraMaps,
                slotIndex,
                createBlankHeldMap(this.getMaxExtraMapDifficulty())
            );
            this.extraMaps = result.maps;
            if (result.index >= 0) this.extraMapCursor = result.index;
            this.dataStore.saveExtraMaps({ maps: this.extraMaps });
            this.startExtraMapEdit(result.index, { removeOnDiscard: true });
        }

        if (item.id === 'edit') {
            this.startExtraMapEdit(slotIndex);
            return;
        }

        if (item.id === 'favorite') {
            this.toggleExtraMapFavorite(slotIndex);
            return;
        }

        if (item.id === 'delete') {
            this.openExtraMapDeleteConfirm(slotIndex);
        }
    }

    toggleExtraMapFavorite(slotIndex) {
        const heldMap = this.extraMaps[slotIndex];
        if (!heldMap) return;

        const result = setHeldMapFavorite(this.extraMaps, slotIndex, !heldMap.favorite);
        if (!result.changed) return;

        this.extraMaps = result.maps;
        if (result.index >= 0) this.extraMapCursor = result.index;
        this.dataStore.saveExtraMaps({ maps: this.extraMaps });
        this.closeExtraMapActionMenu();
    }

    deleteExtraMap(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.extraMaps.length) return;
        if (!this.extraMaps[slotIndex] || this.extraMaps[slotIndex].favorite) return;

        const result = clearHeldMapSlot(this.extraMaps, slotIndex);
        this.extraMaps = result.maps;
        this.extraMapCursor = slotIndex;
        this.dataStore.saveExtraMaps({ maps: this.extraMaps });
        this.closeExtraMapActionMenu();
    }

    hasCopiedExtraMapStage() {
        return this.copiedExtraMapStage !== null;
    }

    copyExtraMapStage(slotIndex) {
        if (!this.extraMaps[slotIndex]) return;

        this.extraMapCursor = slotIndex;
        const heldMap = this.extraMaps[slotIndex];
        this.copiedExtraMapStage = {
            stage: cloneStageData(heldMap.stage),
            difficulty: heldMap.difficulty
        };
        this.dataStore.saveExtraMaps({ maps: this.extraMaps });
        this.closeExtraMapActionMenu();
    }

    pasteExtraMapStage(slotIndex) {
        if (!this.hasCopiedExtraMapStage()) return;

        const difficulty = Math.min(this.copiedExtraMapStage.difficulty, this.getMaxExtraMapDifficulty());
        const pastedMap = {
            stage: cloneStageData(this.copiedExtraMapStage.stage),
            difficulty,
            cleared: false,
            favorite: false
        };

        if (this.extraMaps[slotIndex]) {
            const targetMap = {
                ...this.extraMaps[slotIndex],
                stage: pastedMap.stage,
                difficulty,
                cleared: false
            };
            const result = setHeldMapAtSlot(this.extraMaps, slotIndex, targetMap);
            this.extraMaps = result.maps;
            this.extraMapCursor = slotIndex;
        } else {
            const result = setHeldMapAtSlot(this.extraMaps, slotIndex, pastedMap);
            this.extraMaps = result.maps;
            this.extraMapCursor = result.index;
        }

        this.dataStore.saveExtraMaps({ maps: this.extraMaps });
        this.closeExtraMapActionMenu();
    }

    prepareExtraMapShare(slotIndex) {
        const heldMap = this.extraMaps[slotIndex];
        if (!heldMap || heldMap.cleared !== true) return;

        this.extraMapCursor = slotIndex;
        const touchedMap = this.extraMaps[slotIndex];
        const stage = cloneStageData(touchedMap.stage);
        const mapData = encodeSharedMap(stage, touchedMap.difficulty);
        this.pendingExtraMapShare = {
            mapData,
            url: this.createExtraMapShareUrl(mapData),
            stage,
            difficulty: touchedMap.difficulty
        };
        this.pendingExtraMapShare.image = createExtraMapShareImagePayload(this.pendingExtraMapShare);
        this.dataStore.saveExtraMaps({ maps: this.extraMaps });
        this.closeExtraMapActionMenu();
        this.sharePendingExtraMap().catch(error => {
            console.error(error);
            this.showNotice(this.t('extraMap.notice.shareFailed'));
        });
    }

    async sharePendingExtraMap() {
        if (!this.pendingExtraMapShare?.image || !globalThis.document?.createElement) {
            return null;
        }

        const blob = await createExtraMapShareImageBlob(this.pendingExtraMapShare.image, { assets: this.assets });
        const text = createExtraMapShareText(
            this.pendingExtraMapShare.url,
            this.t('extraMap.shareTextPrompt'),
            this.pendingExtraMapShare.difficulty,
            this.t('extraMap.shareDifficultyLabel')
        );
        return shareExtraMapImage({
            blob,
            text,
            confirmLabels: {
                title: this.t('extraMap.shareConfirm.title'),
                lines: this.tr('extraMap.shareConfirm.lines'),
                openX: this.t('extraMap.shareConfirm.openX'),
                close: this.t('extraMap.shareConfirm.close')
            }
        });
    }

    openCongratulations() {
        this.congratulationsCursor = 0;
        this.state = 'CONGRATULATIONS';
    }

    shouldOpenCongratulations() {
        return this.currentGameClearedStages.every(Boolean);
    }

    getCongratulationsActionItems() {
        return [
            { id: 'share', label: this.t('congratulations.actions.share'), enabled: true },
            { id: 'title', label: this.t('congratulations.actions.title'), enabled: true }
        ];
    }

    updateCongratulations() {
        const items = this.getCongratulationsActionItems();
        if (this.input.isJustPressed('left') || this.input.isJustPressed('smartLeft')) {
            this.congratulationsCursor = (this.congratulationsCursor + items.length - 1) % items.length;
        }
        if (this.input.isJustPressed('right') || this.input.isJustPressed('smartRight')) {
            this.congratulationsCursor = (this.congratulationsCursor + 1) % items.length;
        }
        if (this.input.isJustPressed('cancel')) {
            this.state = 'TITLE';
            return;
        }
        if (this.input.isJustPressed('confirm')) {
            this.executeCongratulationsAction(this.congratulationsCursor);
        }
    }

    executeCongratulationsAction(actionIndex = this.congratulationsCursor) {
        const item = this.getCongratulationsActionItems()[actionIndex];
        if (!item) return;
        this.congratulationsCursor = actionIndex;
        if (item.id === 'title') {
            this.state = 'TITLE';
            return;
        }
        if (item.id === 'share') {
            this.shareCongratulations().catch(error => {
                console.error(error);
                this.showNotice(this.t('congratulations.notice.shareFailed'));
            });
        }
    }

    async shareCongratulations() {
        if (!globalThis.document?.createElement) return null;
        const image = createCongratulationsShareImagePayload();
        const blob = await createCongratulationsShareImageBlob(image, { assets: this.assets });
        const text = createCongratulationsShareText(
            this.createGameShareUrl(),
            this.t('congratulations.shareTextPrompt')
        );
        return shareExtraMapImage({
            blob,
            text,
            confirmLabels: {
                title: this.t('congratulations.shareConfirm.title'),
                lines: this.tr('congratulations.shareConfirm.lines'),
                openX: this.t('congratulations.shareConfirm.openX'),
                close: this.t('congratulations.shareConfirm.close')
            }
        });
    }

    createGameShareUrl() {
        const location = globalThis.location;
        if (!location || !location.origin || !location.pathname) {
            return '';
        }
        return `${location.origin}${location.pathname}`;
    }

    createExtraMapShareUrl(mapData) {
        const encodedMapData = encodeURIComponent(mapData);
        const location = globalThis.location;
        if (!location || !location.origin || !location.pathname) {
            return `?map=${encodedMapData}`;
        }

        return `${location.origin}${location.pathname}?map=${encodedMapData}`;
    }

    processSharedMapQuery({ locationRef = globalThis.location, historyRef = globalThis.history } = {}) {
        const mapData = getSharedMapQueryValue(locationRef);
        if (!mapData) return false;

        this.removeSharedMapQueryValue(locationRef, historyRef);

        try {
            const decodedMap = decodeSharedMap(mapData);
            this.importSharedMap(decodedMap);
            return true;
        } catch (error) {
            console.error(error);
            this.extraMapActionMenu = null;
            this.extraMapEditorSession = null;
            this.extraMapPlaySession = null;
            this.giveUpTimer = 0;
            this.state = 'SHARED_MAP_LOAD_ERROR';
            return false;
        }
    }

    removeSharedMapQueryValue(locationRef = globalThis.location, historyRef = globalThis.history) {
        if (!locationRef?.origin || !locationRef?.pathname || !historyRef?.replaceState) return;

        const params = new URLSearchParams(locationRef.search || '');
        params.delete('map');
        const query = params.toString();
        const nextUrl = `${locationRef.origin}${locationRef.pathname}${query ? `?${query}` : ''}${locationRef.hash || ''}`;
        historyRef.replaceState(null, '', nextUrl);
    }

    importSharedMap({ tiles, difficulty }) {
        const duplicateIndex = this.extraMaps.findIndex((map) => map && areStagesEqual(map.stage, tiles));

        if (duplicateIndex >= 0) {
            this.extraMapCursor = duplicateIndex;
        } else {
            const emptyIndex = findFirstEmptyHeldMapSlot(this.extraMaps);
            if (emptyIndex < 0) {
                this.openExtraMapDownloadFullModal();
                return;
            }

            const result = setHeldMapAtSlot(this.extraMaps, emptyIndex, {
                stage: cloneStageData(tiles),
                difficulty,
                cleared: false,
                favorite: false
            });
            this.extraMaps = result.maps;
            this.extraMapCursor = result.index;
        }

        this.dataStore.saveExtraMaps({ maps: this.extraMaps });
        this.startExtraMapPlay(this.extraMapCursor);
    }

    startExtraMapPlay(slotIndex) {
        if (!this.extraMaps[slotIndex]) return;

        this.extraMapCursor = slotIndex;
        const heldMap = this.extraMaps[slotIndex];
        this.level.data = cloneStageData(heldMap.stage);
        this.stage = slotIndex;
        this.extraMapPlaySession = {
            slotIndex
        };
        this.closeExtraMapActionMenu();
        this.lives = 1;
        this.resetPlayer();
        this.giveUpTimer = 0;
        this.state = 'WAIT_START';
        this.stateTimer = 1.0;
    }

    startExtraMapEdit(slotIndex, options = {}) {
        if (!this.isExtraMapEditUnlocked() || !this.extraMaps[slotIndex]) return;

        this.extraMapCursor = slotIndex;
        const heldMap = this.extraMaps[slotIndex];
        const difficulty = Math.min(heldMap.difficulty, this.getMaxExtraMapDifficulty());
        this.level.data = cloneStageData(heldMap.stage);
        this.editor = new LevelEditor(this.level);
        this.extraMapEditorSession = {
            slotIndex,
            originalStage: cloneStageData(heldMap.stage),
            originalDifficulty: heldMap.difficulty,
            difficulty,
            controlsOpen: false,
            controlsScroll: 0,
            difficultyOpen: false,
            difficultyCursor: 0,
            functionCursor: 0,
            removeOnDiscard: options.removeOnDiscard === true
        };
        this.closeExtraMapActionMenu();
        this.giveUpTimer = 0;
        this.state = 'EDITOR';
    }

    updateExtraMapEditor() {
        if (this.extraMapEditorSession.controlsOpen) {
            this.updateExtraMapEditorControls();
            return;
        }

        if (this.extraMapEditorSession.difficultyOpen) {
            this.updateExtraMapEditorDifficultyModal();
            return;
        }

        if (this.input.giveUp) {
            this.giveUpTimer++;
            if (this.giveUpTimer >= this.giveUpMax) {
                this.discardExtraMapEdit();
            }
            return;
        } else {
            this.giveUpTimer = 0;
        }

        this.editor.updateCursor(this.input);
        this.updateExtraMapEditorDirectPlacement();

        if (this.input.isJustPressed('smartLeft')) this.moveExtraMapEditorFunction(-1);
        if (this.input.isJustPressed('smartRight')) this.moveExtraMapEditorFunction(1);
        if (this.input.isJustPressed('confirm')) this.executeExtraMapEditorFunction();
    }

    updateExtraMapEditorControls() {
        const speed = 16;
        if (this.input.isPressed('down')) {
            this.extraMapEditorSession.controlsScroll += speed;
        }
        if (this.input.isPressed('up')) {
            this.extraMapEditorSession.controlsScroll -= speed;
        }
        this.extraMapEditorSession.controlsScroll = Math.max(
            0,
            Math.min(this.extraMapEditorSession.controlsScroll, this.getExtraMapEditorControlsScrollMax())
        );
        if (this.input.isJustPressed('cancel')) {
            this.closeExtraMapEditorControls();
        }
    }

    updateExtraMapEditorDifficultyModal() {
        const maxDifficulty = this.getMaxExtraMapDifficulty();
        if (this.input.isJustPressed('left')) {
            this.extraMapEditorSession.difficulty = Math.max(
                1,
                this.extraMapEditorSession.difficulty - 1
            );
        }
        if (this.input.isJustPressed('right')) {
            this.extraMapEditorSession.difficulty = Math.min(
                maxDifficulty,
                this.extraMapEditorSession.difficulty + 1
            );
        }
        if (this.input.isJustPressed('cancel')) {
            this.closeExtraMapEditorDifficultyModal();
        }
    }

    updateExtraMapEditorDirectPlacement() {
        for (let i = 0; i <= 7; i++) {
            if (this.input.keys[`Digit${i}`]) {
                this.selectExtraMapEditorTile(i);
                this.editor.placeTile(i);
            }
        }
    }

    getExtraMapEditorFunctions() {
        return EXTRA_MAP_EDITOR_FUNCTIONS;
    }

    getEditorTileName(tileId) {
        return this.t(EDITOR_TILE_NAME_PATHS[tileId] ?? EDITOR_TILE_NAME_PATHS[0]);
    }

    getExtraMapEditorFunctionBarItems() {
        return [
            {
                id: 'controls',
                label: this.t('extraMap.actions.help')
            },
            {
                id: 'terrain',
                label: `${this.editor.selectedTile}: ${this.getEditorTileName(this.editor.selectedTile)}`,
                labelCandidates: EDITOR_TILE_NAME_PATHS.map((_, tile) => `${tile}: ${this.getEditorTileName(tile)}`)
            },
            {
                id: 'difficulty',
                label: this.t('extraMap.actions.difficultyShort')
            },
            {
                id: 'save',
                label: this.t('extraMap.actions.saveShort')
            }
        ];
    }

    getExtraMapEditorFunction() {
        if (!this.isEditingExtraMap()) return null;
        return EXTRA_MAP_EDITOR_FUNCTIONS[this.extraMapEditorSession.functionCursor] ?? null;
    }

    moveExtraMapEditorFunction(delta) {
        if (!this.isEditingExtraMap()) return;
        const count = EXTRA_MAP_EDITOR_FUNCTIONS.length;
        this.extraMapEditorSession.functionCursor = (this.extraMapEditorSession.functionCursor + delta + count) % count;
        const current = this.getExtraMapEditorFunction();
        if (current?.id === 'tile') this.editor.selectedTile = current.tile;
    }

    selectExtraMapEditorTile(tile) {
        if (!this.isEditingExtraMap()) return;
        const index = EXTRA_MAP_EDITOR_FUNCTIONS.findIndex(item => item.id === 'tile' && item.tile === tile);
        if (index >= 0) this.extraMapEditorSession.functionCursor = index;
        this.editor.selectedTile = tile;
    }

    selectExtraMapEditorFunctionById(id) {
        if (!this.isEditingExtraMap()) return;
        const index = EXTRA_MAP_EDITOR_FUNCTIONS.findIndex(item => item.id === id);
        if (index >= 0) this.extraMapEditorSession.functionCursor = index;
    }

    getExtraMapEditorFunctionBarId() {
        const current = this.getExtraMapEditorFunction();
        if (!current) return null;
        return current.id === 'tile' ? 'terrain' : current.id;
    }

    selectExtraMapEditorFunctionBarItem(id) {
        if (!this.isEditingExtraMap()) return;
        if (id === 'terrain') {
            this.selectExtraMapEditorTile(this.editor.selectedTile);
            return;
        }
        this.selectExtraMapEditorFunctionById(id);
    }

    tapExtraMapEditorCell(x, y) {
        if (!this.isEditingExtraMap()) return;
        if (x < 0 || x >= this.level.cols || y < 0 || y >= this.level.rows) return;

        if (this.editor.cx !== x || this.editor.cy !== y) {
            this.editor.cx = x;
            this.editor.cy = y;
            return;
        }

        if (this.getExtraMapEditorFunctionBarId() === 'terrain') {
            this.executeExtraMapEditorFunction();
        }
    }

    executeExtraMapEditorFunction(index = this.extraMapEditorSession?.functionCursor ?? 0) {
        const item = EXTRA_MAP_EDITOR_FUNCTIONS[index];
        if (!item || !this.isEditingExtraMap()) return;
        this.extraMapEditorSession.functionCursor = index;

        if (item.id === 'tile') {
            this.editor.selectedTile = item.tile;
            this.editor.placeTile(item.tile);
            return;
        }
        if (item.id === 'controls') {
            this.openExtraMapEditorControls();
            return;
        }
        if (item.id === 'difficulty') {
            this.openExtraMapEditorDifficultyModal();
            return;
        }
        if (item.id === 'save') {
            this.saveExtraMapEdit();
        }
    }

    openExtraMapEditorControls() {
        if (!this.isEditingExtraMap()) return;
        this.extraMapEditorSession.controlsOpen = true;
        this.extraMapEditorSession.controlsScroll = 0;
    }

    closeExtraMapEditorControls() {
        if (!this.isEditingExtraMap()) return;
        this.extraMapEditorSession.controlsOpen = false;
    }

    openExtraMapEditorDifficultyModal() {
        if (!this.isEditingExtraMap()) return;
        this.extraMapEditorSession.difficultyOpen = true;
        this.extraMapEditorSession.difficultyCursor = 0;
    }

    closeExtraMapEditorDifficultyModal() {
        if (!this.isEditingExtraMap()) return;
        this.extraMapEditorSession.difficultyOpen = false;
    }

    getExtraMapEditorControlsScrollMax() {
        return EXTRA_MAP_EDITOR_CONTROLS_SCROLL_MAX;
    }

    saveExtraMapEdit() {
        if (!this.isEditingExtraMap()) return;

        const { slotIndex, originalStage, difficulty } = this.extraMapEditorSession;
        const heldMap = this.extraMaps[slotIndex];
        if (!heldMap) {
            this.discardExtraMapEdit();
            return;
        }

        const editedStage = cloneStageData(this.level.data);
        const stageChanged = !areStagesEqual(originalStage, editedStage);
        this.extraMaps[slotIndex] = {
            ...heldMap,
            stage: editedStage,
            difficulty,
            cleared: stageChanged ? false : heldMap.cleared
        };
        this.dataStore.saveExtraMaps({ maps: this.extraMaps });
        this.extraMapEditorSession = null;
        this.giveUpTimer = 0;
        this.state = 'EXTRA_MAP';
    }

    discardExtraMapEdit() {
        if (!this.isEditingExtraMap()) return;

        const { slotIndex, originalStage, removeOnDiscard } = this.extraMapEditorSession;
        if (removeOnDiscard) {
            const result = clearHeldMapSlot(this.extraMaps, slotIndex);
            this.extraMaps = result.maps;
            this.extraMapCursor = slotIndex;
            this.dataStore.saveExtraMaps({ maps: this.extraMaps });
        } else {
            this.level.data = cloneStageData(originalStage);
        }
        this.extraMapEditorSession = null;
        this.giveUpTimer = 0;
        this.state = 'EXTRA_MAP';
    }

    isEditingExtraMap() {
        return this.extraMapEditorSession !== null;
    }

    updateSettings() {
        if (this.input.isJustPressed('down')) {
            this.settingsCursor = (this.settingsCursor + 1) % SETTINGS_ITEM_COUNT;
            if (this.padType === 0 && (this.settingsCursor === 2 || this.settingsCursor === 3)) {
                // Guard: Ignore PAD POS/SIZE if padType is NONE
                this.settingsCursor = 4; // Skip to SCREEN SIZE
            }
        }
        if (this.input.isJustPressed('up')) {
            this.settingsCursor = (this.settingsCursor + SETTINGS_ITEM_COUNT - 1) % SETTINGS_ITEM_COUNT;
            if (this.padType === 0 && (this.settingsCursor === 2 || this.settingsCursor === 3)) {
                this.settingsCursor = 1; // Skip back to PAD TYPE
            }
        }

        // Drag Handle Visibility only for PAD POS
        const showHandle = (this.settingsCursor === 2);
        document.querySelectorAll('.drag-handle').forEach(h => {
            if (showHandle) h.classList.add('visible');
            else h.classList.remove('visible');
        });

        // Adjustment (Left/Right)
        const left = this.input.isJustPressed('left');
        const right = this.input.isJustPressed('right');

        // Fast adjust hold
        const holdLeft = this.input.isPressed('left');
        const holdRight = this.input.isPressed('right');

        if (this.settingsCursor === 0) {
            // SPEED
            if (left) {
                this.targetFPS = Math.max(SETTINGS_FPS_MIN, this.targetFPS - 5);
                this.deltaTime = 1000 / this.targetFPS;
                this.saveSettings();
            }
            if (right) {
                this.targetFPS = Math.min(SETTINGS_FPS_MAX, this.targetFPS + 5);
                this.deltaTime = 1000 / this.targetFPS;
                this.saveSettings();
            }
        } else if (this.settingsCursor === 1) {
            // PAD TYPE (0: None, 1: Single, 2: Dual)
            if (left) {
                this.padType = (this.padType + 2) % 3;
                this.updatePadLayout();
                this.saveSettings();
            }
            if (right) {
                this.padType = (this.padType + 1) % 3;
                this.updatePadLayout();
                this.saveSettings();
            }
        } else if (this.settingsCursor === 2) {
            // PAD POS (Drag Only)
            // Drag behavior is handled in main.js (mousedown/touchstart on .drag-handle)
        } else if (this.settingsCursor === 3) {
            // PAD SIZE
            if (holdLeft) this.padSize = Math.max(50, this.padSize - 1);
            if (holdRight) this.padSize = Math.min(150, this.padSize + 1);
            if (holdLeft || holdRight) {
                this.updatePadLayout();
                this.saveSettings();
            }
        } else if (this.settingsCursor === 4) {
            // SCREEN SIZE
            if (holdLeft) this.tempScreenSize = Math.max(50, this.tempScreenSize - 1);
            if (holdRight) this.tempScreenSize = Math.min(100, this.tempScreenSize + 1);
            if (!this.input.isPointerDown && !this.input.keys.ArrowLeft && !this.input.keys.ArrowRight && !this.input.keys.a && !this.input.keys.d && this.screenSize !== this.tempScreenSize) {
                // Apply on release (Keyboard or PointerUp)
                this.screenSize = this.tempScreenSize;
                window.dispatchEvent(new Event('resize'));
                this.saveSettings();
            }
        } else if (this.settingsCursor === 5) {
            // LANGUAGE
            if (left) this.changeLanguage(-1);
            if (right) this.changeLanguage(1);
        }

        // Close settings with the cancel key. Settings changes are applied immediately.
        if (this.input.isJustPressed('cancel')) {
            document.querySelectorAll('.drag-handle').forEach(h => h.classList.remove('visible'));
            this.state = this.settingsReturnState;
        }
    }

    getSelectStageActionItems() {
        return [
            {
                id: 'play',
                label: this.t('extraMap.actions.play'),
                enabled: this.isStageSelectable(this.selectCursor)
            },
            {
                id: 'settings',
                label: this.t('settings.title'),
                enabled: true
            }
        ];
    }

    executeSelectStageAction(actionIndex = this.selectStageFunctionCursor) {
        const item = this.getSelectStageActionItems()[actionIndex];
        if (!item) return;
        this.selectStageFunctionCursor = actionIndex;
        if (!item.enabled) return;

        if (item.id === 'play') {
            this.loadStage(this.selectCursor);
            this.state = 'WAIT_START';
            this.stateTimer = 1.0;
            return;
        }

        if (item.id === 'settings') {
            this.settingsReturnState = 'SELECT';
            this.settingsCursor = 0;
            this.state = 'SETTINGS';
        }
    }

    updateHowToPlay() {
        // Exit to Title with the cancel key.
        if (this.input.isJustPressed('cancel')) {
            this.state = 'TITLE';
        }

        // Scrolling (Keyboard)
        const speed = 15;
        if (this.input.isPressed('down')) {
            this.howToPlayScroll += speed;
        }
        if (this.input.isPressed('up')) {
            this.howToPlayScroll -= speed;
        }

        // Max scroll content: Content height varies by language.
        this.howToPlayScroll = Math.max(0, Math.min(this.howToPlayScroll, this.getHowToPlayScrollMax()));
    }

    getHowToPlayScrollMax() {
        return HOW_TO_PLAY_SCROLL_MAX;
    }

    updateSelect() {
        // Exit to Title (Long Press)
        if (this.input.giveUp) {
            this.selectExitTimer++;
            if (this.selectExitTimer >= this.giveUpMax) {
                this.state = 'TITLE';
                this.selectExitTimer = 0;
                return;
            }
        } else {
            this.selectExitTimer = 0;
        }

        const left = this.input.isJustPressed('left');
        const right = this.input.isJustPressed('right');
        const up = this.input.isJustPressed('up');
        const down = this.input.isJustPressed('down');

        if (right) this.selectCursor = (this.selectCursor + 1) % NORMAL_STAGE_COUNT;
        if (left) this.selectCursor = (this.selectCursor + NORMAL_STAGE_COUNT - 1) % NORMAL_STAGE_COUNT;
        if (down) this.selectCursor = (this.selectCursor + 10) % NORMAL_STAGE_COUNT;
        if (up) this.selectCursor = (this.selectCursor + NORMAL_STAGE_COUNT - 10) % NORMAL_STAGE_COUNT;

        const items = this.getSelectStageActionItems();
        if (this.input.isJustPressed('smartRight')) {
            this.selectStageFunctionCursor = (this.selectStageFunctionCursor + 1) % items.length;
        }
        if (this.input.isJustPressed('smartLeft')) {
            this.selectStageFunctionCursor = (this.selectStageFunctionCursor + items.length - 1) % items.length;
        }

        if (this.input.isJustPressed('confirm')) {
            this.executeSelectStageAction();
        }
    }

    updatePlay() {
        if (this.input.isPointerDown) {
            // Grid-based movement: compare pointer tile with player tile
            // Each tile is 40px (which is 4 internal units). Header is 80px.
            const pointerGridX = Math.floor(this.input.pointerX / 40);
            const pointerGridY = Math.floor((this.input.pointerY - 80) / 40);
            const playerGridX = Math.floor(this.player.x / 4);
            const playerGridY = Math.floor(this.player.y / 4);

            const dgX = pointerGridX - playerGridX;
            const dgY = pointerGridY - playerGridY;

            let ps = 0; // Pointer Stick

            if (dgY < 0) {
                // Taping UP grid: Jump
                if (dgX < 0) ps = 7;      // Up-Left
                else if (dgX > 0) ps = 9; // Up-Right
                else ps = 8;               // Straight Up
            } else if (dgY > 0) {
                // Taping DOWN grid (or same Y but diag)
                if (dgX < 0) ps = 4;      // Just use Left for Down-Left
                else if (dgX > 0) ps = 6; // Just use Right for Down-Right
                else ps = 2;               // Straight Down (Dig)
            } else {
                // Same vertical grid
                if (dgX < 0) ps = 4;
                else if (dgX > 0) ps = 6;
                else ps = 0; // Center: Neutral
            }

            if (ps !== 0) {
                this.input.stick = ps;
                // Jump if upward direction
                if (ps === 7 || ps === 8 || ps === 9) this.input.jump = true;
            } else {
                this.input.stick = 0;
            }
        }

        this.physics.update(this.player, this.level, this.input, this);
        if (this.ES > 0) this.ES--;
        if (this.ES === 1) this.level.applyEarthquake();

        // Long Press Give Up (Retire)
        if (this.input.giveUp) {
            this.giveUpTimer++;
            if (this.giveUpTimer >= this.giveUpMax) {
                this.handleGameOver();
                this.giveUpTimer = 0;
            }
        } else {
            this.giveUpTimer = 0;
        }
    }

    render() {
        this.renderer.render(this.level, this.player, this.editor, this.state, this.ES, this);
    }

    changeLanguage(direction) {
        const current = getActiveLanguage();
        const currentIndex = Math.max(0, this.supportedLanguages.indexOf(current));
        const nextIndex = (currentIndex + direction + this.supportedLanguages.length) % this.supportedLanguages.length;
        setLanguage(this.supportedLanguages[nextIndex]);
        this.language = getActiveLanguage();
    }

    getLanguageLabel(language = getActiveLanguage()) {
        return t(`common.languageNames.${language}`);
    }

    t(path, params = {}) {
        return t(path, params);
    }

    tr(path, params = {}) {
        return tr(path, params);
    }

    handleGameOver() {
        if (this.isPlayingExtraMap()) {
            this.state = 'MISS';
            this.state = 'WAIT_MISS';
            this.stateTimer = 1.0;
            this.running = true;
            return;
        }

        this.lives--;
        if (this.lives > 0) {
            this.state = 'MISS';
            this.state = 'WAIT_MISS';
            this.stateTimer = 1.0;
        } else {
            this.state = 'GAME_OVER';
            this.state = 'WAIT_GAMEOVER';
            this.stateTimer = 3.0; // 3 Seconds
        }
        this.running = true;
    }

    handleLevelClear() {
        if (this.isPlayingExtraMap()) {
            this.markExtraMapCleared();
            this.state = 'CLEAR';
            this.state = 'WAIT_CLEAR';
            this.stateTimer = 1.0;
            this.running = true;
            return;
        }

        this.state = 'CLEAR';
        this.currentGameClearedStages[this.stage] = true;
        this.stageClearHistory[this.stage] = true;
        this.dataStore.saveStageProgress({ clearedStages: this.stageClearHistory });
        if (this.lives < this.maxLives) this.lives++;
        this.state = 'WAIT_CLEAR';
        this.stateTimer = 1.0;
        this.running = true;
    }

    getSelectableStageCount() {
        return this.getSelectableStageIndices().length;
    }

    getSelectableStageIndices() {
        const unlockedCount = getUnlockedStageCount(this.stageClearHistory);
        return Array.from({ length: unlockedCount }, (_, index) => index)
            .filter((stageIndex) => !this.isStageClearedInCurrentGame(stageIndex));
    }

    getUnlockedStageCount() {
        return getUnlockedStageCount(this.stageClearHistory);
    }

    getMaxExtraMapDifficulty() {
        const clearedStageCount = this.stageClearHistory.filter(Boolean).length;
        return Math.min(5, Math.max(1, Math.floor(clearedStageCount / 10)));
    }

    isExtraMapEditUnlocked() {
        return this.stageClearHistory.filter(Boolean).length >= 10;
    }

    canOpenExtraMap() {
        return this.isExtraMapEditUnlocked() || this.extraMaps.some(Boolean);
    }

    isStageSelectable(stageIndex) {
        return this.isStageUnlocked(stageIndex) && !this.isStageClearedInCurrentGame(stageIndex);
    }

    isStageUnlocked(stageIndex) {
        return isStageUnlocked(stageIndex, this.stageClearHistory);
    }

    isStageClearedBefore(stageIndex) {
        return this.stageClearHistory[stageIndex] === true;
    }

    isStageClearedInCurrentGame(stageIndex) {
        return this.currentGameClearedStages[stageIndex] === true;
    }

    getNormalStageDifficulty(stageIndex) {
        return getNormalStageDifficulty(stageIndex);
    }

    isPlayingExtraMap() {
        return this.extraMapPlaySession !== null;
    }

    markExtraMapCleared() {
        if (!this.isPlayingExtraMap()) return;
        const slotIndex = this.extraMapPlaySession.slotIndex;
        const heldMap = this.extraMaps[slotIndex];
        if (!heldMap) return;

        this.extraMaps[slotIndex] = {
            ...heldMap,
            cleared: true
        };
        this.dataStore.saveExtraMaps({ maps: this.extraMaps });
    }

    endExtraMapPlay() {
        this.extraMapPlaySession = null;
        this.giveUpTimer = 0;
        this.state = 'EXTRA_MAP';
    }

    loadSettings() {
        const s = this.dataStore.loadSettings(this.createSettingsSnapshot());
        if (s.padType !== undefined) this.padType = s.padType;
        if (s.padPosX !== undefined) this.padPosX = s.padPosX;
        if (s.padPosY !== undefined) this.padPosY = s.padPosY;
        if (s.padSize !== undefined) this.padSize = Number(s.padSize) || 100;
        if (s.screenSize !== undefined) {
            this.screenSize = Number(s.screenSize) || 100;
            this.tempScreenSize = this.screenSize;
        }
        if (s.targetFPS !== undefined) {
            this.targetFPS = Number(s.targetFPS) || 45;
            this.deltaTime = 1000 / this.targetFPS;
        }
    }

    createSettingsSnapshot() {
        return {
            padType: this.padType,
            padPosX: this.padPosX,
            padPosY: this.padPosY,
            padSize: this.padSize,
            screenSize: this.screenSize,
            targetFPS: this.targetFPS
        };
    }

    saveSettings() {
        this.dataStore.saveSettings(this.createSettingsSnapshot());
    }
}

function cloneStageData(stage) {
    return stage.map((row) => [...row]);
}

function areStagesEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((row, y) => (
        Array.isArray(row) &&
        Array.isArray(b[y]) &&
        row.length === b[y].length &&
        row.every((tile, x) => tile === b[y][x])
    ));
}

function getSharedMapQueryValue(locationRef) {
    if (!locationRef?.search) return null;
    return new URLSearchParams(locationRef.search).get('map');
}
