class Input {
    constructor() {
        this.stick = 0;
        this.trigger = false;
        this.keys = {};
        this.editTogglePressed = false;
        this.savePressed = false;
        this.loadPressed = false;

        // Previous state for edge detection
        this.prevJump = false;
        this.prevSmartLeft = false;
        this.prevSmartRight = false;

        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
    }
    handleKey(e, isDown) {
        // Prevent scrolling for game keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
            e.preventDefault();
        }

        this.keys[e.key] = isDown;

        // Track numpad separately using e.code
        if (e.code && e.code.startsWith('Numpad')) {
            this.keys[e.code] = isDown;
        }
        // Track regular digit keys separately
        if (e.code && e.code.startsWith('Digit')) {
            this.keys[e.code] = isDown;
        }

        this.updateState();
    }

    // Virtual Key Support
    setVirtualKey(key, isDown) {
        this.keys[key] = isDown;
        this.updateState();
    }

    updateState() {
        // Game Input - Use Numpad for cursor movement
        const up = this.keys.ArrowUp || this.keys.w || this.keys.Numpad8;
        const right = this.keys.ArrowRight || this.keys.d || this.keys.Numpad6;
        const down = this.keys.ArrowDown || this.keys.s || this.keys.Numpad5 || this.keys.Numpad2 || this.keys[' ']; // Down: Numpad5, Numpad2, Space
        const left = this.keys.ArrowLeft || this.keys.a || this.keys.Numpad4;

        // Context-Sensitive Actions
        this.jump = this.keys.z || this.keys.Numpad1; // Game Jump: Z or Numpad1 (A button)
        this.confirm = this.keys.z || this.keys.Enter || this.keys[' '] || this.keys.Numpad1; // Numpad1 = Z

        this.giveUp = this.keys.x || this.keys.Numpad3; // Numpad3 = X
        this.smartLeft = this.keys.q || this.keys.Numpad7; // Numpad7 = Q
        this.smartRight = this.keys.e || this.keys.Numpad9; // Numpad9 = E

        if (up && !down) {
            if (left) this.stick = 7;      // UP-LEFT
            else if (right) this.stick = 9; // UP-RIGHT
            else this.stick = 8;            // UP
        } else if (down && !up) {
            if (left) this.stick = 1;      // DOWN-LEFT
            else if (right) this.stick = 3; // DOWN-RIGHT
            else this.stick = 2;            // DOWN
        } else if (left && !right) {
            this.stick = 4;                 // LEFT
        } else if (right && !left) {
            this.stick = 6;                 // RIGHT
        } else {
            this.stick = 0;
        }
    }
    isPressed(key) { return this.keys[key]; }
}
