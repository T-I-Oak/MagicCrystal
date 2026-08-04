import { describe, expect, it } from 'vitest';
import { createEditorMenuLayout, createEditorTileGuideLayout } from '../../src/editorLayout.js';
import { createSettingsLayout } from '../../src/settingsLayout.js';

describe('editor tile guide layout', () => {
    it('maps each rendered tile guide rectangle back to the same tile index', () => {
        const layout = createEditorTileGuideLayout();

        for (let index = 0; index < layout.itemCount; index++) {
            const rect = layout.getItemRect(index);
            expect(layout.getItemIndexAt(rect.x + 1, rect.y + 1)).toBe(index);
            expect(layout.getItemIndexAt(rect.x + rect.width - 1, rect.y + rect.height - 1)).toBe(index);
        }
    });

    it('rejects points outside the tile guide rectangles', () => {
        const layout = createEditorTileGuideLayout();

        expect(layout.getItemIndexAt(layout.x - 1, layout.y)).toBe(-1);
        expect(layout.getItemIndexAt(layout.x, layout.y - 1)).toBe(-1);
        expect(layout.getItemIndexAt(layout.x, layout.y + layout.itemHeight * 2)).toBe(-1);
    });

    it('keeps edit menu description outside selectable item hit areas', () => {
        const layout = createEditorMenuLayout(960);
        const settingsLayout = createSettingsLayout(960);

        expect(layout.itemCount).toBe(5);
        expect(layout.box).toEqual(settingsLayout.box);
        expect(layout.title).toEqual(settingsLayout.title);
        expect(layout.markerX).toBe(settingsLayout.markerX);
        expect(layout.labelX).toBe(settingsLayout.labelX);
        expect(layout.getItemY(0)).toBe(settingsLayout.getItemY(0));
        expect(layout.getItemY(4)).toBe(settingsLayout.getItemY(6));
        expect(layout.getItemIndexAt(layout.labelX, layout.getItemY(0))).toBe(0);
        expect(layout.getItemIndexAt(layout.labelX, layout.getItemY(4))).toBe(4);
        expect(layout.getItemIndexAt(layout.description.x + 10, layout.description.y + 10)).toBe(-1);
    });
});
