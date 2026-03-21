class Game {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.assets = assets; // Injected (Loaded)
        this.version = "1.0.22";

        // HIGH RES UPDATE: 40x40 per tile
        this.tileWidth = 40;
        this.tileHeight = 40;
        this.cols = 24;
        this.rows = 13;

        this.canvas.width = this.cols * this.tileWidth;
        this.canvas.height = this.rows * this.tileHeight + 140; // 80px Header + 60px Footer

        this.input = new Input();
        this.level = new Level(this.cols, this.rows);
        this.physics = new Physics();
        this.editor = new LevelEditor(this.level);
        this.renderer = new Renderer(this.ctx, this.assets);

        this.targetFPS = 45;
        this.deltaTime = 1000 / this.targetFPS;
        this.accumulator = 0;

        // --- STATE MANAGEMENT ---
        this.state = 'TITLE';
        this.lives = 3;
        this.maxLives = 9;
        this.clearedStages = new Array(50).fill(false);
        this.stage = 0;
        this.stateTimer = 0;

        // UI State
        // Title menus are split into MAIN and SETTINGS screens
        this.titleCursor = 0;     // MAIN title menu cursor (0..3)
        this.settingsCursor = 0;  // SETTINGS menu cursor (0..5)
        this.selectCursor = 0;
        this.selectMode = 'PLAY';

        // Settings
        this.padType = 1; // 0: None, 1: Single, 2: Dual (Changed from 0:S, 1:D)
        this.padPosX = 50; // 0-100%
        this.padPosY = 25;  // 0-100% (Default 25 to avoid off-screen)
        this.padSize = 100;
        this.screenSize = 100; // 50-100% Game Screen Scale
        this.tempScreenSize = 100; // Preview
        this.loadSettings(); // Load saved settings (will update screenSize & tempScreenSize)
        this.updatePadLayout(); // Initial Apply

        // toDataURL removed to avoid SecurityError with local files
        this.crystalCount = 0;
        this.ES = 0;

        // Give Up Timer
        this.giveUpTimer = 0;
        this.giveUpMax = 60; // 1 sec hold
        this.selectExitTimer = 0; // Timer for exiting stage select
        this.howToPlayScroll = 0;

        this.isSaved = false;
    }

    updatePadLayout() {
        const ctrl = document.getElementById('touch-controls');
        if (!ctrl) return;

        const p1 = ctrl.querySelector('.primary-pad');
        const p2 = ctrl.querySelector('.secondary-pad');

        // Reset Styles
        ctrl.className = 'overlay-controls';
        if (p1) { p1.setAttribute('style', ''); }
        if (p2) { p2.setAttribute('style', ''); }

        const s = this.padSize / 100;

        if (this.padType === 0) {
            // NONE: Hide everything
            if (p1) p1.style.display = 'none';
            if (p2) p2.style.display = 'none';
        } else if (this.padType === 1) {
            // SINGLE
            if (p2) p2.style.display = 'none';
            if (p1) {
                p1.style.display = 'grid';
                p1.style.position = 'absolute';
                p1.style.left = `${this.padPosX}%`;
                p1.style.bottom = `${this.padPosY}%`;
                p1.style.transform = `translate(-50%, 50%) scale(${s})`;
            }
        } else {
            // DUAL
            if (p1) p1.style.display = 'grid';
            if (p2) p2.style.display = 'grid';

            const dist = this.padPosX;
            const bottom = this.padPosY;

            if (p1) {
                p1.style.position = 'absolute';
                p1.style.left = `${dist}%`;
                p1.style.bottom = `${bottom}%`;
                p1.style.transform = `translate(-50%, 50%) scale(${s})`;
            }

            if (p2) {
                p2.style.position = 'absolute';
                p2.style.right = `${dist}%`;
                p2.style.bottom = `${bottom}%`;
                p2.style.transform = `translate(50%, 50%) scale(${s})`;
            }
        }
    }

    loadStage(index) {
        this.stage = index;
        this.level.loadStage(index);
        this.resetPlayer();
    }

    resetPlayer() {
        let startX = 4, startY = 4;
        this.crystalCount = 0;
        for (let y = 0; y < this.level.rows; y++) {
            for (let x = 0; x < this.level.cols; x++) {
                if (this.level.data[y][x] === 3) { startX = x * 4; startY = y * 4; }
                if (this.level.data[y][x] === 4 || this.level.data[y][x] === 5) this.crystalCount++;
            }
        }
        this.player = { x: startX, y: startY, vx: 0, vy: 0, jumpState: 0, faceRight: true, lives: 3, turnWait: 0 };
        this.ES = 0; // Earthquake Switch
    }

    saveLevel() {
        localStorage.setItem('magic_crystal_level', this.level.serialize());
        this.isSaved = true;
    }

    loadLevel() {
        const data = localStorage.getItem('magic_crystal_level');
        if (data) {
            this.level.deserialize(data);
            this.resetPlayer();
            this.isSaved = true;
        }
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.boundLoop = this.loop.bind(this); // Bind once
        requestAnimationFrame(this.boundLoop);
    }

    loop(timestamp) {
        if (!this.running) return;
        const frameTime = timestamp - this.lastTime; this.lastTime = timestamp; this.accumulator += frameTime;

        while (this.accumulator >= this.deltaTime) {
            this.update(); // Update Logic
            this.input.update(); // Cycle Input (prevActions and Buffers)
            this.accumulator -= this.deltaTime;
        }

        this.render(); // Delegated Render
        requestAnimationFrame(this.boundLoop);
    }

    update() {
        // Timer Logic
        if (this.stateTimer > 0) {
            this.stateTimer -= this.deltaTime / 1000;
            if (this.stateTimer <= 0) {
                this.stateTimer = 0;
                this.onTimerEnd();
            }
        }

        switch (this.state) {
            case 'TITLE': this.updateTitle(); break;
            case 'SETTINGS': this.updateSettings(); break;
            case 'HOW_TO_PLAY': this.updateHowToPlay(); break;
            case 'SELECT': this.updateSelect(); break;
            case 'WAIT_START': break; // Wait for timer (handled in update top)
            case 'PLAY': this.updatePlay(); break;
            case 'EDITOR':
                // Use giveUp (x key or Numpad3) for long-press back to SELECT
                if (this.input.giveUp) {
                    this.giveUpTimer++;
                    if (this.giveUpTimer >= this.giveUpMax) {
                        this.state = 'SELECT';
                        this.giveUpTimer = 0;
                    }
                } else {
                    this.giveUpTimer = 0;
                    this.editor.update(this.input);
                }
                break;
            case 'GAMEOVER': if (this.input.isJustPressed('confirm')) this.state = 'TITLE'; break;
            case 'ALLCLEAR': if (this.input.isJustPressed('confirm')) this.state = 'TITLE'; break;
        }
    }

    onTimerEnd() {
        if (this.state === 'WAIT_MISS') {
            if (this.lives > 0) this.state = 'SELECT';
            else this.state = 'GAMEOVER'; // Logical Fallback if lives went to 0 but state was WAIT_MISS
        } else if (this.state === 'WAIT_CLEAR') {
            if (this.clearedStages.every(Boolean)) this.state = 'ALLCLEAR';
            else this.state = 'SELECT';
        } else if (this.state === 'WAIT_GAMEOVER') {
            this.state = 'TITLE';
        } else if (this.state === 'WAIT_START') {
            this.state = 'PLAY';
        }
    }

    updateTitle() {
        if (this.input.isJustPressed('down')) this.titleCursor = (this.titleCursor + 1) % 4;
        if (this.input.isJustPressed('up')) this.titleCursor = (this.titleCursor + 3) % 4; // -1

        // Title MAIN: never show drag handles
        document.querySelectorAll('.drag-handle').forEach(h => h.classList.remove('visible'));

        if (this.input.isJustPressed('confirm')) {
            if (this.titleCursor === 0) {
                this.selectMode = 'PLAY';
                this.lives = 3;
                this.clearedStages = new Array(50).fill(false); // Reset Progress
                this.state = 'SELECT';
            } else if (this.titleCursor === 1) {
                this.howToPlayScroll = 0;
                this.state = 'HOW_TO_PLAY';
            } else if (this.titleCursor === 2) {
                this.selectMode = 'EDIT';
                this.state = 'SELECT';
            } else if (this.titleCursor === 3) {
                this.state = 'SETTINGS';
            }
        }
    }

    updateSettings() {
        if (this.input.isJustPressed('down')) {
            this.settingsCursor = (this.settingsCursor + 1) % 6;
            if (this.padType === 0 && (this.settingsCursor === 2 || this.settingsCursor === 3)) {
                // Guard: Ignore PAD POS/SIZE if padType is NONE
                this.settingsCursor = 4; // Skip to SCREEN SIZE
            }
        }
        if (this.input.isJustPressed('up')) {
            this.settingsCursor = (this.settingsCursor + 5) % 6; // -1
            if (this.padType === 0 && (this.settingsCursor === 2 || this.settingsCursor === 3)) {
                this.settingsCursor = 1; // Skip back to PAD TYPE
            }
        }

        // Drag Handle Visibility only for PAD POS
        const showHandle = (this.settingsCursor === 2);
        document.querySelectorAll('.drag-handle').forEach(h => {
            if (showHandle) h.classList.add('visible');
            else h.classList.remove('visible');
        });

        // Adjustment (Left/Right)
        const left = this.input.isJustPressed('left');
        const right = this.input.isJustPressed('right');

        // Fast adjust hold
        const holdLeft = this.input.isPressed('left');
        const holdRight = this.input.isPressed('right');

        if (this.settingsCursor === 0) {
            // SPEED
            if (left) {
                this.targetFPS = Math.max(10, this.targetFPS - 5);
                this.deltaTime = 1000 / this.targetFPS;
                this.saveSettings();
            }
            if (right) {
                this.targetFPS = Math.min(60, this.targetFPS + 5);
                this.deltaTime = 1000 / this.targetFPS;
                this.saveSettings();
            }
        } else if (this.settingsCursor === 1) {
            // PAD TYPE (0: None, 1: Single, 2: Dual)
            if (left) {
                this.padType = (this.padType + 2) % 3;
                this.updatePadLayout();
                this.saveSettings();
            }
            if (right) {
                this.padType = (this.padType + 1) % 3;
                this.updatePadLayout();
                this.saveSettings();
            }
        } else if (this.settingsCursor === 2) {
            // PAD POS (Drag Only)
            // Drag behavior is handled in main.js (mousedown/touchstart on .drag-handle)
        } else if (this.settingsCursor === 3) {
            // PAD SIZE
            if (holdLeft) this.padSize = Math.max(50, this.padSize - 1);
            if (holdRight) this.padSize = Math.min(150, this.padSize + 1);
            if (holdLeft || holdRight) {
                this.updatePadLayout();
                this.saveSettings();
            }
        } else if (this.settingsCursor === 4) {
            // SCREEN SIZE
            if (holdLeft) this.tempScreenSize = Math.max(50, this.tempScreenSize - 1);
            if (holdRight) this.tempScreenSize = Math.min(100, this.tempScreenSize + 1);
            if (!this.input.isPointerDown && !this.input.keys.ArrowLeft && !this.input.keys.ArrowRight && !this.input.keys.a && !this.input.keys.d && this.screenSize !== this.tempScreenSize) {
                // Apply on release (Keyboard or PointerUp)
                this.screenSize = this.tempScreenSize;
                window.dispatchEvent(new Event('resize'));
                this.saveSettings();
            }
        }

        if (this.input.isJustPressed('confirm')) {
            // BACK
            if (this.settingsCursor === 5) {
                document.querySelectorAll('.drag-handle').forEach(h => h.classList.remove('visible'));
                this.state = 'TITLE';
            }
        }

        // Also allow B (giveUp) as quick back
        if (this.input.isJustPressed('cancel')) {
            document.querySelectorAll('.drag-handle').forEach(h => h.classList.remove('visible'));
            this.state = 'TITLE';
        }
    }

    updateHowToPlay() {
        // Exit to Title (Tap/Confirm)
        if (this.input.isJustPressed('confirm')) {
            this.state = 'TITLE';
        }
        // Also B (giveUp) to back
        if (this.input.isJustPressed('cancel')) {
            this.state = 'TITLE';
        }

        // Scrolling (Keyboard)
        const speed = 15;
        if (this.input.isPressed('down')) {
            this.howToPlayScroll += speed;
        }
        if (this.input.isPressed('up')) {
            this.howToPlayScroll -= speed;
        }

        // Max scroll content: Content height is big.
        this.howToPlayScroll = Math.max(0, Math.min(this.howToPlayScroll, 1600));
    }

    updateSelect() {
        // Exit to Title (Long Press)
        if (this.input.giveUp) {
            this.selectExitTimer++;
            if (this.selectExitTimer >= this.giveUpMax) {
                this.state = 'TITLE';
                this.selectExitTimer = 0;
                return;
            }
        } else {
            this.selectExitTimer = 0;
        }

        const left = this.input.isJustPressed('left');
        const right = this.input.isJustPressed('right');
        const up = this.input.isJustPressed('up');
        const down = this.input.isJustPressed('down');

        if (right) this.selectCursor = (this.selectCursor + 1) % 50;
        if (left) this.selectCursor = (this.selectCursor + 49) % 50;
        if (down) this.selectCursor = (this.selectCursor + 10) % 50;
        if (up) this.selectCursor = (this.selectCursor + 40) % 50;

        if (this.input.isJustPressed('confirm')) {
            if (this.selectMode === 'PLAY') {
                // Allow playing any stage
                this.loadStage(this.selectCursor);
                this.state = 'WAIT_START';
                this.stateTimer = 1.0; // 1 Second Ready Phase
            } else {
                this.loadStage(this.selectCursor);
                this.state = 'EDITOR';
            }
        }
    }

    updatePlay() {
        if (this.input.isPointerDown) {
            // Grid-based movement: compare pointer tile with player tile
            // Each tile is 40px (which is 4 internal units). Header is 80px.
            const pointerGridX = Math.floor(this.input.pointerX / 40);
            const pointerGridY = Math.floor((this.input.pointerY - 80) / 40);
            const playerGridX = Math.floor(this.player.x / 4);
            const playerGridY = Math.floor(this.player.y / 4);

            const dgX = pointerGridX - playerGridX;
            const dgY = pointerGridY - playerGridY;

            let ps = 0; // Pointer Stick

            if (dgY < 0) {
                // Taping UP grid: Jump
                if (dgX < 0) ps = 7;      // Up-Left
                else if (dgX > 0) ps = 9; // Up-Right
                else ps = 8;               // Straight Up
            } else if (dgY > 0) {
                // Taping DOWN grid (or same Y but diag)
                if (dgX < 0) ps = 4;      // Just use Left for Down-Left
                else if (dgX > 0) ps = 6; // Just use Right for Down-Right
                else ps = 2;               // Straight Down (Dig)
            } else {
                // Same vertical grid
                if (dgX < 0) ps = 4;
                else if (dgX > 0) ps = 6;
                else ps = 0; // Center: Neutral
            }

            if (ps !== 0) {
                this.input.stick = ps;
                // Jump if upward direction
                if (ps === 7 || ps === 8 || ps === 9) this.input.jump = true;
            } else {
                this.input.stick = 0;
            }
        }

        this.physics.update(this.player, this.level, this.input, this);
        if (this.ES > 0) this.ES--;
        if (this.ES === 1) this.level.applyEarthquake();

        // Long Press Give Up (Retire)
        if (this.input.giveUp) {
            this.giveUpTimer++;
            if (this.giveUpTimer >= this.giveUpMax) {
                this.handleGameOver();
                this.giveUpTimer = 0;
            }
        } else {
            this.giveUpTimer = 0;
        }
    }

    render() {
        this.renderer.render(this.level, this.player, this.editor, this.state, this.ES, this);
    }

    handleGameOver() {
        this.lives--;
        if (this.lives > 0) {
            this.state = 'MISS';
            this.state = 'WAIT_MISS';
            this.stateTimer = 1.0;
        } else {
            this.state = 'GAME_OVER';
            this.state = 'WAIT_GAMEOVER';
            this.stateTimer = 3.0; // 3 Seconds
        }
        this.running = true;
    }

    handleLevelClear() {
        this.state = 'CLEAR';
        this.clearedStages[this.stage] = true;
        if (this.lives < this.maxLives) this.lives++;
        this.state = 'WAIT_CLEAR';
        this.stateTimer = 1.0;
        this.running = true;
    }

    loadSettings() {
        try {
            const data = localStorage.getItem('magic_crystal_settings');
            if (data) {
                const s = JSON.parse(data);
                if (s.padType !== undefined) this.padType = s.padType;
                if (s.padPosX !== undefined) this.padPosX = s.padPosX;
                if (s.padPosY !== undefined) this.padPosY = s.padPosY;
                if (s.padSize !== undefined) this.padSize = Number(s.padSize) || 100;
                if (s.screenSize !== undefined) {
                    this.screenSize = Number(s.screenSize) || 100;
                    this.tempScreenSize = this.screenSize;
                }
                if (s.targetFPS !== undefined) {
                    this.targetFPS = Number(s.targetFPS) || 45;
                    this.deltaTime = 1000 / this.targetFPS;
                }
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }

    saveSettings() {
        const s = {
            padType: this.padType,
            padPosX: this.padPosX,
            padPosY: this.padPosY,
            padSize: this.padSize,
            screenSize: this.screenSize,
            targetFPS: this.targetFPS
        };
        localStorage.setItem('magic_crystal_settings', JSON.stringify(s));
    }
}
