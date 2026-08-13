import { describe, expect, it } from 'vitest';
import { Level, LevelEditor } from '../../src/Level.js';
import { Input } from '../../src/Input.js';

describe('LevelEditor', () => {
    it('starts the cursor at the portal position', () => {
        const level = new Level();
        level.setTile(7, 2, 3);

        const editor = new LevelEditor(level);

        expect(editor.cx).toBe(7);
        expect(editor.cy).toBe(2);
    });

    it('uses the top-left fallback cursor position when no portal exists', () => {
        const level = new Level();

        const editor = new LevelEditor(level);

        expect(editor.cx).toBe(0);
        expect(editor.cy).toBe(0);
    });

    it('moves upward without placing a tile when up is pressed', () => {
        const level = new Level();
        const editor = new LevelEditor(level);
        const input = new Input();

        editor.cx = 4;
        editor.cy = 4;
        editor.selectedTile = 1;

        input.setVirtualKey('ArrowUp', true);
        editor.update(input);

        expect(editor.cy).toBe(3);
        expect(level.getTile(4, 3)).toBe(0);
    });

    it('places the selected tile when confirm is pressed', () => {
        const level = new Level();
        const editor = new LevelEditor(level);
        const input = new Input();

        editor.cx = 4;
        editor.cy = 4;
        editor.selectedTile = 1;

        input.setVirtualKey('z', true);
        editor.update(input);

        expect(level.getTile(4, 4)).toBe(1);
    });
});
