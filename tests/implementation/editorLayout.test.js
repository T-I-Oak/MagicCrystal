import { describe, expect, it } from 'vitest';
import {
    createEditorControlsModalLayout,
    createEditorDifficultyModalLayout,
    createEditorFunctionBarLayout,
    createEditorTileGuideLayout
} from '../../src/editorLayout.js';

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

    it('sizes editor function buttons from max candidate labels and keeps them inside the canvas', () => {
        const baseItems = [
            { id: 'controls', label: 'HELP' },
            {
                id: 'terrain',
                label: '1: Soil',
                labelCandidates: [
                    '1: Soil',
                    '5: Stasis Sapphire'
                ]
            },
            { id: 'difficulty', label: 'DIFFICULTY' },
            { id: 'save', label: 'SAVE' }
        ];
        const layout = createEditorFunctionBarLayout(960, baseItems);
        const terrain = layout.items.find(item => item.id === 'terrain').rect;
        const shortTerrainLayout = createEditorFunctionBarLayout(960, [
            baseItems[0],
            {
                id: 'terrain',
                label: '5: Stasis Sapphire',
                labelCandidates: [
                    '1: Soil',
                    '5: Stasis Sapphire'
                ]
            },
            baseItems[2],
            baseItems[3]
        ]);
        const terrainAfterLabelChange = shortTerrainLayout.items.find(item => item.id === 'terrain').rect;
        const rects = [
            layout.smartLeft,
            layout.smartRight,
            layout.discard,
            ...layout.items.map(item => item.rect)
        ];

        expect(layout.items.map(item => item.id)).toEqual(['controls', 'terrain', 'difficulty', 'save']);
        expect(terrain.width).toBe(terrainAfterLabelChange.width);
        expect(terrain.width).toBeGreaterThan(layout.items.find(item => item.id === 'save').rect.width);
        expect(layout.smartLeft.x).toBe(960 - (layout.discard.x + layout.discard.width));
        expect(layout.smartRight.x + layout.smartRight.width).toBeLessThan(layout.discard.x);
        rects.forEach((rect) => {
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(960);
            expect(rect.y + rect.height).toBeLessThanOrEqual(720);
        });
    });

    it('keeps the difficulty modal value, description, and close button aligned inside the modal', () => {
        const layout = createEditorDifficultyModalLayout(960, 720);

        expect(layout.itemCount).toBe(1);
        expect(layout.valueRect.x).toBeGreaterThan(layout.box.x);
        expect(layout.valueRect.x + layout.valueRect.width).toBeLessThan(layout.box.x + layout.box.width);
        expect(layout.valueControlRect.x).toBeGreaterThan(layout.valueLabel.x);
        expect(layout.valueControlRect.x + layout.valueControlRect.width).toBeLessThan(layout.box.x + layout.box.width);
        expect(layout.valueControlRect.y).toBeGreaterThan(layout.valueRect.y);
        expect(layout.valueControlRect.y + layout.valueControlRect.height).toBeLessThan(layout.valueRect.y + layout.valueRect.height);
        expect(layout.description.x).toBe(layout.valueRect.x);
        expect(layout.description.x + layout.description.width).toBe(layout.valueRect.x + layout.valueRect.width);
        expect(layout.closeButton.x + layout.closeButton.width).toBeLessThan(layout.box.x + layout.box.width);
        expect(layout.closeButton.y + layout.closeButton.height).toBeLessThan(layout.box.y + layout.box.height);
        for (let index = 0; index < layout.itemCount; index++) {
            const rect = layout.getItemRect(index);
            expect(rect.x).toBeGreaterThan(layout.box.x);
            expect(rect.x + rect.width).toBeLessThan(layout.box.x + layout.box.width);
            expect(rect.y + rect.height).toBeLessThan(layout.box.y + layout.box.height);
        }
    });

    it('keeps the editor controls close button inside the modal footer', () => {
        const layout = createEditorControlsModalLayout();

        expect(layout.closeButton.x).toBeGreaterThan(layout.footer.x);
        expect(layout.closeButton.y).toBeGreaterThan(layout.footer.y);
        expect(layout.closeButton.x + layout.closeButton.width).toBeLessThanOrEqual(layout.footer.x + layout.footer.width);
        expect(layout.closeButton.y + layout.closeButton.height).toBeLessThanOrEqual(layout.footer.y + layout.footer.height);
        expect(layout.content.y + layout.content.height).toBeLessThanOrEqual(layout.footer.y);
    });
});
