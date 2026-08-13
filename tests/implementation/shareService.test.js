import { describe, expect, it, vi } from 'vitest';
import {
    createCongratulationsShareText,
    createExtraMapShareText,
    EXTRA_MAP_SHARE_FILE_NAME,
    shareExtraMapImage
} from '../../src/shareService.js';

describe('extra map share service', () => {
    it('creates share text with the game title, prompt, url, and hashtags', () => {
        expect(createExtraMapShareText(
            'https://example.test/MagicCrystal/?map=test',
            '自作ステージに挑戦してみて！',
            2,
            '難易度'
        )).toBe(
            '【MAGIC CRYSTAL】\n自作ステージに挑戦してみて！\n難易度: ★★\nhttps://example.test/MagicCrystal/?map=test\n#MagicCrystal #GameWorksOAK'
        );
        expect(createExtraMapShareText(
            'https://example.test/MagicCrystal/?map=test',
            'Play my custom stage!',
            2,
            'Difficulty'
        )).toBe(
            '【MAGIC CRYSTAL】\nPlay my custom stage!\nDifficulty: ★★\nhttps://example.test/MagicCrystal/?map=test\n#MagicCrystal #GameWorksOAK'
        );
    });

    it('creates congratulations share text with the game url', () => {
        expect(createCongratulationsShareText(
            'https://example.test/MagicCrystal/',
            'Magic Crystal の全50ステージをクリアーしました！'
        )).toBe(
            '【MAGIC CRYSTAL】\nMagic Crystal の全50ステージをクリアーしました！\nhttps://example.test/MagicCrystal/\n#MagicCrystal #GameWorksOAK'
        );
    });

    it('copies the image to clipboard and shows the X confirm flow on desktop', async () => {
        const blob = { type: 'image/png' };
        const ClipboardItemCtor = vi.fn(function ClipboardItem(value) {
            this.value = value;
        });
        const navigatorRef = {
            userAgent: 'Windows',
            clipboard: { write: vi.fn().mockResolvedValue(undefined) }
        };
        const windowRef = { open: vi.fn() };
        document.body.innerHTML = `
            <div id="share-confirm-overlay" class="state-hidden" hidden>
                <h2 id="share-confirm-title"></h2>
                <p id="share-confirm-message"></p>
                <button id="share-confirm-x-btn"></button>
                <button id="share-confirm-close-btn"></button>
            </div>
        `;

        await expect(shareExtraMapImage({
            blob,
            text: 'share text',
            navigatorRef,
            windowRef,
            documentRef: document,
            ClipboardItemCtor,
            FileCtor: null,
            confirmLabels: {
                title: 'マップ共有',
                lines: ['マップ画像をコピーしました。', 'X を開きますか？'],
                openX: 'X を開く',
                close: '閉じる'
            }
        })).resolves.toEqual({ mode: 'clipboard-confirm' });

        expect(ClipboardItemCtor).toHaveBeenCalledWith({ 'image/png': blob });
        expect(navigatorRef.clipboard.write).toHaveBeenCalledWith([expect.objectContaining({
            value: { 'image/png': blob }
        })]);
        const overlay = document.querySelector('#share-confirm-overlay');
        expect(overlay.hidden).toBe(false);
        expect(overlay.classList.contains('state-hidden')).toBe(false);
        expect(document.querySelector('#share-confirm-title').textContent).toBe('マップ共有');
        expect(document.querySelector('#share-confirm-message').textContent).toBe('マップ画像をコピーしました。\nX を開きますか？');
        expect(document.querySelector('#share-confirm-x-btn .share-key-face').textContent).toBe('A');
        expect(document.querySelector('#share-confirm-x-btn .share-button-label').textContent).toBe('X を開く');
        expect(document.querySelector('#share-confirm-close-btn .share-key-face').textContent).toBe('B');
        expect(document.querySelector('#share-confirm-close-btn .share-button-label').textContent).toBe('閉じる');
        expect(windowRef.open).not.toHaveBeenCalled();

        document.querySelector('#share-confirm-x-btn').click();
        expect(windowRef.open).toHaveBeenCalledWith(
            'https://twitter.com/intent/tweet?text=share%20text',
            '_blank'
        );
        expect(overlay.hidden).toBe(true);
        expect(overlay.classList.contains('state-hidden')).toBe(true);
    });

    it('supports keyboard confirm and cancel on the desktop X confirm flow', async () => {
        const blob = { type: 'image/png' };
        const ClipboardItemCtor = vi.fn(function ClipboardItem(value) {
            this.value = value;
        });
        const navigatorRef = {
            userAgent: 'Windows',
            clipboard: { write: vi.fn().mockResolvedValue(undefined) }
        };
        const windowRef = { open: vi.fn() };
        document.body.innerHTML = `
            <div id="share-confirm-overlay" class="state-hidden" hidden>
                <h2 id="share-confirm-title"></h2>
                <p id="share-confirm-message"></p>
                <button id="share-confirm-x-btn"></button>
                <button id="share-confirm-close-btn"></button>
            </div>
        `;

        await shareExtraMapImage({
            blob,
            text: 'share text',
            navigatorRef,
            windowRef,
            documentRef: document,
            ClipboardItemCtor,
            FileCtor: null
        });

        const overlay = document.querySelector('#share-confirm-overlay');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));

        expect(windowRef.open).toHaveBeenCalledWith(
            'https://twitter.com/intent/tweet?text=share%20text',
            '_blank'
        );
        expect(overlay.hidden).toBe(true);

        windowRef.open.mockClear();
        await shareExtraMapImage({
            blob,
            text: 'share text',
            navigatorRef,
            windowRef,
            documentRef: document,
            ClipboardItemCtor,
            FileCtor: null
        });

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX' }));

        expect(windowRef.open).not.toHaveBeenCalled();
        expect(overlay.hidden).toBe(true);
    });

    it('does not let game control keys leak through the desktop X confirm flow', async () => {
        const blob = { type: 'image/png' };
        const ClipboardItemCtor = vi.fn(function ClipboardItem(value) {
            this.value = value;
        });
        const navigatorRef = {
            userAgent: 'Windows',
            clipboard: { write: vi.fn().mockResolvedValue(undefined) }
        };
        const windowRef = { open: vi.fn() };
        const leakedKeydown = vi.fn();
        document.body.innerHTML = `
            <div id="share-confirm-overlay" class="state-hidden" hidden>
                <h2 id="share-confirm-title"></h2>
                <p id="share-confirm-message"></p>
                <button id="share-confirm-x-btn"></button>
                <button id="share-confirm-close-btn"></button>
            </div>
        `;
        window.addEventListener('keydown', leakedKeydown);

        await shareExtraMapImage({
            blob,
            text: 'share text',
            navigatorRef,
            windowRef,
            documentRef: document,
            ClipboardItemCtor,
            FileCtor: null
        });

        const arrowEvent = new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            code: 'ArrowRight',
            bubbles: true,
            cancelable: true
        });
        document.querySelector('#share-confirm-overlay').dispatchEvent(arrowEvent);

        expect(arrowEvent.defaultPrevented).toBe(true);
        expect(leakedKeydown).not.toHaveBeenCalled();

        const cancelEvent = new KeyboardEvent('keydown', {
            key: 'x',
            code: 'KeyX',
            bubbles: true,
            cancelable: true
        });
        document.querySelector('#share-confirm-overlay').dispatchEvent(cancelEvent);

        expect(cancelEvent.defaultPrevented).toBe(true);
        expect(leakedKeydown).not.toHaveBeenCalled();
        expect(document.querySelector('#share-confirm-overlay').hidden).toBe(true);

        window.removeEventListener('keydown', leakedKeydown);
    });

    it('requires the desktop confirmation UI after copying the image', async () => {
        const ClipboardItemCtor = vi.fn(function ClipboardItem(value) {
            this.value = value;
        });
        const navigatorRef = {
            userAgent: 'Windows',
            clipboard: { write: vi.fn().mockResolvedValue(undefined) }
        };
        const windowRef = { open: vi.fn() };
        document.body.innerHTML = '';

        await expect(shareExtraMapImage({
            blob: { type: 'image/png' },
            text: 'share text',
            navigatorRef,
            windowRef,
            documentRef: document,
            ClipboardItemCtor,
            FileCtor: null
        })).rejects.toThrow('share confirmation UI is required');

        expect(windowRef.open).not.toHaveBeenCalled();
    });

    it('uses file sharing on mobile when Web Share API supports files', async () => {
        const blob = { type: 'image/png' };
        const FileCtor = vi.fn(function File(parts, name, options) {
            this.parts = parts;
            this.name = name;
            this.options = options;
        });
        const navigatorRef = {
            userAgent: 'iPhone',
            canShare: vi.fn(() => true),
            share: vi.fn().mockResolvedValue(undefined)
        };

        await expect(shareExtraMapImage({
            blob,
            text: 'share text',
            navigatorRef,
            windowRef: { open: vi.fn() },
            FileCtor
        })).resolves.toEqual({ mode: 'file-share' });

        expect(FileCtor).toHaveBeenCalledWith([blob], EXTRA_MAP_SHARE_FILE_NAME, { type: 'image/png' });
        expect(navigatorRef.share).toHaveBeenCalledWith({
            files: [expect.objectContaining({
                parts: [blob],
                name: EXTRA_MAP_SHARE_FILE_NAME,
                options: { type: 'image/png' }
            })],
            title: 'Magic Crystal',
            text: 'share text'
        });
    });

    it('does not fall back when desktop clipboard image writing is unavailable', async () => {
        const windowRef = { open: vi.fn() };

        await expect(shareExtraMapImage({
            blob: { type: 'image/png' },
            text: 'share text',
            navigatorRef: { userAgent: 'Windows' },
            windowRef,
            ClipboardItemCtor: null,
            FileCtor: null
        })).rejects.toThrow('clipboard image writing is required');

        expect(windowRef.open).not.toHaveBeenCalled();
    });

    it('does not fall back when mobile file sharing is unavailable', async () => {
        const windowRef = { open: vi.fn() };

        await expect(shareExtraMapImage({
            blob: { type: 'image/png' },
            text: 'share text',
            navigatorRef: { userAgent: 'iPhone', canShare: vi.fn(() => false) },
            windowRef,
            FileCtor: vi.fn(function File(parts, name, options) {
                this.parts = parts;
                this.name = name;
                this.options = options;
            })
        })).rejects.toThrow('Web Share API file sharing is required');

        expect(windowRef.open).not.toHaveBeenCalled();
    });
});
