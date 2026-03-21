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
            this.drawTitleMain(game);
            return;
        }
        if (state === 'SETTINGS') {
            this.drawTitleSettings(game);
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
        const footerY = this.ctx.canvas.height - 60;
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, footerY, this.ctx.canvas.width, 60);

        // Earthquake / Retire Area
        const barX = 20;
        const barY = footerY + 20;
        const barW = 600;
        const barH = 20;

        // Earthquake Bar Frame
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barW, barH);

        // Earthquake Bar Fill
        if (ES > 0) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            const fillW = (barW * ES) / 60;
            this.ctx.fillRect(barX, barY, fillW, barH);
        }

        // Retire Button (Right side of Footer)
        const btnX = 720;
        const btnY = footerY + 10;
        const btnW = 220;
        const btnH = 40;

        // Button Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(btnX, btnY, btnW, btnH, 8);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.stroke();

        // Button Progress (Long Press)
        if (game.giveUpTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            const fillW = (btnW * game.giveUpTimer) / game.giveUpMax;
            this.ctx.beginPath();
            this.ctx.roundRect(btnX, btnY, fillW, btnH, 8);
            this.ctx.fill();
        }

        if (state === 'EDITOR') {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("X (B) BACK ●", btnX + btnW / 2, btnY + 28);
        } else {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("X (B) RETIRE ●", btnX + btnW / 2, btnY + 28);
        }
        this.ctx.textAlign = 'left';

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

    drawTitleBackground() {
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
    }

    drawTitleMain(game) {
        this.drawTitleBackground();

        // Draw Menu Items (Overlay)
        // Add semi-transparent box for readability
        // Move down to avoid overlapping the central Logo
        const menuBaseY = 250;
        const boxHeight = 200;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(260, menuBaseY, 440, boxHeight); // Background for menu

        this.ctx.textAlign = 'center'; // Center text properly

        this.ctx.font = '30px monospace';

        // 0: GAME PLAY
        this.ctx.fillStyle = game.titleCursor === 0 ? '#ff0' : '#888';
        this.ctx.fillText("GAME PLAY", 480, menuBaseY + 45);

        // 1: HOW TO PLAY
        this.ctx.fillStyle = game.titleCursor === 1 ? '#ff0' : '#888';
        this.ctx.fillText("HOW TO PLAY", 480, menuBaseY + 85);

        // 2: MAP EDITOR
        this.ctx.fillStyle = game.titleCursor === 2 ? '#ff0' : '#888';
        this.ctx.fillText("MAP EDITOR", 480, menuBaseY + 125);

        // 3: SETTINGS
        this.ctx.fillStyle = game.titleCursor === 3 ? '#ff0' : '#888';
        this.ctx.fillText("SETTINGS", 480, menuBaseY + 165);

        this.ctx.textAlign = 'start'; // Reset for other draws

        // Version & Copyright
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;

        const versionText = `v${game.version}`;
        const copyrightText = "© T.I.OAK 2026";
        const vy = this.ctx.canvas.height - 15;

        // Draw Version (Left)
        this.ctx.textAlign = 'left';
        this.ctx.strokeText(versionText, 20, vy);
        this.ctx.fillText(versionText, 20, vy);

        // Draw Copyright (Center)
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(copyrightText, 480, vy);
        this.ctx.fillText(copyrightText, 480, vy);

        this.ctx.textAlign = 'start';
    }

    drawTitleSettings(game) {
        this.drawTitleBackground();

        const menuBaseY = 160;
        const boxWidth = 600;
        const boxHeight = 420;
        const boxX = (this.ctx.canvas.width - boxWidth) / 2;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(boxX, menuBaseY, boxWidth, boxHeight);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(boxX, menuBaseY, boxWidth, boxHeight);

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillText("SETTINGS", this.ctx.canvas.width / 2, menuBaseY + 50);

        const items = [
            { label: "GAME SPEED", val: `${game.targetFPS} FPS`, type: 'slider', min: 30, max: 60, current: game.targetFPS },
            { label: "PAD TYPE", val: "", type: 'switch', active: game.padType !== 0 },
            { label: "PAD POS", val: game.padType === 0 ? "" : "DRAG", type: 'info', disabled: game.padType === 0 },
            { label: "PAD SIZE", val: game.padType === 0 ? "" : `${game.padSize}%`, type: 'slider', min: 50, max: 150, current: game.padSize, disabled: game.padType === 0 },
            { label: "SCREEN SIZE", val: `${game.tempScreenSize}%`, type: 'slider', min: 50, max: 100, current: game.tempScreenSize },
            { label: "BACK", type: 'button' }
        ];

        const itemYStart = menuBaseY + 100;
        const itemGap = 55;

        items.forEach((item, i) => {
            const iy = itemYStart + i * itemGap;
            const isSelected = (game.settingsCursor === i);

            // Item Content Layout
            const contentX = boxX + 60;
            const contentW = boxWidth - 120;

            // Selection Marker (Simple dot or triangle)
            if (isSelected) {
                this.ctx.fillStyle = '#ff0';
                this.ctx.beginPath();
                this.ctx.arc(contentX - 25, iy, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }

            if (item.type !== 'button') {
                this.ctx.textAlign = 'left';
                this.ctx.fillStyle = (item.disabled) ? '#444' : (isSelected ? '#ff0' : '#888');
                this.ctx.font = isSelected ? 'bold 20px monospace' : '18px monospace';
                this.ctx.fillText(item.label, contentX, iy + 5);
            }

            this.ctx.textAlign = 'right';
            if (item.type === 'slider') {
                // Draw Slider Track
                const trackW = 160;
                const tx = boxX + boxWidth - 200;
                this.ctx.fillStyle = '#222';
                this.ctx.fillRect(tx, iy - 3, trackW, 6);

                // Draw Fill
                const ratio = (item.current - item.min) / (item.max - item.min);
                this.ctx.fillStyle = isSelected ? '#ff0' : '#088';
                this.ctx.fillRect(tx, iy - 3, trackW * ratio, 6);

                // Draw Knob
                this.ctx.fillStyle = (item.disabled) ? '#333' : (isSelected ? '#fff' : '#aaa');
                this.ctx.beginPath();
                this.ctx.arc(tx + trackW * ratio, iy, 14, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = (item.disabled) ? '#222' : '#000';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                // Current Value Text
                this.ctx.fillStyle = item.disabled ? '#444' : '#fff';
                this.ctx.font = '16px monospace';
                this.ctx.fillText(item.val, tx - 25, iy + 5);
            } else if (item.type === 'switch') {
                // Segmented Control (3-way selector)
                const sw = 240;
                const tx = boxX + boxWidth - 280;
                const segmentW = sw / 3;
                const labels = ["NONE", "SINGLE", "DUAL"];

                labels.forEach((label, j) => {
                    const sx = tx + j * segmentW;
                    const isCurrent = (game.padType === j);

                    // Segment Background
                    this.ctx.fillStyle = isCurrent ? '#088' : '#111';
                    if (isCurrent && isSelected) this.ctx.fillStyle = '#0aa';
                    this.ctx.fillRect(sx, iy - 15, segmentW, 30);

                    // Segment Border
                    this.ctx.strokeStyle = isSelected ? '#ff0' : '#444';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(sx, iy - 15, segmentW, 30);

                    // Label
                    this.ctx.textAlign = 'center';
                    this.ctx.fillStyle = isCurrent ? '#fff' : '#666';
                    this.ctx.font = 'bold 12px monospace';
                    this.ctx.fillText(label, sx + segmentW / 2, iy + 5);
                });
            } else if (item.type === 'button') {
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = isSelected ? '#ff0' : '#fff';
                this.ctx.font = isSelected ? 'bold 24px monospace' : '22px monospace';
                this.ctx.fillText("BACK", boxX + boxWidth / 2, iy + 5);
            } else {
                this.ctx.fillStyle = '#666';
                this.ctx.font = '18px monospace';
                this.ctx.fillText(item.val, boxX + boxWidth - 40, iy + 5);
            }
        });

        this.ctx.textAlign = 'start';
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
        const footY = this.ctx.canvas.height - 60;
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, footY, this.ctx.canvas.width, 60);

        // Draw Button-like frame for BACK (Tap)
        const btnX = 720;
        const btnY = this.ctx.canvas.height - 55;
        const btnW = 220;
        const btnH = 45;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(btnX, btnY, btnW, btnH, 10);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.stroke();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 22px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("TAP TO BACK", btnX + btnW / 2, btnY + 32);

        this.ctx.fillStyle = '#888';
        this.ctx.font = '18px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText("Scroll to Read More...", 40, btnY + 30);

        // Content Area (Clipped & Scrolled)
        this.ctx.beginPath();
        this.ctx.rect(0, 60, this.ctx.canvas.width, this.ctx.canvas.height - 120);
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
        this.ctx.fillText("ステージをクリアするたびにライフが1つ増えます。（最大9）", x + 50, y); y += 50;

        // === CONTROLS ===
        this.ctx.fillStyle = '#ffcc00'; this.ctx.font = 'bold 26px monospace';
        this.ctx.fillText("■ 操作方法", x - 20, y); y += 45;

        // Table Constants
        const tableX = 40;
        const colW = [180, 200, 160, 160, 180]; // Item, WASD/Arrow, Numpad, Soft, Gamepad
        const rowH = 50;
        const tableW = colW.reduce((a, b) => a + b, 0);

        // Header Style
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(tableX, y, tableW, rowH);
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(tableX, y, tableW, rowH);

        this.ctx.fillStyle = '#aaa';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'center';
        const headers = ["操作項目", "WASD / 矢印", "テンキー", "ソフトパッド", "Gamepad"];
        let curX = tableX;
        for (let i = 0; i < headers.length; i++) {
            this.ctx.fillText(headers[i], curX + colW[i] / 2, y + 32);
            curX += colW[i];
            if (i < headers.length - 1) {
                this.ctx.beginPath(); this.ctx.moveTo(curX, y); this.ctx.lineTo(curX, y + rowH); this.ctx.stroke();
            }
        }
        y += rowH;

        // Data Rows
        const rows = [
            ["左右移動", "A / D / ← / →", "4 / 6", "◀ / ▶", "十字キー / Stick"],
            ["ジャンプ※1", "W / ↑", "8", "▲", "十字キー上"],
            ["Sジャンプ※2", "Q / E", "7 / 9", "↖ / ↗", "L1 / R1"],
            ["穴掘り", "S / ↓ / Space", "1 / 2 / 5", "▼ / A", "A"],
            ["リタイア※3", "X / (長押し)", "3 / (長押し)", "B / (長押し)", "B / (長押し)"]
        ];

        // Row Icon Helper
        const drawIconBox = (ctx, bx, by, bw, bh, text, style) => {
            ctx.save();
            const radius = (style === 'circle-a' || style === 'circle-b') ? bw / 2 : 6;
            ctx.beginPath();
            if (style === 'circle-a' || style === 'circle-b') {
                ctx.arc(bx + bw / 2, by + bh / 2, bw / 2, 0, Math.PI * 2);
            } else {
                ctx.moveTo(bx + radius, by);
                ctx.lineTo(bx + bw - radius, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
                ctx.lineTo(bx + bw, by + bh - radius); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh);
                ctx.lineTo(bx + radius, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - radius);
                ctx.lineTo(bx, by + radius); ctx.quadraticCurveTo(bx, by, bx + radius, by);
            }
            ctx.closePath();

            if (style === 'key') {
                ctx.fillStyle = '#444'; ctx.fill();
                ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.stroke();
                ctx.strokeStyle = '#aaa'; ctx.beginPath(); ctx.moveTo(bx + 2, by + 1); ctx.lineTo(bx + bw - 2, by + 1); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 15px monospace';
            } else if (style === 'pad') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#ddd'; ctx.font = '24px "Segoe UI Symbol", sans-serif';
            } else if (style === 'smart') {
                ctx.fillStyle = 'rgba(255, 200, 0, 0.15)'; ctx.fill();
                ctx.strokeStyle = 'rgba(255, 200, 0, 0.4)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#ffcc00'; ctx.font = '22px "Segoe UI Symbol", sans-serif';
            } else if (style === 'circle-a') {
                ctx.fillStyle = 'rgba(80, 80, 255, 0.3)'; ctx.fill();
                ctx.strokeStyle = 'rgba(120, 120, 255, 0.6)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace';
            } else if (style === 'circle-b') {
                ctx.fillStyle = 'rgba(255, 80, 80, 0.3)'; ctx.fill();
                ctx.strokeStyle = 'rgba(255, 120, 120, 0.6)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace';
            }
            ctx.textAlign = 'center';
            ctx.fillText(text, bx + bw / 2, by + bh / 2 + (style.startsWith('circle') ? 8 : 7));
            ctx.restore();
        };

        rows.forEach((row, rowIndex) => {
            this.ctx.fillStyle = (rowIndex % 2 === 0) ? '#111' : '#1a1a1a';
            this.ctx.fillRect(tableX, y, tableW, rowH);
            this.ctx.strokeStyle = '#444'; this.ctx.lineWidth = 1;
            this.ctx.strokeRect(tableX, y, tableW, rowH);

            curX = tableX;
            row.forEach((cell, i) => {
                const centerX = curX + colW[i] / 2;
                const centerY = y + rowH / 2;

                if (i === 0) { // Item Name
                    this.ctx.fillStyle = '#ffcc00'; this.ctx.font = 'bold 18px monospace';
                    this.ctx.textAlign = 'center'; this.ctx.fillText(cell, centerX, centerY + 8);
                } else { // Icon-able columns (1-4)
                    const items = cell.split(' / ');
                    let totalW = 0;
                    items.forEach(it => {
                        if (it.startsWith('(')) totalW += it.length * 9;
                        else {
                            const kw = (it.length > 3 && i !== 3) ? 80 : 40;
                            totalW += kw;
                        }
                        totalW += 6;
                    });

                    let startX = centerX - (totalW - 6) / 2;
                    items.forEach(it => {
                        if (it.startsWith('(')) {
                            this.ctx.fillStyle = '#aaa'; this.ctx.font = '13px monospace';
                            this.ctx.textAlign = 'center';
                            const sw = it.length * 9;
                            this.ctx.fillText(it, startX + sw / 2, centerY + 6);
                            startX += sw + 6;
                        } else {
                            let style = (i === 4) ? 'key' : 'key';
                            if (i === 3) {
                                style = (rowIndex === 2) ? 'smart' : 'pad';
                                if (it === 'A') style = 'circle-a';
                                if (it === 'B') style = 'circle-b';
                            }
                            const kw = (it.length > 3 && style === 'key') ? 80 : 40;
                            drawIconBox(this.ctx, startX, centerY - (i === 3 ? 18 : 15), kw, (i === 3 ? 36 : 30), it, style);
                            startX += kw + 6;
                        }
                    });
                }

                curX += colW[i];
                if (i < row.length - 1) {
                    this.ctx.strokeStyle = '#444'; this.ctx.lineWidth = 1;
                    this.ctx.beginPath(); this.ctx.moveTo(curX, y); this.ctx.lineTo(curX, y + rowH); this.ctx.stroke();
                }
            });
            y += rowH;
        });

        // Footnotes
        y += 20;
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '16px monospace';
        this.ctx.fillText("※1 ジャンプ         : 向いている方向にジャンプします。", tableX, y); y += 22;
        this.ctx.fillText("※2 スマートジャンプ : 指定した方向にジャンプします。", tableX, y); y += 22;
        this.ctx.fillText("※3 リタイア         : ライフを1つ失い、ステージをやり直します。", tableX, y); y += 40;

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

        // Instruction Text (Right of bar) - Both modes use long press
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'right';

        // Draw Button-like frame for BACK
        const btnX = 720;
        const btnY = this.ctx.canvas.height - 55;
        const btnW = 220;
        const btnH = 45;

        // Button Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(btnX, btnY, btnW, btnH, 10);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.stroke();

        // Button Progress (Long Press)
        if (game.selectExitTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            const fillW = (btnW * game.selectExitTimer) / game.giveUpMax;
            this.ctx.beginPath();
            this.ctx.roundRect(btnX, btnY, fillW, btnH, 10);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("X (B) BACK ●", btnX + btnW / 2, btnY + 32);
        this.ctx.textAlign = 'left';

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
