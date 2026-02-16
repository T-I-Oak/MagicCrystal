class Game {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.assets = assets; // Injected (Loaded)

        // HIGH RES UPDATE: 40x40 per tile
        this.tileWidth = 40;
        this.tileHeight = 40;
        this.cols = 24;
        this.rows = 13;

        this.canvas.width = this.cols * this.tileWidth;
        this.canvas.height = this.rows * this.tileHeight + 120; // 80px Header + 40px Footer

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
        this.titleCursor = 0;
        this.selectCursor = 0;
        this.selectMode = 'PLAY';

        // Settings
        this.padType = 0; // 0: Single, 1: Dual
        this.padPosX = 50; // 0-100%
        this.padPosY = 25;  // 0-100% (Default 25 to avoid off-screen)
        this.padSize = 100;
        this.screenSize = 100; // 50-100% Game Screen Scale
        this.loadSettings(); // Load saved settings
        this.updatePadLayout(); // Initial Apply

        // toDataURL removed to avoid SecurityError with local files
        this.crystalCount = 0;
        this.ES = 0;

        // Give Up Timer
        this.giveUpTimer = 0;
        this.giveUpMax = 60; // 1 sec hold
        this.selectExitTimer = 0; // Timer for exiting stage select
        this.howToPlayScroll = 0;

        console.log("GAME INIT");
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
            // SINGLE
            if (p2) p2.style.display = 'none';
            if (p1) {
                p1.style.display = 'grid';
                p1.style.position = 'absolute';

                // Position represents the CENTER of the pad
                p1.style.left = `${this.padPosX}%`;
                p1.style.bottom = `${this.padPosY}%`;

                // Translate -50% X to align center to the left% coordinate
                // Translate Y based on bottom (if we want bottom handle to be consistent?)
                // Handle is in center of grid. Grid is mostly centered.
                // Let's align center-center of pad to the coordinate.
                // We use bottom for Y-positioning generally?
                // If padPosY is 0 (bottom edge), handle is at bottom edge.
                // Let's use generic Translate -50%, 50% relative to bottom-left origin?
                // Actually: transform origin is center?
                // transform-origin: top left (default).
                // Let's stick to: left/bottom are coordinates of the CENTER.
                p1.style.transform = `translate(-50%, 50%) scale(${s})`;
                // Wait, if bottom=0%, we want bottom of pad at bottom of screen?
                // Or Handle at bottom of screen?
                // If Handle is center, and bottom=0, Handle is at bottom. Half pad is cut off.
                // This gives full freedom.
            }
        } else {
            // DUAL
            if (p2) p2.style.display = 'grid';
            if (p1) p1.style.display = 'grid';

            // padPosX represents distance of CENTER from the nearest EDGE
            // 0 = Center is at Edge. 50 = Center is at Screen Center.
            // visualPosX is clamped to avoided crossing? User can decide overlap.

            const dist = this.padPosX;
            const bottom = this.padPosY;

            if (p1) {
                p1.style.position = 'absolute';
                p1.style.left = `${dist}%`; // From Left
                p1.style.bottom = `${bottom}%`;
                p1.style.transform = `translate(-50%, 50%) scale(${s})`;
            }

            if (p2) {
                p2.style.position = 'absolute';
                p2.style.right = `${dist}%`; // From Right
                p2.style.bottom = `${bottom}%`;
                p2.style.transform = `translate(50%, 50%) scale(${s})`;
                // Note: right: X%. translate 50% moves it Right (away from center).
                // If dist=0 (Right Edge), right=0. translate 50% moves Center to Right Edge?
                // No. right:0 aligns Right Edge of element to Right Edge of container.
                // translate(50%) moves it right by 50% width. Center is at Edge.
                // Correct.
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
        console.log("Level Saved");
    }

    loadLevel() {
        const data = localStorage.getItem('magic_crystal_level');
        if (data) {
            this.level.deserialize(data);
            this.resetPlayer();
            console.log("Level Loaded");
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
            this.input.updateState(); // Poll Input
            this.update(); // Update Logic

            // Reset Input Flags
            this.input.prevUp = this.input.keys.ArrowUp || this.input.keys.w || this.input.keys['8'];
            this.input.prevDown = this.input.keys.ArrowDown || this.input.keys.s || this.input.keys['2'];
            this.input.prevLeft = this.input.keys.ArrowLeft || this.input.keys.a || this.input.keys['4'];
            this.input.prevRight = this.input.keys.ArrowRight || this.input.keys.d || this.input.keys['6'];
            this.input.prevGiveUp = this.input.giveUp; // Track abstract input
            this.input.prevJump = this.input.jump;
            this.input.prevConfirm = this.input.confirm;
            this.input.prevSmartLeft = this.input.smartLeft;
            this.input.prevSmartRight = this.input.smartRight;

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
            case 'HOW_TO_PLAY': this.updateHowToPlay(); break;
            case 'SELECT': this.updateSelect(); break;
            case 'WAIT_START': break; // Wait for timer (handled in update top)
            case 'PLAY': this.updatePlay(); break;
            case 'EDITOR':
                // Use giveUp (x key or Numpad3) for exit
                if (this.input.giveUp && !this.input.prevGiveUp) { this.state = 'SELECT'; }
                else { this.editor.update(this.input); }
                break;
            case 'GAMEOVER': if (this.input.confirm && !this.input.prevConfirm) this.state = 'TITLE'; break;
            case 'ALLCLEAR': if (this.input.confirm && !this.input.prevConfirm) this.state = 'TITLE'; break;
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
        const up = (this.input.keys.ArrowUp || this.input.keys.w || this.input.keys['8']) && !this.input.prevUp;
        const down = (this.input.keys.ArrowDown || this.input.keys.s || this.input.keys['2']) && !this.input.prevDown;

        if (down) this.titleCursor = (this.titleCursor + 1) % 8;
        if (up) this.titleCursor = (this.titleCursor + 7) % 8; // +7 is -1

        // Update Drag Handle Visibility
        const handles = document.querySelectorAll('.drag-handle');
        const showHandle = (this.titleCursor === 5);
        handles.forEach(h => {
            if (showHandle) h.classList.add('visible');
            else h.classList.remove('visible');
        });

        // Adjustment (Left/Right)
        const left = (this.input.keys.ArrowLeft || this.input.keys.a || this.input.keys['4']) && !this.input.prevLeft;
        const right = (this.input.keys.ArrowRight || this.input.keys.d || this.input.keys['6']) && !this.input.prevRight;

        // Fast adjust hold
        const holdLeft = (this.input.keys.ArrowLeft || this.input.keys.a || this.input.keys['4']);
        const holdRight = (this.input.keys.ArrowRight || this.input.keys.d || this.input.keys['6']);

        if (this.titleCursor === 3) {
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
        } else if (this.titleCursor === 4) {
            // PAD TYPE
            if (left || right) {
                if (this.padType === 0) {
                    // Switch to DUAL: If currently centered (50%), move to edge (15%)
                    this.padType = 1;
                    if (this.padPosX === 50) this.padPosX = 15;
                } else {
                    // Switch to SINGLE: If currently at edge (15%), move to center (50%)
                    this.padType = 0;
                    if (this.padPosX === 15) this.padPosX = 50;
                }
                this.updatePadLayout();
                this.saveSettings();
            }
        } else if (this.titleCursor === 5) {
            // PAD POS (Drag Only)
            const handles = document.querySelectorAll('.drag-handle');
            handles.forEach(h => h.classList.add('visible'));
        } else if (this.titleCursor === 6) {
            // PAD SIZE (Reset handles if passing through)
            document.querySelectorAll('.drag-handle').forEach(h => h.classList.remove('visible'));

            if (holdLeft) this.padSize = Math.max(50, this.padSize - 1);
            if (holdRight) this.padSize = Math.min(150, this.padSize + 1);
            if (holdLeft || holdRight) {
                this.updatePadLayout();
                this.saveSettings();
            }
        } else if (this.titleCursor === 7) {
            // SCREEN SIZE
            if (holdLeft) this.screenSize = Math.max(50, this.screenSize - 1);
            if (holdRight) this.screenSize = Math.min(100, this.screenSize + 1);
            if (holdLeft || holdRight) {
                window.dispatchEvent(new Event('resize'));
                this.saveSettings();
            }
        }

        if (this.input.confirm && !this.input.prevConfirm) {
            // Hide handles when leaving title (start game)
            const handles = document.querySelectorAll('.drag-handle');
            handles.forEach(h => h.classList.remove('visible'));

            if (this.titleCursor === 0) {
                this.selectMode = 'PLAY';
                this.lives = 3;
                this.clearedStages = new Array(50).fill(false); // Reset Progress
                this.state = 'SELECT';
            } else if (this.titleCursor === 1) {
                this.selectMode = 'EDIT';
                this.state = 'SELECT';
            } else if (this.titleCursor === 2) {
                this.howToPlayScroll = 0;
                this.state = 'HOW_TO_PLAY';
            }
        }
    }

    updateHowToPlay() {
        if (this.input.confirm && !this.input.prevConfirm) {
            this.state = 'TITLE';
        }
        if (this.input.giveUp && !this.input.prevGiveUp) {
            this.state = 'TITLE';
        }

        // Scrolling
        const speed = 15;
        if (this.input.keys.ArrowDown || this.input.keys.s || this.input.keys['2']) {
            this.howToPlayScroll += speed;
        }
        if (this.input.keys.ArrowUp || this.input.keys.w || this.input.keys['8']) {
            this.howToPlayScroll -= speed;
        }

        // Clamp (Max scroll will create gaps at bottom to ensure reading, dynamic based on content is hard so we guess)
        // Content height extended to ~1700px. Viewport is 420px.
        // Max scroll: 1700 - 400 = 1300. Set to 1400 for safety.
        this.howToPlayScroll = Math.max(0, Math.min(this.howToPlayScroll, 1400));
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

        const left = (this.input.keys.ArrowLeft || this.input.keys.a || this.input.keys['4']) && !this.input.prevLeft;
        const right = (this.input.keys.ArrowRight || this.input.keys.d || this.input.keys['6']) && !this.input.prevRight;
        const up = (this.input.keys.ArrowUp || this.input.keys.w || this.input.keys['8']) && !this.input.prevUp;
        const down = (this.input.keys.ArrowDown || this.input.keys.s || this.input.keys['2']) && !this.input.prevDown;

        if (right) this.selectCursor = (this.selectCursor + 1) % 50;
        if (left) this.selectCursor = (this.selectCursor + 49) % 50;
        if (down) this.selectCursor = (this.selectCursor + 10) % 50;
        if (up) this.selectCursor = (this.selectCursor + 40) % 50;

        if (this.input.confirm && !this.input.prevConfirm) {
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
        this.physics.update(this.player, this.level, this.input, this);
        if (this.ES > 0) this.ES--;
        if (this.ES === 1) this.level.applyEarthquake();

        // Long Press Give Up
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
            console.log("MISS!");
            this.state = 'WAIT_MISS';
            this.stateTimer = 1.0;
        } else {
            console.log("GAME OVER!");
            this.state = 'WAIT_GAMEOVER';
            this.stateTimer = 3.0; // 3 Seconds
        }
        this.running = true;
    }

    handleLevelClear() {
        console.log("LEVEL CLEAR");
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
                if (s.padSize !== undefined) this.padSize = s.padSize;
                if (s.screenSize !== undefined) this.screenSize = s.screenSize;
                if (s.targetFPS !== undefined) {
                    this.targetFPS = s.targetFPS;
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
