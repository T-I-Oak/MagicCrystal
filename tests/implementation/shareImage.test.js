import { describe, expect, it, vi } from 'vitest';
import {
    createExtraMapShareImageBlob,
    createExtraMapShareImagePayload,
    paintExtraMapShareImage,
    SHARE_IMAGE_HEIGHT,
    SHARE_IMAGE_TITLE,
    SHARE_IMAGE_WIDTH
} from '../../src/shareImage.js';

function createStage(tile = 0) {
    const stage = Array.from({ length: 13 }, () => Array.from({ length: 24 }, () => tile));
    stage[0][0] = 3;
    return stage;
}

function createMockContext() {
    const calls = [];
    const context = {
        canvas: { width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT },
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: '',
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn((text, x, y) => calls.push({ text, x, y })),
        drawImage: vi.fn()
    };
    context.textCalls = calls;
    return context;
}

describe('extra map share image', () => {
    it('creates a share image payload with copyright metadata', () => {
        const stage = createStage(1);
        const payload = createExtraMapShareImagePayload({
            stage,
            difficulty: 4,
            url: 'https://example.test/MagicCrystal/?map=test'
        });

        expect(payload).toMatchObject({
            title: SHARE_IMAGE_TITLE,
            difficulty: 4,
            url: 'https://example.test/MagicCrystal/?map=test',
            copyrightText: '© T.I.OAK 2026 | GameWorks OAK'
        });
        expect(payload.stage).toBe(stage);
    });

    it('paints logo, player, copyright, and all stage tiles without drawing difficulty or url', () => {
        const context = createMockContext();
        const logo = { width: 800, height: 220 };
        const player = { width: 40, height: 40 };
        const payload = createExtraMapShareImagePayload({
            stage: createStage(2),
            difficulty: 5,
            url: 'https://example.test/MagicCrystal/?map=test'
        });

        paintExtraMapShareImage(context, payload, { logo, player: { standRight: player } });

        expect(context.drawImage).toHaveBeenCalledWith(logo, expect.any(Number), expect.any(Number), 500, 137.5);
        expect(context.drawImage).toHaveBeenCalledWith(player, 139.25, 160.5, 47.5, 47.5);
        expect(context.textCalls.map(call => call.text)).not.toContain(SHARE_IMAGE_TITLE);
        expect(context.textCalls.map(call => call.text)).not.toContain('★★★★★');
        expect(context.textCalls.map(call => call.text)).not.toContain(payload.url);
        expect(context.textCalls.map(call => call.text)).toContain(payload.copyrightText);
        expect(context.textCalls.find(call => call.text === payload.copyrightText).y).toBeGreaterThan(682);
        expect(context.fillRect).toHaveBeenCalledWith(144, 170, 38, 38);
        expect(context.fillRect).toHaveBeenCalledWith(144 + 23 * 38, 170 + 12 * 38, 38, 38);
    });

    it('requires the logo image', () => {
        const context = createMockContext();
        const payload = createExtraMapShareImagePayload({
            stage: createStage(2),
            difficulty: 2,
            url: 'https://example.test/MagicCrystal/?map=test'
        });

        expect(() => paintExtraMapShareImage(context, payload)).toThrow('logo image is required');
    });

    it('requires the player image', () => {
        const context = createMockContext();
        const payload = createExtraMapShareImagePayload({
            stage: createStage(2),
            difficulty: 2,
            url: 'https://example.test/MagicCrystal/?map=test'
        });

        expect(() => paintExtraMapShareImage(context, payload, { logo: { width: 800, height: 220 } })).toThrow('player image is required');
    });

    it('requires exactly one portal in the stage', () => {
        const context = createMockContext();
        const stage = createStage(2);
        stage[0][0] = 0;
        const payload = createExtraMapShareImagePayload({
            stage,
            difficulty: 2,
            url: 'https://example.test/MagicCrystal/?map=test'
        });

        expect(() => paintExtraMapShareImage(context, payload, {
            logo: { width: 800, height: 220 },
            player: { standRight: { width: 40, height: 40 } }
        })).toThrow('stage must contain exactly one portal');
    });

    it('creates a PNG blob from a document canvas', async () => {
        const blob = { type: 'image/png' };
        const context = createMockContext();
        const canvas = {
            width: 0,
            height: 0,
            getContext: vi.fn(() => context),
            toBlob: vi.fn(callback => callback(blob))
        };
        const documentRef = {
            createElement: vi.fn(() => canvas)
        };

        await expect(createExtraMapShareImageBlob(
            createExtraMapShareImagePayload({
                stage: createStage(0),
                difficulty: 1,
                url: 'https://example.test/MagicCrystal/?map=test'
            }),
            { documentRef, assets: { logo: { width: 800, height: 220 }, player: { standRight: { width: 40, height: 40 } } } }
        )).resolves.toBe(blob);

        expect(canvas.width).toBe(SHARE_IMAGE_WIDTH);
        expect(canvas.height).toBe(SHARE_IMAGE_HEIGHT);
        expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    });
});
