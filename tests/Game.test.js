import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../game/Game.js';

// Mock Canvas and document elements if needed
// In this case, we just test if the class can be instantiated and has correct version
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

        // Mock document globally for Game.js's updatePadLayout
        global.document = {
            getElementById: vi.fn().mockReturnValue(null),
            querySelectorAll: vi.fn().mockReturnValue([])
        };
    });

    it('should initialize with correct version from Vite define', () => {
        // Note: __APP_VERSION__ is usually defined by Vite during build/dev.
        // For Vitest, we might need to define it in vitest.config.js or globally here.
        global.__APP_VERSION__ = '0.1.0';
        
        const game = new Game(mockCanvas, mockAssets);
        expect(game.version).toBe('0.1.0');
        expect(game.state).toBe('TITLE');
    });

    it('should have 3 lives initially', () => {
        global.__APP_VERSION__ = '0.1.0';
        const game = new Game(mockCanvas, mockAssets);
        expect(game.lives).toBe(3);
    });
});
