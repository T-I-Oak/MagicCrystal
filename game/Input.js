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
        
        // Recalculate based on current raw state (without buffer)
        this.updateActionStates();
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
