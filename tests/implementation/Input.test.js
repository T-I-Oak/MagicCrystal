import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Input } from '../../src/Input.js';

function releaseVirtualKey(input, key) {
    input.setVirtualKey(key, false);
    input.update();
}

describe('Input', () => {
    let gamepad;

    beforeEach(() => {
        gamepad = {
            axes: [0, 0, 0, 0],
            buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
        };

        Object.defineProperty(window.navigator, 'getGamepads', {
            configurable: true,
            value: vi.fn(() => [gamepad])
        });
    });

    it('tracks confirm presses and edge detection', () => {
        const input = new Input();

        expect(input.isPressed('confirm')).toBe(false);

        input.setVirtualKey('Enter', true);
        expect(input.isPressed('confirm')).toBe(true);
        expect(input.isJustPressed('confirm')).toBe(true);

        input.update();
        expect(input.isPressed('confirm')).toBe(true);
        expect(input.isJustPressed('confirm')).toBe(false);

        input.setVirtualKey('Enter', false);
        expect(input.isPressed('confirm')).toBe(false);
    });

    it('buffers rapid key taps for one update frame', () => {
        const input = new Input();

        input.setVirtualKey('z', true);
        input.setVirtualKey('z', false);

        expect(input.isPressed('confirm')).toBe(true);
        expect(input.isJustPressed('confirm')).toBe(true);

        input.update();
        expect(input.isPressed('confirm')).toBe(false);
    });

    it('maps virtual arrow keys to directional actions', () => {
        const input = new Input();

        input.setVirtualKey('ArrowUp', true);
        expect(input.isPressed('up')).toBe(true);
        expect(input.stick).toBe(8);

        releaseVirtualKey(input, 'ArrowUp');
        expect(input.isPressed('up')).toBe(false);
    });

    it('maps gamepad axes and buttons to actions', () => {
        const input = new Input();

        gamepad.axes[0] = -0.5;
        input.update();
        expect(input.isPressed('left')).toBe(true);
        expect(input.stick).toBe(4);

        gamepad.axes[0] = 0;
        gamepad.axes[1] = -0.8;
        input.update();
        expect(input.isPressed('up')).toBe(true);
        expect(input.isPressed('jump')).toBe(true);
        expect(input.stick).toBe(8);

        gamepad.axes[1] = -0.1;
        input.update();
        expect(input.isPressed('up')).toBe(false);

        gamepad.buttons[0].pressed = true;
        input.update();
        expect(input.isPressed('confirm')).toBe(true);
        expect(input.isPressed('jump')).toBe(false);

        gamepad.buttons[0].pressed = false;
        gamepad.buttons[4].pressed = true;
        input.update();
        expect(input.isPressed('smartLeft')).toBe(true);
    });
});
