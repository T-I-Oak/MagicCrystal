import { describe, expect, it, vi } from 'vitest';
import {
    createExtraMapShareImageBlob,
    createExtraMapShareImagePayload,
    createCongratulationsShareImagePayload,
    paintCongratulationsShareImage,
    paintExtraMapShareImage,
    CONGRATULATIONS_SHARE_IMAGE_HEIGHT,
    CONGRATULATIONS_SHARE_IMAGE_WIDTH,
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
        save: vi.fn(),
        restore: vi.fn(),
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

    it('overlays each non-empty stage tile on open ground', () => {
        const context = createMockContext();
        const logo = { width: 800, height: 220 };
        const player = { width: 40, height: 40 };
        const openGround = { id: 'open-ground' };
        const portal = { id: 'portal' };
        const rock = { id: 'rock' };
        const payload = createExtraMapShareImagePayload({
            stage: createStage(2),
            difficulty: 5,
            url: 'https://example.test/MagicCrystal/?map=test'
        });
        const assets = {
            logo,
            player: { standRight: player },
            getTile: vi.fn((tile) => {
                if (tile === 0) return openGround;
                if (tile === 2) return rock;
                if (tile === 3) return portal;
                return { id: `tile-${tile}` };
            })
        };

        paintExtraMapShareImage(context, payload, assets);

        expect(context.drawImage).toHaveBeenCalledWith(openGround, 144, 170, 38, 38);
        expect(context.drawImage).toHaveBeenCalledWith(portal, 144, 170, 38, 38);
        expect(context.drawImage).toHaveBeenCalledWith(openGround, 144 + 38, 170, 38, 38);
        expect(context.drawImage).toHaveBeenCalledWith(rock, 144 + 38, 170, 38, 38);

        const firstCellGroundCall = context.drawImage.mock.invocationCallOrder[
            context.drawImage.mock.calls.findIndex(call => call[0] === openGround && call[1] === 144 && call[2] === 170)
        ];
        const firstCellPortalCall = context.drawImage.mock.invocationCallOrder[
            context.drawImage.mock.calls.findIndex(call => call[0] === portal && call[1] === 144 && call[2] === 170)
        ];
        expect(firstCellGroundCall).toBeLessThan(firstCellPortalCall);
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

describe('congratulations share image', () => {
    it('creates a payload with display date and copyright metadata', () => {
        const payload = createCongratulationsShareImagePayload({
            date: new Date(Date.UTC(2026, 7, 13))
        });

        expect(payload).toEqual({
            title: SHARE_IMAGE_TITLE,
            dateText: 'Aug. 13, 2026',
            copyrightText: '© T.I.OAK 2026 | GameWorks OAK'
        });
    });

    it('paints the clear image, date, and copyright', () => {
        const calls = [];
        const context = createMockContext();
        context.canvas = {
            width: CONGRATULATIONS_SHARE_IMAGE_WIDTH,
            height: CONGRATULATIONS_SHARE_IMAGE_HEIGHT
        };
        context.strokeText = vi.fn((text, x, y) => calls.push({ type: 'stroke', text, x, y }));
        context.fillText = vi.fn((text, x, y) => calls.push({ type: 'fill', text, x, y }));
        const clear = { width: 1200, height: 846 };
        const payload = createCongratulationsShareImagePayload({
            date: new Date(Date.UTC(2026, 7, 13))
        });

        paintCongratulationsShareImage(context, payload, { clear });

        expect(context.drawImage).toHaveBeenCalledWith(clear, 0, 0, 1200, 846);
        expect(calls).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'stroke', text: 'Aug. 13, 2026' }),
            expect.objectContaining({ type: 'fill', text: 'Aug. 13, 2026' }),
            expect.objectContaining({ type: 'fill', text: payload.copyrightText })
        ]));
        expect(calls.find(call => call.text === payload.copyrightText).y).toBeGreaterThan(860);
    });

    it('requires the clear image', () => {
        const context = createMockContext();
        context.canvas = {
            width: CONGRATULATIONS_SHARE_IMAGE_WIDTH,
            height: CONGRATULATIONS_SHARE_IMAGE_HEIGHT
        };

        expect(() => paintCongratulationsShareImage(
            context,
            createCongratulationsShareImagePayload({ date: new Date(Date.UTC(2026, 7, 13)) })
        )).toThrow('clear image is required');
    });
});
