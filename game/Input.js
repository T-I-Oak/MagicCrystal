class Input {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.bufferedKeys = {};

        // Abstracted Action States
        this.actions = {
            up: false,
            down: false,
            left: false,
            right: false,
            confirm: false,
            cancel: false,
            smartLeft: false,
            smartRight: false
        };
        this.prevActions = { ...this.actions };

        // Mappings
        this.mappings = {
            up: ['ArrowUp', 'w', 'Numpad8'],
            down: ['ArrowDown', 's', 'Numpad5', 'Numpad2'],
            left: ['ArrowLeft', 'a', 'Numpad4'],
            right: ['ArrowRight', 'd', 'Numpad6'],
            'jump': ['ArrowUp', 'w', 'Numpad8'],
            'confirm': ['z', 'Enter', 'Space', ' ', 'Numpad1'],
            cancel: ['x', 'Numpad3'],
            smartLeft: ['q', 'Numpad7'],
            smartRight: ['e', 'Numpad9']
        };

        // Pointer tracking (unchanged)
        this.pointerX = 0;
        this.pointerY = 0;
        this.isPointerDown = false;

        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
        window.addEventListener('blur', () => this.clear());
    }

    handleKey(e, isDown) {
        // Prevent scrolling for game keys
        const gameKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "];
        if (gameKeys.includes(e.key) || gameKeys.includes(e.code)) {
            e.preventDefault();
        }

        this.keys[e.code] = isDown;
        this.keys[e.key] = isDown;
        if (isDown) {
            this.bufferedKeys[e.key] = true;
            this.bufferedKeys[e.code] = true;
        }

        this.updateActionStates();
    }

    // Virtual Key Support
    setVirtualKey(key, isDown) {
        this.keys[key] = isDown;
        if (isDown) {
            this.bufferedKeys[key] = true;
        }
        this.updateActionStates();
    }

    updateActionStates() {
        // Update current action states based on key/mapping
        for (const [action, keys] of Object.entries(this.mappings)) {
            this.actions[action] = keys.some(k => this.keys[k] || this.bufferedKeys[k]);
        }

        // Stick calculation (Legacy support for Game.js)
        const up = this.actions.up;
        const down = this.actions.down;
        const left = this.actions.left;
        const right = this.actions.right;

        this.stick = 5;
        if (up && !down) {
            if (left) this.stick = 7;
            else if (right) this.stick = 9;
            else this.stick = 8;
        } else if (down && !up) {
            if (left) this.stick = 1;
            else if (right) this.stick = 3;
            else this.stick = 2;
        } else if (left && !right) {
            this.stick = 4;
        } else if (right && !left) {
            this.stick = 6;
        } else {
            this.stick = 0;
        }

        // Action-based properties for direct access
        this.jump = this.actions.jump; 
        this.confirm = this.actions.confirm;
        this.giveUp = this.actions.cancel;
        this.smartLeft = this.actions.smartLeft;
        this.smartRight = this.actions.smartRight;
    }

    /**
     * Called once per game loop iteration
     */
    update() {
        // Copy current actions to prevActions for edge detection
        this.prevActions = { ...this.actions };

        // Reset buffers
        this.bufferedKeys = {};

        // 1. Update Keyboard/Virtual Key actions first
        this.updateActionStates();

        // 2. Poll Gamepad
        this.pollGamepad();
    }

    pollGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gamepad = gamepads[0]; // Support first connected gamepad
        if (!gamepad) return;

        const deadzone = 0.25;

        // Axes (L-Stick)
        const ax = gamepad.axes[0];
        const ay = gamepad.axes[1];

        if (ax < -deadzone) this.actions.left = true;
        if (ax > deadzone) this.actions.right = true;
        if (ay < -deadzone) {
            this.actions.up = true;
            this.actions.jump = true;
        }
        if (ay > deadzone) this.actions.down = true;

        // Buttons
        // 0: A/Cross, 1: B/Circle, 4: L1, 5: R1, 12-15: D-pad
        if (gamepad.buttons[0].pressed) {
            this.actions.confirm = true;
        }
        if (gamepad.buttons[1].pressed) {
            this.actions.cancel = true;
        }
        if (gamepad.buttons[4].pressed) this.actions.smartLeft = true;
        if (gamepad.buttons[5].pressed) this.actions.smartRight = true;

        // D-pad
        if (gamepad.buttons[12] && gamepad.buttons[12].pressed) {
            this.actions.up = true;
            this.actions.jump = true;
        }
        if (gamepad.buttons[13] && gamepad.buttons[13].pressed) this.actions.down = true;
        if (gamepad.buttons[14] && gamepad.buttons[14].pressed) this.actions.left = true;
        if (gamepad.buttons[15] && gamepad.buttons[15].pressed) this.actions.right = true;

        // Re-sync properties for direct access
        this.jump = this.actions.jump;
        this.confirm = this.actions.confirm;
        this.giveUp = this.actions.cancel;
        this.smartLeft = this.actions.smartLeft;
        this.smartRight = this.actions.smartRight;

        // Update stick value for legacy support
        this.updateStickFromActions();
    }

    updateStickFromActions() {
        const up = this.actions.up;
        const down = this.actions.down;
        const left = this.actions.left;
        const right = this.actions.right;

        if (up && !down) {
            if (left) this.stick = 7;
            else if (right) this.stick = 9;
            else this.stick = 8;
        } else if (down && !up) {
            if (left) this.stick = 1;
            else if (right) this.stick = 3;
            else this.stick = 2;
        } else if (left && !right) {
            this.stick = 4;
        } else if (right && !left) {
            this.stick = 6;
        } else if (!up && !down && !left && !right) {
            this.stick = 0;
        } else {
            this.stick = 0; // Contradictory inputs
        }
    }

    isPressed(action) {
        return this.actions[action];
    }

    isJustPressed(action) {
        return this.actions[action] && !this.prevActions[action];
    }

    clear() {
        this.keys = {};
        this.bufferedKeys = {};
        this.updateActionStates();
        // Force prevActions to be cleared so we don't get false "just pressed" after focus
        this.prevActions = { ...this.actions };
    }
}
