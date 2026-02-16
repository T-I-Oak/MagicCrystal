class Renderer {
    constructor(ctx, assets) {
        this.ctx = ctx; this.assets = assets;
        this.tileWidth = 40; this.tileHeight = 40;
        this.shakeX = 0;
        this.shakeY = 0;
    }
    render(level, player, editor, state, ES, game) {
        // Clear
        this.ctx.fillStyle = '#000'; this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (state === 'TITLE') {
            this.drawTitle(game);
            return;
        }
        if (state === 'HOW_TO_PLAY') {
            this.drawHowToPlay(game);
            return;
        }
        if (state === 'SELECT') {
            this.drawSelect(game);
            return;
        }





        // === PLAY / EDITOR ===
        // Draw Header Background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, 80);

        // Draw Header Separator
        this.ctx.strokeStyle = '#333';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 80);
        this.ctx.lineTo(this.ctx.canvas.width, 80);
        this.ctx.stroke();

        this.ctx.save();
        this.ctx.save();
        this.ctx.translate(this.shakeX, this.shakeY + 80); // Offset for Header (80px)

        // Draw Level
        this.drawLevel(level);

        // Editor Cursor
        if (state === 'EDITOR') {
            this.ctx.drawImage(this.assets.cursor, editor.cx * this.tileWidth, editor.cy * this.tileHeight, this.tileWidth, this.tileHeight);
            // Remove old Editor text from here, will render in HUD area
        }

        this.ctx.restore();

        // Draw Player & HUD (HUD is now in Header, Player is game-world relative so we need to handle that carefully)
        // Actually, Player needs to be drawn IN the translated context above.

        if (state === 'PLAY') {
            this.ctx.save();
            this.ctx.translate(this.shakeX, this.shakeY + 80);
            this.drawPlayer(player);
            this.ctx.restore();
        } else if (state === 'WAIT_START') {
            this.ctx.save();
            this.ctx.translate(this.shakeX, this.shakeY + 80);
            // Force Stand Pose (ignore movement)
            const px = player.x * 10;
            const py = player.y * 10;
            const sprite = player.faceRight ? this.assets.player.standRight : this.assets.player.standLeft;
            this.ctx.drawImage(sprite, px, py);
            this.ctx.restore();
        } else if (state === 'WAIT_MISS' || state === 'GAMEOVER' || state === 'WAIT_GAMEOVER') {
            this.ctx.save();
            this.ctx.translate(this.shakeX, this.shakeY + 80);
            this.drawSpecialPlayer(player, 'MISS');
            this.ctx.restore();
        } else if (state === 'WAIT_CLEAR' || state === 'ALLCLEAR') {
            this.ctx.save();
            this.ctx.translate(this.shakeX, this.shakeY + 80);
            this.drawSpecialPlayer(player, 'WIN');
            this.ctx.restore();
        }

        // HUD Update (Header Area)
        if (state === 'PLAY' || state === 'WAIT_START') {
            this.ctx.save();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px monospace'; // Scaled Font (20 -> 30+)
            this.ctx.textAlign = 'left';

            // Draw Lives
            const hudX = 20;
            const hudY = 20;
            if (game.lives < 6) {
                for (let i = 0; i < game.lives; i++) {
                    this.ctx.drawImage(this.assets.player.life, hudX + i * 45, hudY, 40, 40);
                }
            } else {
                this.ctx.drawImage(this.assets.player.life, hudX, hudY, 40, 40);
                this.ctx.fillText("x " + game.lives, hudX + 50, hudY + 32);
            }

            // Draw Crystals (Red and Blue Separately)
            const rCrystal = this.assets.getTile(4); // ID=4
            const bCrystal = this.assets.getTile(5); // ID=5 (Blue)

            // Count Crystals from Map
            let rCount = 0;
            let bCount = 0;
            if (level) {
                for (let y = 0; y < level.rows; y++) {
                    for (let x = 0; x < level.cols; x++) {
                        const t = level.getTile(x, y);
                        if (t === 4) rCount++;
                        if (t === 5) bCount++;
                    }
                }
            }

            // Draw Red
            let currentX = hudX + (game.lives < 6 ? game.lives * 45 + 30 : 150);

            if (rCount > 0) {
                this.ctx.drawImage(rCrystal, currentX, hudY, 40, 40);
                this.ctx.fillText("x " + rCount, currentX + 50, hudY + 32);
                currentX += 120;
            }

            // Draw Blue
            if (bCount > 0) {
                this.ctx.drawImage(bCrystal, currentX, hudY, 40, 40);
                this.ctx.fillText("x " + bCount, currentX + 50, hudY + 32);
            }

            // Draw Stage Number (Right side)
            this.ctx.textAlign = 'right';
            this.ctx.font = '35px monospace';
            this.ctx.fillText("STAGE " + (game.stage + 1), this.ctx.canvas.width - 20, hudY + 35);

            this.ctx.restore();
        }

        if (state === 'EDITOR') {
            this.ctx.save();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText("EDITOR MODE", 10, 28);

            // Tile placement guide
            this.ctx.font = '16px monospace';
            const tileNames = ['空白', '土', '岩', 'ポータル', '回帰の紅晶', '固定の蒼晶', '土の記憶', '岩の記憶'];
            const guideX = 200;
            const guideY = 15;

            for (let i = 0; i < 8; i++) {
                const gx = guideX + (i % 4) * 200;
                const gy = guideY + Math.floor(i / 4) * 25;

                // Highlight current item
                const isCurrent = (game.editor.selectedTile === i);

                // Draw tile icon
                this.ctx.drawImage(this.assets.getTile(i), gx, gy, 20, 20);

                // Draw text (bright if current, dim otherwise)
                this.ctx.fillStyle = isCurrent ? '#fff' : '#666';
                this.ctx.fillText(`${i}: ${tileNames[i]}`, gx + 25, gy + 15);
            }

            this.ctx.restore();
        }

        // Footer (Information Area)
        const footerY = this.ctx.canvas.height - 40;

        // Frame Background
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, footerY, this.ctx.canvas.width, 40);

        // Timer/Bar Frame
        const barX = 20;
        const barY = footerY + 10;
        const barW = 600;
        const barH = 20;

        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barW, barH); // Frame

        // Earthquake Bar
        if (ES > 0) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            const fillW = (barW * ES) / 60;
            this.ctx.fillRect(barX, barY, fillW, barH);
        }

        // Give Up Progress
        if (game.giveUpTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.6)'; // Cyan
            const fillW = (barW * game.giveUpTimer) / game.giveUpMax;
            this.ctx.fillRect(barX, barY, fillW, barH);
        }

        // Retire Text
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'left';
        if (state === 'EDITOR') {
            this.ctx.fillText("X (B): BACK", barX + barW + 20, barY + 16);
        } else {
            this.ctx.fillText("X (B) 長押し: リタイア", barX + barW + 20, barY + 16);
        }

        // Overlays
        if (state === 'WAIT_CLEAR') {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = '80px monospace';
            this.ctx.strokeStyle = '#000'; this.ctx.lineWidth = 4;
            this.ctx.strokeText("Clear!!", 320, 280);
            this.ctx.fillText("Clear!!", 320, 280);
        }
        if (state === 'WAIT_MISS') {
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '80px monospace';
            this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 4;
            this.ctx.strokeText("Miss!!", 340, 280);
            this.ctx.fillText("Miss!!", 340, 280);
        }
        if (state === 'WAIT_GAMEOVER' || state === 'GAMEOVER') {
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '80px monospace';
            this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 4;
            this.ctx.strokeText("GAME OVER", 280, 280);
            this.ctx.fillText("GAME OVER", 280, 280);
        }

        if (state === 'WAIT_START') {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000'; this.ctx.lineWidth = 4;
            this.ctx.strokeText("STAGE " + (game.stage + 1), 480, 260); // Outline
            this.ctx.fillText("STAGE " + (game.stage + 1), 480, 260);
            this.ctx.textAlign = 'start';
        }
    }

    drawLevel(level) {
        for (let y = 0; y < level.rows; y++) {
            for (let x = 0; x < level.cols; x++) {
                const tileId = level.getTile(x, y);
                this.ctx.drawImage(this.assets.getTile(0), x * this.tileWidth, y * this.tileHeight);
                if (tileId !== 0) {
                    this.ctx.drawImage(this.assets.getTile(tileId), x * this.tileWidth, y * this.tileHeight);
                }
            }
        }
    }

    drawPlayer(player) {
        const px = player.x * 10;
        const py = player.y * 10;
        let sprite;

        // Check local player state first
        if (player.isDigging) {
            // Digging (Down)
            sprite = player.faceRight ? this.assets.player.digDownRight : this.assets.player.digDownLeft;
        } else if (player.jumpState > 0) {
            // Jump/Fall/Air
            if (player.sy < 0) sprite = player.faceRight ? this.assets.player.jumpRight : this.assets.player.jumpLeft;
            else if (player.sy > 0) sprite = player.faceRight ? this.assets.player.fallRight : this.assets.player.fallLeft;
            else {
                // Suspended in air or just started jump
                sprite = player.faceRight ? this.assets.player.jumpRight : this.assets.player.jumpLeft;
            }
        } else {
            // Ground / Run
            if (player.sx !== 0) {
                // Running: Cycle Speed based on X
                const frame = Math.floor(Date.now() / 100) % 2; // 100ms per frame
                if (player.faceRight) sprite = this.assets.player.runRight[frame];
                else sprite = this.assets.player.runLeft[frame];
            } else {
                // Stand
                sprite = player.faceRight ? this.assets.player.standRight : this.assets.player.standLeft;
            }
        }

        this.ctx.drawImage(sprite, px, py);
    }

    // New helper to draw special states (Loss, Win) called from render() main loop explicitly
    drawSpecialPlayer(player, type) {
        const px = player.x * 10;
        const py = player.y * 10;
        let sprite;

        if (type === 'MISS') sprite = this.assets.player.miss;
        else if (type === 'WIN') sprite = this.assets.player.win;
        else if (type === 'CAST') sprite = this.assets.player.cast;
        else sprite = this.assets.player.standRight;

        this.ctx.drawImage(sprite, px, py);
    }

    drawTitle(game) {
        // Draw Background Image
        if (this.assets.title) {
            this.ctx.drawImage(this.assets.title, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        } else {
            // Fallback
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '60px monospace';
            this.ctx.fillText("MAGIC CRYSTAL", 260, 150);
        }

        // Draw Menu Items (Overlay)
        // Add semi-transparent box for readability
        // Move down to avoid overlapping the central Logo
        const menuBaseY = 270;
        const boxHeight = 280;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(260, menuBaseY, 440, boxHeight); // Background for menu

        this.ctx.textAlign = 'center'; // Center text properly

        this.ctx.font = '30px monospace';

        // 0: PLAY
        this.ctx.fillStyle = game.titleCursor === 0 ? '#ff0' : '#888';
        this.ctx.fillText("GAME PLAY", 480, menuBaseY + 40);

        // 1: EDIT
        this.ctx.fillStyle = game.titleCursor === 1 ? '#ff0' : '#888';
        this.ctx.fillText("MAP EDITOR", 480, menuBaseY + 75);

        // 2: HOW TO PLAY
        this.ctx.fillStyle = game.titleCursor === 2 ? '#ff0' : '#888';
        this.ctx.fillText("HOW TO PLAY", 480, menuBaseY + 110);

        // Settings (Smaller font)
        this.ctx.font = '20px monospace';

        // 3: SPEED Option
        this.ctx.fillStyle = game.titleCursor === 3 ? '#ff0' : '#888';
        const speedText = `SPEED: ${game.targetFPS} FPS${game.titleCursor === 3 ? ' < >' : ''}`;
        this.ctx.fillText(speedText, 480, menuBaseY + 150);

        // 4: PAD TYPE Option
        this.ctx.fillStyle = game.titleCursor === 4 ? '#ff0' : '#888';
        const typeStr = game.padType === 0 ? "SINGLE" : "DUAL";
        const typeText = `PAD TYPE: ${typeStr}${game.titleCursor === 4 ? ' < >' : ''}`;
        this.ctx.fillText(typeText, 480, menuBaseY + 180);

        // 5: PAD POS
        this.ctx.fillStyle = game.titleCursor === 5 ? '#ff0' : '#888';
        const posText = `PAD POS: DRAG ●${game.titleCursor === 5 ? ' < >' : ''}`;
        this.ctx.fillText(posText, 480, menuBaseY + 205);

        // 6: SIZE Option
        this.ctx.fillStyle = game.titleCursor === 6 ? '#ff0' : '#888';
        const sizeText = `PAD SIZE: ${game.padSize}%${game.titleCursor === 6 ? ' < >' : ''}`;
        this.ctx.fillText(sizeText, 480, menuBaseY + 230);

        // 7: SCREEN SIZE Option
        this.ctx.fillStyle = game.titleCursor === 7 ? '#ff0' : '#888';
        const screenText = `SCREEN SIZE: ${game.screenSize}%${game.titleCursor === 7 ? ' < >' : ''}`;
        this.ctx.fillText(screenText, 480, menuBaseY + 255);

        this.ctx.textAlign = 'start'; // Reset for other draws
    }

    drawHowToPlay(game) {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.save();

        // Header (Fixed)
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.font = '30px monospace';
        this.ctx.fillText("- HOW TO PLAY -", 480, 40);
        this.ctx.strokeStyle = '#333';
        this.ctx.beginPath(); this.ctx.moveTo(0, 60); this.ctx.lineTo(960, 60); this.ctx.stroke();

        // Footer (Fixed)
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 480, this.ctx.canvas.width, 40);
        this.ctx.fillStyle = '#888';
        this.ctx.font = '20px monospace';
        this.ctx.fillText("Press A / B / Enter to Return", 480, 505);

        // Content Area (Clipped & Scrolled)
        this.ctx.beginPath();
        this.ctx.rect(0, 60, this.ctx.canvas.width, 420);
        this.ctx.clip();

        this.ctx.translate(0, -game.howToPlayScroll + 80); // Start content a bit lower

        this.ctx.textAlign = 'left';
        let y = 0;
        const x = 100;
        const gap = 30;

        // === PROLOGUE ===
        this.ctx.fillStyle = '#ddd'; this.ctx.font = '24px monospace';
        this.ctx.fillText("■ プロローグ", x - 20, y); y += 40;
        this.ctx.fillStyle = '#ddd'; this.ctx.font = '20px monospace';
        this.ctx.fillText("魔導師見習いのあなたは、師匠の言いつけで", x, y); y += gap;
        this.ctx.fillText("「魔力の結晶」を集めることになりました。", x, y); y += gap;
        this.ctx.fillText("結晶に秘められた力は、大地の記憶そのものを操ります。", x, y); y += gap;
        this.ctx.fillText("赤と青、ふたつの魔力を使い分け、", x, y); y += gap;
        this.ctx.fillText("変化し続ける大地を乗り越えましょう。", x, y); y += 50;

        // === OBJECTIVE ===
        this.ctx.fillStyle = '#ffcc00'; this.ctx.font = '24px monospace';
        this.ctx.fillText("■ 目的", x - 20, y); y += 40;
        this.ctx.fillStyle = '#fff';
        this.ctx.drawImage(this.assets.getTile(3), x, y - 25, 40, 40); // Portal
        this.ctx.fillText("ステージ上のすべての結晶を集めた状態で", x + 50, y); y += gap;
        this.ctx.fillText("「ポータル」に到達すればクリアです。", x + 50, y); y += 50;

        // === TERRAIN ===
        this.ctx.fillStyle = '#ffcc00'; this.ctx.font = '24px monospace';
        this.ctx.fillText("■ 地形", x - 20, y); y += 40;

        // === PORTAL ===
        this.ctx.drawImage(this.assets.getTile(3), x, y - 25, 40, 40);
        this.ctx.fillStyle = '#f156f1ff';
        this.ctx.fillText("ポータル", x + 50, y); y += gap;
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText("ステージの開始地点であり、帰還地点でもある魔法装置です。", x + 50, y); y += gap;
        this.ctx.fillText("すべてのクリスタルを集めた状態で、", x + 50, y); y += gap;
        this.ctx.fillText("再びこのポータルに戻ることでステージクリアとなります。", x + 50, y); y += gap;
        this.ctx.fillText("探索の終わりは、いつも始まりの場所です。", x + 50, y); y += 40;

        // === RED CRYSTAL ===
        this.ctx.drawImage(this.assets.getTile(4), x, y - 25, 40, 40);
        this.ctx.fillStyle = '#ff8888';
        this.ctx.fillText("回帰の紅晶", x + 50, y); y += gap;
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText("周囲の「過去の記憶」を呼び戻す魔力が秘められた結晶です。", x + 50, y); y += gap;
        this.ctx.fillText("取得すると、カウントダウン後に壊れた地形が元に戻ります。", x + 50, y); y += gap;
        this.ctx.fillText("カウントダウン中に次の回帰の紅晶を取ると、", x + 50, y); y += gap;
        this.ctx.fillText("地形変化までの時間が【延長】されます。", x + 50, y); y += gap;
        this.ctx.fillText("取得後、その場所は「土の記憶」へと変化します。", x + 50, y); y += 40;

        // === BLUE CRYSTAL ===
        this.ctx.drawImage(this.assets.getTile(5), x, y - 25, 40, 40);
        this.ctx.fillStyle = '#8888ff';
        this.ctx.fillText("固定の蒼晶", x + 50, y); y += gap;
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText("時間変化を拒絶する魔力が秘められた結晶です。", x + 50, y); y += gap;
        this.ctx.fillText("カウントダウン中に取得すると、", x + 50, y); y += gap;
        this.ctx.fillText("地形変化までの時間が【クリア】されます。", x + 50, y); y += gap;
        this.ctx.fillText("取得後、その場所は「岩の記憶」へと変化します。", x + 50, y); y += 40;


        // === SOIL ===
        this.ctx.drawImage(this.assets.getTile(1), x, y - 25, 40, 40);
        this.ctx.fillStyle = '#ce8059ff';
        this.ctx.fillText("土", x + 50, y); y += gap;
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText("壊すことができる地形です。", x + 50, y); y += gap;
        this.ctx.fillText("回帰の紅晶の影響下では、", x + 50, y); y += gap;
        this.ctx.fillText("カウントダウン後に元の形へ復活します。", x + 50, y); y += 40;

        // === ROCK ===
        this.ctx.drawImage(this.assets.getTile(2), x, y - 25, 40, 40);
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.fillText("岩", x + 50, y); y += gap;
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText("壊すことができない地形です。", x + 50, y); y += gap;
        this.ctx.fillText("記憶が完全に固定された、大地の最終形態です。", x + 50, y); y += gap;
        this.ctx.fillText("一度岩になると、二度と変化しません。", x + 50, y); y += 40;

        // === SOIL MEMORY ===
        this.ctx.drawImage(this.assets.getTile(6), x, y - 25, 40, 40);
        this.ctx.fillStyle = '#cfa07a';
        this.ctx.fillText("土の記憶", x + 50, y); y += gap;
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText("回帰の紅晶の力によって残された地形です。", x + 50, y); y += gap;
        this.ctx.fillText("カウントダウンが終了すると、", x + 50, y); y += gap;
        this.ctx.fillText("かつて存在していた「土」として復活します。", x + 50, y); y += gap;
        this.ctx.fillText("赤の魔力が続く限り、何度でも再生します。", x + 50, y); y += 40;

        // === ROCK MEMORY ===
        this.ctx.drawImage(this.assets.getTile(7), x, y - 25, 40, 40);
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.fillText("岩の記憶", x + 50, y); y += gap;
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText("固定の蒼晶の力によって変質した地形です。", x + 50, y); y += gap;
        this.ctx.fillText("時間の流れが完全に固定されています。", x + 50, y); y += gap;
        this.ctx.fillText("この地形は二度と変化せず、", x + 50, y); y += gap;
        this.ctx.fillText("破壊も再生も起こりません。", x + 50, y); y += 40;

        // === LIFE ===
        this.ctx.fillStyle = '#ffcc00'; this.ctx.font = '24px monospace';
        this.ctx.fillText("■ ライフ", x - 20, y); y += 40;

        this.ctx.drawImage(this.assets.player.life, x, y - 25, 40, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText("ライフの仕組み", x + 50, y); y += gap;

        this.ctx.fillStyle = '#ddd'; this.ctx.font = '20px monospace';
        this.ctx.fillText("初期ライフは3で、0になるとゲームオーバーです。", x + 50, y); y += gap;
        this.ctx.fillText("ステージをクリアするたびにライフが1つ増えます。（最大9）", x + 50, y); y += gap;

        // === CONTROLS ===
        this.ctx.fillStyle = '#ffcc00'; this.ctx.font = '24px monospace';
        this.ctx.fillText("■ 操作方法", x - 20, y); y += 40;

        this.ctx.fillStyle = '#fff';
        // Player Icon
        this.ctx.drawImage(this.assets.player.standRight, x, y - 25, 40, 40);
        this.ctx.fillText("キーボード / タッチ", x + 50, y); y += 40;

        const ctrlX = x + 50;
        this.ctx.fillStyle = '#ccc';
        this.ctx.fillText("移動　　　 : 矢印キー / 十字キー", ctrlX, y); y += gap;
        this.ctx.fillText("ジャンプ　 : Z / Aボタン", ctrlX, y); y += gap;
        this.ctx.fillText("穴掘り/魔法: X / Bボタン", ctrlX, y); y += gap;
        this.ctx.fillText("ギブアップ : X長押し", ctrlX, y); y += gap;

        this.ctx.restore();
    }

    drawSelect(game) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px monospace';

        const modeStr = (game.selectMode === 'PLAY') ? "SELECT STAGE" : "SELECT STAGE (EDITOR)";
        this.ctx.fillText(modeStr, 280, 40);

        if (game.selectMode === 'PLAY') {
            const lx = 600;
            const ly = 5;
            if (game.lives < 6) {
                for (let i = 0; i < game.lives; i++) {
                    this.ctx.drawImage(this.assets.player.life, lx + i * 45, ly, 40, 40);
                }
            } else {
                this.ctx.drawImage(this.assets.player.life, lx, ly, 40, 40);
                this.ctx.fillStyle = '#fff'; this.ctx.font = '30px monospace';
                this.ctx.fillText("x " + game.lives, lx + 50, ly + 30);
            }
        } else {
            // EDITOR mode - No tile guide here (moved to editor screen)
        }

        // Footer with Progress Bar (Always visible frame)
        const barX = 20;
        const barY = this.ctx.canvas.height - 40;
        const barW = 600;
        const barH = 20;

        // Frame (Always drawn)
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barW, barH);

        // Fill (Only when holding)
        if (game.selectExitTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
            const fillW = (barW * game.selectExitTimer) / game.giveUpMax;
            this.ctx.fillRect(barX, barY, fillW, barH);
        }

        // Instruction Text (Right of bar) - Both modes use long press
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText("X (B) 長押し: BACK", barX + barW + 20, barY + 16);

        const startX = 60;
        const startY = 80;
        const gapX = 85;
        const gapY = 85;

        for (let i = 0; i < 50; i++) {
            const col = i % 10;
            const row = Math.floor(i / 10);
            const dx = startX + col * gapX;
            const dy = startY + row * gapY;

            this.ctx.strokeStyle = (i === game.selectCursor) ? '#ff0' : '#444';
            this.ctx.lineWidth = (i === game.selectCursor) ? 3 : 1;
            this.ctx.strokeRect(dx - 2, dy - 2, 76, 43);

            this.drawMiniMap(i, dx, dy);

            // Dim if cleared
            if (game.clearedStages[i] && game.selectMode === 'PLAY') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(dx, dy, 72, 39);

                this.ctx.fillStyle = '#ff0';
                this.ctx.font = '14px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText("CLEAR", dx + 36, dy + 20);
                this.ctx.textAlign = 'start';
                this.ctx.textBaseline = 'alphabetic';
            }

            this.ctx.fillStyle = (game.clearedStages[i] && game.selectMode === 'PLAY') ? '#666' : '#fff';
            this.ctx.font = '10px monospace';
            this.ctx.fillText(i + 1, dx, dy - 5);
        }
    }

    drawMiniMap(index, dx, dy) {
        if (!ALL_LEVELS[index]) return;
        const level = ALL_LEVELS[index];
        const w = 3;
        for (let y = 0; y < 13; y++) {
            for (let x = 0; x < 24; x++) {
                const t = level[y][x];
                if (t === 1) this.ctx.fillStyle = '#8B4513';
                else if (t === 2) this.ctx.fillStyle = '#888';
                else if (t === 3) this.ctx.fillStyle = '#000';
                else if (t === 4) this.ctx.fillStyle = '#f00';
                else if (t === 5) this.ctx.fillStyle = '#00f';
                else this.ctx.fillStyle = '#222';

                this.ctx.fillRect(dx + x * w, dy + y * w, w, w);
            }
        }
    }
}
