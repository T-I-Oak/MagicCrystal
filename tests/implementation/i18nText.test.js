import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearL10nCache, getActiveLanguage, setLanguage, setupLanguageSelector } from '../../../GameWorksOAK/src/lib/core/i18n.js';
import { Game } from '../../src/Game.js';
import { SUPPORTED_LANGUAGES, t, tr } from '../../src/i18nText.js';

function installLocalStorageMock() {
    const values = new Map();
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem: vi.fn(key => values.get(key) ?? null),
            setItem: vi.fn((key, value) => values.set(key, String(value))),
            removeItem: vi.fn(key => values.delete(key)),
            clear: vi.fn(() => values.clear())
        }
    });
}

function createMockGame() {
    const canvas = {
        getContext: () => ({}),
        width: 0,
        height: 0
    };
    const assets = {
        player: { life: {} },
        getTile: vi.fn()
    };

    return new Game(canvas, assets);
}

describe('MagicCrystal i18n', () => {
    beforeEach(() => {
        installLocalStorageMock();
        localStorage.clear();
        clearL10nCache();
        document.body.innerHTML = '<select id="language-selector"></select>';
        setupLanguageSelector('#language-selector', SUPPORTED_LANGUAGES);
        global.document.querySelectorAll = vi.fn().mockReturnValue([]);
    });

    it('uses Japanese as the initial active language', () => {
        expect(getActiveLanguage()).toBe('ja');
        expect(t('common.languageNames.ja')).toBe('日本語');
    });

    it('switches settings language through the shared i18n storage', () => {
        const game = createMockGame();

        game.changeLanguage(1);

        expect(getActiveLanguage()).toBe('en');
        expect(game.getLanguageLabel()).toBe('English');

        game.changeLanguage(1);

        expect(getActiveLanguage()).toBe('ja');
        expect(game.getLanguageLabel()).toBe('日本語');
    });

    it('expands HOW TO PLAY body text by language', () => {
        expect(t('howToPlay.prologue.title')).toBe('■ プロローグ');

        setLanguage('en');

        expect(t('howToPlay.prologue.title')).toBe('■ Prologue');
        expect(t('howToPlay.terrain.portal.name')).toBe('Portal');
    });

    it('provides editor terrain names from the terrain i18n resource', () => {
        expect(t('howToPlay.terrain.empty.name')).toBe('空き地');
        expect(t('howToPlay.terrain.soil.name')).toBe('土');
        expect(t('howToPlay.terrain.rockMemory.name')).toBe('岩の記憶');

        setLanguage('en');

        expect(t('howToPlay.terrain.empty.name')).toBe('Empty');
        expect(t('howToPlay.terrain.redCrystal.name')).toBe('Recall Ruby');
        expect(t('howToPlay.terrain.blueCrystal.name')).toBe('Stasis Sapphire');
        expect(t('howToPlay.terrain.soil.name')).toBe('Soil');
        expect(t('howToPlay.terrain.rockMemory.name')).toBe('Rock Memory');
        expect(t('title.menu.extraMap')).toBe('EXTRA MAP');
        expect(t('extraMap.actions.play')).toBe('PLAY');
        expect(t('extraMap.actions.edit')).toBe('EDIT');
        expect(t('extraMap.actions.create')).toBe('CREATE');
        expect(t('extraMap.actions.paste')).toBe('PASTE');
        expect(t('extraMap.actions.share')).toBe('SHARE');
        expect(t('extraMap.actions.delete')).toBe('DELETE');
        expect(t('extraMap.actions.controls')).toBe('HOW TO EDIT');
        expect(t('extraMap.actions.save')).toBe('SAVE & EXIT');
        expect(t('extraMap.actions.discard')).toBe('DISCARD & EXIT');
        expect(t('extraMap.actions.back')).toBe('BACK');
        expect(t('extraMap.actions.cancel')).toBe('CANCEL');
        expect(t('extraMap.notice.shareRequiresClear')).toBe('Clear the map before sharing');
        expect(t('extraMap.notice.shareFailed')).toBe('Sharing could not be started');
        expect(t('extraMap.notice.favoriteDeleteProtected')).toBe('Favorite maps cannot be deleted');
        expect(t('extraMap.shareConfirm.title')).toBe('SHARE MAP');
        expect(tr('extraMap.shareConfirm.lines')).toHaveLength(2);
        expect(t('extraMap.shareConfirm.openX')).toBe('OPEN X');
        expect(t('extraMap.shareConfirm.close')).toBe('CLOSE');
        expect(t('extraMap.shareTextPrompt')).toBe('Play my custom stage!');
        expect(t('extraMap.shareDifficultyLabel')).toBe('Difficulty');
        expect(t('extraMap.loadError.title')).toBe('MAP LOAD FAILED');
        expect(tr('extraMap.loadError.lines')).toHaveLength(2);
        expect(t('extraMap.loadError.close')).toBe('CLOSE');
        expect(t('extraMap.downloadFull.title')).toBe('MAP DOWNLOAD FAILED');
        expect(tr('extraMap.downloadFull.lines')).toHaveLength(2);
        expect(t('extraMap.downloadFull.close')).toBe('CLOSE');
        expect(t('extraMap.deleteConfirm.title')).toBe('DELETE MAP?');
        expect(tr('extraMap.deleteConfirm.lines')).toHaveLength(2);
        expect(t('extraMap.deleteConfirm.delete')).toBe('DELETE');
        expect(t('extraMap.deleteConfirm.cancel')).toBe('CANCEL');
        expect(t('extraMap.editor.title')).toBe('EDIT MENU');
        expect(t('extraMap.editor.menu')).toBe('MENU');
        expect(t('extraMap.editor.controls.title')).toBe('- HOW TO EDIT -');
        expect(t('extraMap.editor.controls.close')).toBe('CLOSE');
        expect(tr('extraMap.editor.controls.flowLines')).toHaveLength(4);
        expect(tr('extraMap.editor.controls.actions')).toHaveLength(5);
        expect(tr('extraMap.editor.controls.actions')[0][1]).toBe('◀ / ▶ / ▲ / ▼');
        expect(tr('extraMap.editor.controls.actions')[4][1]).toBe('0 / 1 / 2 / 3 / 4 / 5 / 6 / 7');
        expect(tr('howToPlay.controls.definitions')).toHaveLength(6);
        expect(tr('howToPlay.controls.headers')[1]).toBe('Soft Pad');
        expect(tr('howToPlay.controls.rows')[0]).toEqual(['Left key', '◀', 'A / ←', '4', 'D-pad / stick Left']);
        expect(t('play.extraStage', { number: 3 })).toBe('EXTRA STAGE 3');
        expect(t('play.back')).toBe('BACK');
        expect(t('play.retire')).toBe('RETIRE');
        expect(tr('extraMap.editor.difficultyDescriptions')).toHaveLength(5);
    });

    it('falls back to English when the shared language is unsupported by this app', () => {
        setLanguage('zh');

        expect(getActiveLanguage()).toBe('en');
        expect(t('common.languageNames.en')).toBe('English');
    });
});
