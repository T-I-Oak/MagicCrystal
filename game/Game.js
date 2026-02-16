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
        this.padMode = 1; // 0:Left, 1:Center, 2:Right, 3:Dual
        this.padSize = 100;
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

        ctrl.className = ''; // Reset Container
        ctrl.style.transform = ''; // Remove container scale

        // Reset Child Transforms
        if (p1) { p1.style.transform = ''; p1.style.transformOrigin = ''; }
        if (p2) { p2.style.transform = ''; p2.style.transformOrigin = ''; }

        const scale = `scale(${this.padSize / 100})`;

        if (this.padMode === 0) {
            // LEFT
            ctrl.classList.add('mode-left');
            if (p1) {
                p1.style.transformOrigin = 'top left';
                p1.style.transform = scale;
            }
        } else if (this.padMode === 1) {
            // CENTER
            ctrl.classList.add('mode-center');
            if (p1) {
                p1.style.transformOrigin = 'top center';
                p1.style.transform = scale;
            }
        } else if (this.padMode === 2) {
            // RIGHT
            ctrl.classList.add('mode-right');
            if (p1) {
                p1.style.transformOrigin = 'top right';
                p1.style.transform = scale;
            }
        } else if (this.padMode === 3) {
            // DUAL
            ctrl.classList.add('mode-dual');
            if (p1) {
                p1.style.transformOrigin = 'top left';
                p1.style.transform = scale;
            }
            if (p2) {
                p2.style.transformOrigin = 'top right';
                p2.style.transform = scale;
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

        if (down) this.titleCursor = (this.titleCursor + 1) % 6;
        if (up) this.titleCursor = (this.titleCursor + 5) % 6; // +5 is -1

        // Adjustment (Left/Right)
        const left = (this.input.keys.ArrowLeft || this.input.keys.a || this.input.keys['4']) && !this.input.prevLeft;
        const right = (this.input.keys.ArrowRight || this.input.keys.d || this.input.keys['6']) && !this.input.prevRight;

        if (this.titleCursor === 3) {
            // SPEED
            if (left) {
                this.targetFPS = Math.max(10, this.targetFPS - 5);
                this.deltaTime = 1000 / this.targetFPS;
            }
            if (right) {
                this.targetFPS = Math.min(60, this.targetFPS + 5);
                this.deltaTime = 1000 / this.targetFPS;
            }
        } else if (this.titleCursor === 4) {
            // PAD TYPE
            if (left) {
                this.padMode = (this.padMode + 3) % 4; // -1
                this.updatePadLayout();
            }
            if (right) {
                this.padMode = (this.padMode + 1) % 4;
                this.updatePadLayout();
            }
        } else if (this.titleCursor === 5) {
            // PAD SIZE
            if (left) this.padSize = Math.max(50, this.padSize - 10);
            if (right) this.padSize = Math.min(150, this.padSize + 10);
            if (left || right) this.updatePadLayout();
        }

        if (this.input.confirm && !this.input.prevConfirm) {
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
}
