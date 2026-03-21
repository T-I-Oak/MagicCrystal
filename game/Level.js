class Level {
    constructor(cols = 24, rows = 13) {
        this.cols = cols; this.rows = rows;
        this.data = new Array(rows).fill(0).map(() => new Array(cols).fill(0));
        // Initial load handled by game
    }
    loadStage(stageIndex) {
        // Bounds check
        if (stageIndex < 0) stageIndex = 0;
        if (stageIndex >= ALL_LEVELS.length) stageIndex = 0;

        const stageData = ALL_LEVELS[stageIndex];
        // Deep Copy to avoid modifying the constant
        this.data = stageData.map(row => [...row]);
    }
    getTile(x, y) { if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return 2; return this.data[y][x]; }
    setTile(x, y, id) { if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) this.data[y][x] = id; }
    serialize() { return JSON.stringify(this.data); }
    deserialize(json) {
        try {
            const loadedData = JSON.parse(json);
            if (loadedData.length === this.rows && loadedData[0].length === this.cols) {
                this.data = loadedData;
            } else {
                console.warn("Save data dimension mismatch (Old version?). Reseting to default.");
            }
        }
        catch (e) { console.error("Load Failed", e); }
    }
    applyEarthquake() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                // User Logic: Index 2(Dirt2/ID6) -> Dirt(1). Index 3(Rock2/ID7) -> Rock(2).
                if (this.data[y][x] === 6) this.data[y][x] = 1;
                else if (this.data[y][x] === 7) this.data[y][x] = 2;
            }
        }
    }
}

class LevelEditor {
    constructor(level) {
        this.level = level;
        this.cx = 4; // Cursor X
        this.cy = 4; // Cursor Y
        this.selectedTile = 1;
        this.cooldown = 0;
    }
    update(input) {
        if (this.cooldown > 0) this.cooldown--;

        // Movement using stick (includes arrow keys, WASD, and numpad)
        if (this.cooldown === 0) {
            const stick = input.stick;
            if (stick === 6 || stick === 3 || stick === 9) { // Right, Down-Right, Up-Right
                this.cx = Math.min(this.cx + 1, this.level.cols - 1);
                this.cooldown = 5;
            } else if (stick === 4 || stick === 1 || stick === 7) { // Left, Down-Left, Up-Left
                this.cx = Math.max(this.cx - 1, 0);
                this.cooldown = 5;
            }

            if (stick === 2 || stick === 1 || stick === 3) { // Down, Down-Left, Down-Right
                this.cy = Math.min(this.cy + 1, this.level.rows - 1);
                this.cooldown = 5;
            } else if (stick === 8 || stick === 7 || stick === 9) { // Up, Up-Left, Up-Right
                this.cy = Math.max(this.cy - 1, 0);
                this.cooldown = 5;
            }
        }

        // Tile Selection & Placement with regular number keys (not numpad)
        for (let i = 0; i <= 7; i++) {
            const digitKey = 'Digit' + i;
            if (input.keys[digitKey]) {
                this.selectedTile = i;
                this.placeTile(i); // Immediate Placement
            }
        }

        // A button: Place current item
        if (input.isJustPressed('jump')) {
            this.placeTile(this.selectedTile);
        }

        // Q (smartLeft): Cycle current item left
        if (input.isJustPressed('smartLeft')) {
            this.selectedTile = (this.selectedTile + 7) % 8; // -1 with wrap
        }

        // E (smartRight): Cycle current item right
        if (input.isJustPressed('smartRight')) {
            this.selectedTile = (this.selectedTile + 1) % 8;
        }
    }

    placeTile(tileId) {
        // Single Portal Rule
        if (tileId === 3) {
            // Placing New Portal -> Remove existing
            for (let y = 0; y < this.level.rows; y++) {
                for (let x = 0; x < this.level.cols; x++) {
                    if (this.level.getTile(x, y) === 3) this.level.setTile(x, y, 0);
                }
            }
            this.level.setTile(this.cx, this.cy, 3);
        } else {
            // Placing Other Tile -> Prevent overwriting Portal
            if (this.level.getTile(this.cx, this.cy) !== 3) {
                this.level.setTile(this.cx, this.cy, tileId);
            }
        }
    }
}
