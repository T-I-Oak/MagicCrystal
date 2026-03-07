class Assets {
    constructor() {
        this.tiles = {};
        this.player = {};
        this.cursor = null;
        this.loaded = false;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async load() {
        try {
            const ts = Date.now();

            // Placeholder methods if not already defined (or keep them inline if preferred, but method is cleaner)
            this.splitPlayer = this.splitPlayer || (async (img) => img);
            this.splitTiles = this.splitTiles || (async (img) => img);

            const loadImageTasks = [
                this.loadImage('assets/player.png?v=' + ts).then(img => this.splitPlayer(img)),
                this.loadImage('assets/tiles.png?v=' + ts).then(img => this.splitTiles(img)),
                this.loadImage('assets/title.png?v=' + ts).then(img => this.title = img)
            ];

            // Execute all loading tasks
            const [playerSheet, tileSheet] = await Promise.all(loadImageTasks);

            // Dynamic sizing
            let pSize = 40, tSize = 40;
            // Player: 3 frames wide. Tile: 4 frames wide.
            if (playerSheet.width > 300) pSize = playerSheet.width / 3;
            if (tileSheet.width > 300) tSize = tileSheet.width / 4;

            this.processPlayer(playerSheet, pSize);
            this.processTiles(tileSheet, tSize);

            this.createHelpers(); // Grid, Cursor etc.
            this.loaded = true;
        } catch (e) {
            console.error("Asset Load Failed", e);
            console.warn("Loading Failed. Using Procedural Fallback.");
            this.createProceduralAssets();
            this.createHelpers();
            this.loaded = true;
        }
    }

    createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return { c, ctx: c.getContext('2d') };
    }

    createProceduralAssets() {
        const size = 40;
        // Helper
        const createC = () => { const c = this.createCanvas(size, size); return c; };

        // --- Player ---
        this.player.standRight = createC().c;
        const ctxS = this.player.standRight.getContext('2d');
        ctxS.fillStyle = '#f00'; ctxS.fillRect(10, 5, 20, 30); // Body
        ctxS.fillStyle = '#000'; ctxS.fillRect(12, 10, 4, 4); ctxS.fillRect(22, 10, 4, 4); // Eyes

        this.player.standLeft = createC().c;
        const ctxSL = this.player.standLeft.getContext('2d');
        ctxSL.translate(size, 0); ctxSL.scale(-1, 1); ctxSL.drawImage(this.player.standRight, 0, 0);

        this.player.jumpRight = createC().c;
        const ctxJ = this.player.jumpRight.getContext('2d');
        ctxJ.drawImage(this.player.standRight, 0, -5); // Shift up

        this.player.jumpLeft = createC().c;
        const ctxJL = this.player.jumpLeft.getContext('2d');
        ctxJL.translate(size, 0); ctxJL.scale(-1, 1); ctxJL.drawImage(this.player.jumpRight, 0, 0);

        this.player.fallRight = createC().c;
        const ctxF = this.player.fallRight.getContext('2d');
        ctxF.drawImage(this.player.standRight, 0, 0); // Normal for now

        this.player.fallLeft = createC().c;
        const ctxFL = this.player.fallLeft.getContext('2d');
        ctxFL.translate(size, 0); ctxFL.scale(-1, 1); ctxFL.drawImage(this.player.fallRight, 0, 0);


        // --- Tiles ---
        // 1:Dirt, 2:Rock, 3:Portal, 4:Red, 5:Blue, 6:DirtT, 7:RockT
        const drawTile = (id, color, style = 'solid') => {
            const { c, ctx } = createC();
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, size, size);
            if (style === 'border') {
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.strokeRect(0, 0, size, size);
            }
            if (style === 'crack') {
                ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(15, 15); ctx.stroke();
            }
            if (style === 'portal') {
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(20, 20, 15, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#f0f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(20, 20, 10, 0, Math.PI * 2); ctx.stroke();
            }
            if (style === 'crystal') {
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(20, 20, 5, 0, Math.PI * 2); ctx.fill();
            }
            this.tiles[id] = c;
        };

        drawTile(1, '#8B4513'); // Dirt
        drawTile(2, '#808080', 'crack'); // Rock
        drawTile(3, '#4B0082', 'portal'); // Portal
        drawTile(4, '#ff0000', 'crystal'); // Red
        drawTile(5, '#0000ff', 'crystal'); // Blue
        drawTile(6, '#A0522D'); // Dirt2
        drawTile(7, '#696969'); // Rock2
    }

    processTiles(sheet, srcSize = 40) {
        // Layout: Linear ID 0-7 (Row 1: 0-3, Row 2: 4-7)
        const size = 40; // Target Size
        const mapping = [
            { x: 0, y: 0 }, // 0: Background
            { x: 1, y: 0 }, // 1: Dirt
            { x: 2, y: 0 }, // 2: Rock
            { x: 3, y: 0 }, // 3: Portal
            { x: 0, y: 1 }, // 4: Red
            { x: 1, y: 1 }, // 5: Blue
            { x: 2, y: 1 }, // 6: Dirt Trace
            { x: 3, y: 1 }, // 7: Rock Trace
            { x: 0, y: 2 }, // 8: Editor Cursor
        ];

        // Background (Index 0) - No transparency for background
        const { c: bgC, ctx: bgCtx } = this.createCanvas(size, size);
        bgCtx.drawImage(sheet, 0 * srcSize, 0 * srcSize, srcSize, srcSize, 0, 0, size, size);
        this.tiles[0] = bgC;

        for (let i = 1; i <= 8; i++) {
            const { c, ctx } = this.createCanvas(size, size);
            const pos = mapping[i];

            // Draw Base Tile
            ctx.drawImage(sheet, pos.x * srcSize, pos.y * srcSize, srcSize, srcSize, 0, 0, size, size);

            this.tiles[i] = c;
        }
    }

    processPlayer(sheet, srcSize = 40) {
        // Layout: 3x3 Grid (V2)
        // Row 1: Stand(0), Run1(1), Run2(2)
        // Row 2: Jump(3), Fall(4), Miss/Dead(5)
        // Row 3: DigDown(6), Cast/Earthquake(7), Win(8)

        const size = 40;
        const width = 3; // 3 columns

        // Helper to slice and mirror
        const createPose = (index, mirror) => {
            const { c, ctx } = this.createCanvas(size, size);
            const gx = index % width;
            const gy = Math.floor(index / width);

            ctx.save();
            if (mirror) {
                ctx.translate(size, 0);
                ctx.scale(-1, 1);
            }
            // Draw from Source Size -> Target Size (40)
            ctx.drawImage(sheet, gx * srcSize, gy * srcSize, srcSize, srcSize, 0, 0, size, size);

            ctx.restore();
            return c;
        };

        // Row 1: Movement
        this.player.standRight = createPose(0, false);
        this.player.standLeft = createPose(0, true);
        this.player.runRight = [createPose(1, false), createPose(2, false)];
        this.player.runLeft = [createPose(1, true), createPose(2, true)];

        // Row 2: Air / Loss
        this.player.jumpRight = createPose(3, false);
        this.player.jumpLeft = createPose(3, true);
        this.player.fallRight = createPose(4, false);
        this.player.fallLeft = createPose(4, true);
        this.player.miss = createPose(5, false); // No direction usually

        // Row 3: Action / Win
        this.player.digDownRight = createPose(6, false);
        this.player.digDownLeft = createPose(6, true);
        this.player.cast = createPose(7, false);
        this.player.life = this.player.cast; // Use 8th image (Index 7) as Life Icon
        this.player.win = createPose(8, false);
    }

    createHelpers() {
        // 0: Background Grid
        // Only trigger if tile[0] is missing (e.g. procedural mode)
        // Actually, preventing overwrite is safer.
        if (!this.tiles[0]) {
            const bg = this.createCanvas(40, 40);
            const bCtx = bg.ctx;
            bCtx.fillStyle = '#121212';
            bCtx.fillRect(0, 0, 40, 40);
            bCtx.strokeStyle = '#1a1a20';
            bCtx.lineWidth = 1;
            bCtx.strokeRect(0, 0, 40, 40);
            this.tiles[0] = bg.c;
        }

        // Editor Cursor - Use tile index 8 (9th tile in tiles.png)
        this.cursor = this.tiles[8];
    }

    getTile(id) { return this.tiles[id] || this.tiles[0]; }
}
