import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearL10nCache, getActiveLanguage, setLanguage, setupLanguageSelector } from '../../../GameWorksOAK/src/lib/core/i18n.js';
import { Game } from '../../src/Game.js';
import { SUPPORTED_LANGUAGES, t } from '../../src/i18nText.js';

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

    it('falls back to English when the shared language is unsupported by this app', () => {
        setLanguage('zh');

        expect(getActiveLanguage()).toBe('en');
        expect(t('common.languageNames.en')).toBe('English');
    });
});
