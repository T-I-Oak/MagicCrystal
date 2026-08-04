import { describe, expect, it } from 'vitest';
import {
    createBackButtonLayout,
    createExtraMapActionMenuLayout,
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

    it('keeps extra map action menus inside the canvas and maps item rectangles', () => {
        const leftMenu = createExtraMapActionMenuLayout({ x: 820, y: 610, width: 100, height: 60 }, 3, 960, 720);

        expect(leftMenu.x + leftMenu.width).toBeLessThanOrEqual(950);
        expect(leftMenu.y + leftMenu.height).toBeLessThanOrEqual(632);
        expect(leftMenu.getItemIndexAt(leftMenu.getItemRect(0).x, leftMenu.getItemRect(0).y)).toBe(0);
        expect(leftMenu.getItemIndexAt(leftMenu.getItemRect(2).x + 10, leftMenu.getItemRect(2).y + 10)).toBe(2);
        expect(leftMenu.getItemIndexAt(leftMenu.x - 1, leftMenu.y)).toBe(-1);
    });
});
