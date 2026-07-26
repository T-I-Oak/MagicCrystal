import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../src/Game.js';

describe('Game Class', () => {
    let mockCanvas;
    let mockAssets;

    beforeEach(() => {
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
        expect(game.version).toBe(__APP_VERSION__);
        expect(game.state).toBe('TITLE');
    });

    it('should have 3 lives initially', () => {
        const game = new Game(mockCanvas, mockAssets);
        expect(game.lives).toBe(3);
    });
});
