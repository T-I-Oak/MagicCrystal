import { describe, expect, it } from 'vitest';
import {
    createBackButtonLayout,
    createExtraMapDeleteConfirmLayout,
    createExtraMapFunctionBarLayout,
    createSelectStageFunctionBarLayout,
    createSelectStageGridLayout,
    createTitleMenuLayout
} from '../../src/uiLayout.js';

describe('ui layout', () => {
    it('maps title menu item hit areas to menu indexes', () => {
        const layout = createTitleMenuLayout();

        for (let index = 0; index < layout.itemCount; index++) {
            const point = layout.getItemTextPoint(index);
            expect(layout.getItemIndexAt(point.x, point.y)).toBe(index);
            expect(layout.getItemRect(index).height).toBe(40);
        }

        expect(layout.getItemIndexAt(layout.box.x - 1, layout.box.y)).toBe(-1);
        expect(layout.getItemIndexAt(layout.box.x, layout.box.y - 1)).toBe(-1);
        expect(layout.getItemIndexAt(layout.itemCenterX, layout.box.y)).toBe(-1);
    });

    it('maps select stage rectangles back to stage indexes', () => {
        const layout = createSelectStageGridLayout();

        for (let index = 0; index < layout.itemCount; index++) {
            const rect = layout.getItemRect(index);
            expect(layout.getItemIndexAt(rect.x, rect.y)).toBe(index);
            expect(layout.getItemIndexAt(rect.x + rect.width, rect.y + rect.height)).toBe(index);

            const hitRect = layout.getItemHitRect(index);
            expect(layout.getItemIndexAt(hitRect.x, hitRect.y)).toBe(index);
            expect(layout.getItemIndexAt(hitRect.x + hitRect.width, hitRect.y + hitRect.height)).toBe(index);
        }

        expect(layout.getItemIndexAt(layout.x - layout.hitPaddingX - 1, layout.y)).toBe(-1);
    });

    it('creates back button hit rectangles from the canvas height', () => {
        const standard = createBackButtonLayout(660);
        const playFooter = createBackButtonLayout(660, 'playFooter');

        expect(standard.contains(830, 627)).toBe(true);
        expect(standard.contains(719, 627)).toBe(false);
        expect(playFooter.contains(830, 610)).toBe(true);
        expect(playFooter.contains(830, 605)).toBe(false);
    });

    it('creates extra map function bar rectangles inside the canvas', () => {
        const actionItems = [
            { id: 'play', label: 'PLAY' },
            { id: 'edit', label: 'EDIT' },
            { id: 'copy', label: 'COPY' },
            { id: 'paste', label: 'PASTE' },
            { id: 'favorite', label: 'FAVORITE', labelCandidates: ['FAVORITE', 'UNFAVORITE'] },
            { id: 'share', label: 'SHARE' },
            { id: 'delete', label: 'DELETE' }
        ];
        const layout = createExtraMapFunctionBarLayout(960, 720, actionItems);
        const rects = [layout.smartLeft, layout.smartRight, layout.back, ...layout.items.map(item => item.rect)];

        expect(layout.items.map(item => item.id)).toEqual([
            'play',
            'edit',
            'copy',
            'paste',
            'favorite',
            'share',
            'delete'
        ]);
        const paste = layout.items.find(item => item.id === 'paste').rect;
        const favorite = layout.items.find(item => item.id === 'favorite').rect;
        const play = layout.items.find(item => item.id === 'play').rect;
        const share = layout.items.find(item => item.id === 'share').rect;
        const deleteButton = layout.items.find(item => item.id === 'delete').rect;
        expect(share.y).toBeGreaterThan(paste.y);
        expect(layout.smartRight.x).toBeGreaterThan(deleteButton.x + deleteButton.width);
        expect(layout.smartRight.x + layout.smartRight.width).toBeLessThan(layout.back.x);
        expect(share.x).toBeGreaterThan(favorite.x + favorite.width);
        expect(deleteButton.x).toBeGreaterThan(share.x + share.width);
        expect(favorite.width).toBeGreaterThan(play.width);
        expect(layout.smartLeft.x).toBe(960 - (layout.back.x + layout.back.width));
        expect(favorite.width).toBe(createExtraMapFunctionBarLayout(960, 720, [
            ...actionItems.slice(0, 4),
            { id: 'favorite', label: 'UNFAVORITE', labelCandidates: ['FAVORITE', 'UNFAVORITE'] },
            ...actionItems.slice(5)
        ]).items.find(item => item.id === 'favorite').rect.width);
        rects.forEach((rect) => {
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(960);
            expect(rect.y + rect.height).toBeLessThanOrEqual(720);
        });
    });

    it('creates extra map delete confirmation buttons inside the modal', () => {
        const layout = createExtraMapDeleteConfirmLayout(960, 720);

        expect(layout.confirmButton.y).toBe(layout.cancelButton.y);
        expect(layout.confirmButton.x + layout.confirmButton.width).toBeLessThan(layout.cancelButton.x);
        [layout.box, layout.confirmButton, layout.cancelButton].forEach((rect) => {
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(960);
            expect(rect.y + rect.height).toBeLessThanOrEqual(720);
        });
    });

    it('creates select stage function bar with matched side offsets', () => {
        const layout = createSelectStageFunctionBarLayout(960, 720, [
            { id: 'play', label: 'PLAY' },
            { id: 'settings', label: 'SETTINGS' }
        ]);
        const rects = [layout.smartLeft, layout.smartRight, layout.back, ...layout.items.map(item => item.rect)];

        expect(layout.items.map(item => item.id)).toEqual(['play', 'settings']);
        expect(layout.smartLeft.x).toBe(960 - (layout.back.x + layout.back.width));
        expect(layout.smartRight.x + layout.smartRight.width).toBeLessThan(layout.back.x);
        rects.forEach((rect) => {
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(960);
            expect(rect.y + rect.height).toBeLessThanOrEqual(720);
        });
    });
});
