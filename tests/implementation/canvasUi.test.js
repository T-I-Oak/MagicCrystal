import { describe, expect, it } from 'vitest';
import { containsPoint, createCanvasPointerMapper, createRectAction, dispatchRectAction } from '../../src/canvasUi.js';

describe('canvas ui dispatcher', () => {
    it('maps client coordinates into canvas coordinates', () => {
        const canvas = {
            width: 960,
            height: 660,
            getBoundingClientRect: () => ({
                left: 100,
                top: 50,
                width: 480,
                height: 330
            })
        };
        const mapper = createCanvasPointerMapper(canvas);

        expect(mapper.toCanvasPoint(340, 215)).toEqual({ x: 480, y: 330 });
    });

    it('dispatches the first rectangle action containing the point', () => {
        const calls = [];
        const actions = [
            createRectAction({ x: 0, y: 0, width: 10, height: 10 }, () => calls.push('first')),
            createRectAction({ x: 20, y: 0, width: 10, height: 10 }, () => calls.push('second'))
        ];

        expect(dispatchRectAction(actions, { x: 25, y: 5 })).toBe(true);
        expect(calls).toEqual(['second']);
    });

    it('does not dispatch when no rectangle contains the point', () => {
        const calls = [];
        const actions = [
            createRectAction({ x: 0, y: 0, width: 10, height: 10 }, () => calls.push('called'))
        ];

        expect(dispatchRectAction(actions, { x: 11, y: 5 })).toBe(false);
        expect(calls).toEqual([]);
    });

    it('checks rectangle containment inclusively', () => {
        const rect = { x: 10, y: 20, width: 30, height: 40 };

        expect(containsPoint(rect, { x: 10, y: 20 })).toBe(true);
        expect(containsPoint(rect, { x: 40, y: 60 })).toBe(true);
        expect(containsPoint(rect, { x: 41, y: 60 })).toBe(false);
    });
});
