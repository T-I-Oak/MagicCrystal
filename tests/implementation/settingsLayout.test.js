import { describe, expect, it } from 'vitest';
import { createSettingsLayout, isSettingsSliderHit } from '../../src/settingsLayout.js';

describe('settingsLayout', () => {
    it('returns the same item coordinates used by rendering and hit detection', () => {
        const layout = createSettingsLayout(960);

        expect(layout.getItemY(0)).toBe(230);
        expect(layout.getItemY(5)).toBe(505);
        expect(layout.getItemIndexAt(layout.labelX, layout.getItemY(5))).toBe(5);
        expect(layout.itemCount).toBe(6);
        expect(layout.closeButton.x).toBeGreaterThan(layout.box.x);
        expect(layout.closeButton.y).toBeGreaterThan(layout.getItemRect(5).y + layout.getItemRect(5).height);
        expect(layout.closeButton.x + layout.closeButton.width).toBeLessThan(layout.box.x + layout.box.width);
        expect(layout.closeButton.y + layout.closeButton.height).toBeLessThan(layout.box.y + layout.box.height);
    });

    it('rejects clicks between setting rows', () => {
        const layout = createSettingsLayout(960);

        expect(layout.getItemIndexAt(layout.labelX, layout.getItemY(0) + 26)).toBe(-1);
        expect(layout.getItemIndexAt(layout.labelX, layout.getItemY(layout.itemCount))).toBe(-1);
    });

    it('returns item rectangles for callback registration', () => {
        const layout = createSettingsLayout(960);
        const rect = layout.getItemRect(5);

        expect(rect).toEqual({
            x: 180,
            y: 480,
            width: 600,
            height: 50
        });
        expect(layout.getItemIndexAt(rect.x, rect.y)).toBe(5);
        expect(layout.getItemIndexAt(rect.x + rect.width, rect.y + rect.height)).toBe(5);
    });

    it('limits slider hits to the slider track area', () => {
        const layout = createSettingsLayout(960);

        expect(isSettingsSliderHit(layout, layout.slider.x)).toBe(true);
        expect(isSettingsSliderHit(layout, layout.labelX)).toBe(false);
    });
});
