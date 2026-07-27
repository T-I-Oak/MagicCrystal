import { describe, expect, it } from 'vitest';
import { createSettingsLayout, isSettingsSliderHit } from '../../src/settingsLayout.js';

describe('settingsLayout', () => {
    it('returns the same item coordinates used by rendering and hit detection', () => {
        const layout = createSettingsLayout(960);

        expect(layout.getItemY(0)).toBe(230);
        expect(layout.getItemY(6)).toBe(560);
        expect(layout.getItemIndexAt(layout.labelX, layout.getItemY(5))).toBe(5);
    });

    it('rejects clicks between setting rows', () => {
        const layout = createSettingsLayout(960);

        expect(layout.getItemIndexAt(layout.labelX, layout.getItemY(0) + 26)).toBe(-1);
    });

    it('limits slider hits to the slider track area', () => {
        const layout = createSettingsLayout(960);

        expect(isSettingsSliderHit(layout, layout.slider.x)).toBe(true);
        expect(isSettingsSliderHit(layout, layout.labelX)).toBe(false);
    });
});
