import { ALL_LEVELS } from './levels.js';
import { createSettingsLayout } from './settingsLayout.js';
import { formatCopyrightText } from './constants.js';
import { createEditorMenuLayout, createEditorTileGuideLayout } from './editorLayout.js';
import {
    createBackButtonLayout,
    createExtraMapActionMenuLayout,
    createExtraMapDeleteConfirmLayout,
    createSelectStageGridLayout,
    createTitleMenuLayout
} from './uiLayout.js';

export class Renderer {
    constructor(ctx, assets) {
        this.ctx = ctx; this.assets = assets;
        this.tileWidth = 40; this.tileHeight = 40;
        this.shakeX = 0;
        this.shakeY = 0;
    }

    roundRect(x, y, width, height, radius, fill = true, stroke = false) {
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, radius);
        if (fill) this.ctx.fill();
        if (stroke) this.ctx.stroke();
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
        if (state === 'SHARED_MAP_LOAD_ERROR') {
            this.drawSharedMapLoadError(game);
            return;
        }
        if (state === 'EXTRA_MAP') {
            this.drawExtraMap(game);
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
            this.ctx.fillText(this.getPlayStageLabel(game), this.ctx.canvas.width - 20, hudY + 35);

            this.ctx.restore();
        }

        if (state === 'EDITOR') {
            this.ctx.save();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(game.t('play.editorMode'), 10, 28);

            // Tile placement guide
            this.ctx.font = '16px monospace';
            const tileNamePaths = [
                'howToPlay.terrain.empty.name',
                'howToPlay.terrain.soil.name',
                'howToPlay.terrain.rock.name',
                'howToPlay.terrain.portal.name',
                'howToPlay.terrain.redCrystal.name',
                'howToPlay.terrain.blueCrystal.name',
                'howToPlay.terrain.soilMemory.name',
                'howToPlay.terrain.rockMemory.name'
            ];
            const tileGuideLayout = createEditorTileGuideLayout();

            for (let i = 0; i < 8; i++) {
                const { x: gx, y: gy } = tileGuideLayout.getItemRect(i);

                // Highlight current item
                const isCurrent = (game.editor.selectedTile === i);

                // Draw tile icon
                this.ctx.drawImage(this.assets.getTile(i), gx, gy, tileGuideLayout.iconSize, tileGuideLayout.iconSize);

                // Draw text (bright if current, dim otherwise)
                this.ctx.fillStyle = isCurrent ? '#fff' : '#666';
                this.ctx.fillText(
                    `${i}: ${game.t(tileNamePaths[i])}`,
                    gx + tileGuideLayout.labelOffsetX,
                    gy + tileGuideLayout.labelOffsetY
                );
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
        const backButton = createBackButtonLayout(this.ctx.canvas.height, 'playFooter');

        // Button Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(backButton.x, backButton.y, backButton.width, backButton.height, 8);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.stroke();

        // Button Progress (Long Press)
        if (game.giveUpTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            const fillW = (backButton.width * game.giveUpTimer) / game.giveUpMax;
            this.ctx.beginPath();
            this.ctx.roundRect(backButton.x, backButton.y, fillW, backButton.height, 8);
            this.ctx.fill();
        }

        if (state === 'EDITOR') {
            if (game.isEditingExtraMap()) {
                this.drawSoftPadButtonLabel(
                    backButton.x + backButton.width / 2,
                    backButton.y + backButton.height / 2,
                    'B',
                    game.t('extraMap.editor.menu')
                );
            } else {
                this.drawSoftPadHoldButtonLabel(
                    backButton.x + backButton.width / 2,
                    backButton.y + backButton.height / 2,
                    'B',
                    game.t('common.back')
                );
            }
        } else {
            this.drawSoftPadHoldButtonLabel(
                backButton.x + backButton.width / 2,
                backButton.y + backButton.height / 2,
                'B',
                game.t('play.retire')
            );
        }
        this.ctx.textAlign = 'left';

        // Overlays
        if (state === 'WAIT_CLEAR') {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = '80px monospace';
            this.ctx.strokeStyle = '#000'; this.ctx.lineWidth = 4;
            this.ctx.strokeText(game.t('play.clear'), 320, 280);
            this.ctx.fillText(game.t('play.clear'), 320, 280);
        }
        if (state === 'WAIT_MISS') {
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '80px monospace';
            this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 4;
            this.ctx.strokeText(game.t('play.miss'), 340, 280);
            this.ctx.fillText(game.t('play.miss'), 340, 280);
        }
        if (state === 'WAIT_GAMEOVER' || state === 'GAMEOVER') {
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '80px monospace';
            this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 4;
            this.ctx.strokeText(game.t('play.gameOver'), 280, 280);
            this.ctx.fillText(game.t('play.gameOver'), 280, 280);
        }

        if (state === 'WAIT_START') {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000'; this.ctx.lineWidth = 4;
            const stageLabel = this.getPlayStageLabel(game);
            this.ctx.strokeText(stageLabel, 480, 260); // Outline
            this.ctx.fillText(stageLabel, 480, 260);
            this.ctx.textAlign = 'start';
        }

        if (state === 'EDITOR' && game.isEditingExtraMap() && game.extraMapEditorSession.menuOpen) {
            this.drawExtraMapEditorMenu(game);
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

    getPlayStageLabel(game) {
        const key = game.isPlayingExtraMap?.() ? 'play.extraStage' : 'play.stage';
        return game.t(key, { number: game.stage + 1 });
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
        const menuLayout = createTitleMenuLayout();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(menuLayout.box.x, menuLayout.box.y, menuLayout.box.width, menuLayout.box.height);

        this.ctx.textAlign = 'center'; // Center text properly

        this.ctx.font = '30px monospace';

        [
            game.t('title.menu.gamePlay'),
            game.t('title.menu.howToPlay'),
            game.canOpenExtraMap() ? game.t('title.menu.extraMap') : game.t('title.menu.unavailable'),
            game.t('title.menu.settings')
        ].forEach((label, index) => {
            const point = menuLayout.getItemTextPoint(index);
            this.ctx.fillStyle = game.titleCursor === index ? '#ff0' : '#888';
            this.ctx.fillText(label, point.x, point.y);
        });

        this.ctx.textAlign = 'start'; // Reset for other draws

        // Version & Copyright
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;

        const versionText = `v${game.version}`;
        const copyrightText = formatCopyrightText();
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

    drawExtraMap(game) {
        this.ctx.save();
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(game.t('extraMap.title'), 480, 45);

        const gridLayout = createSelectStageGridLayout();
        this.ctx.textAlign = 'left';
        for (let i = 0; i < gridLayout.itemCount; i++) {
            const { x: dx, y: dy } = gridLayout.getItemRect(i);
            const heldMap = game.extraMaps[i];

            this.ctx.strokeStyle = (i === game.extraMapCursor) ? '#ff0' : '#444';
            this.ctx.lineWidth = (i === game.extraMapCursor) ? 3 : 1;
            this.ctx.strokeRect(dx - 2, dy - 2, 76, 43);

            if (heldMap) {
                const iconY = dy - 14;
                this.drawMiniMapData(heldMap.stage, dx, dy);
                this.drawStageClearStatusIcon(dx + 64, iconY, heldMap.cleared, 4.2);
                if (heldMap.favorite) this.drawFavoriteIcon(dx + 55, iconY);

                this.ctx.fillStyle = '#fff';
                this.ctx.font = '10px monospace';
                this.ctx.fillText(i + 1, dx, dy - 5);
                this.drawDifficultyStars(dx + 14, iconY, heldMap.difficulty);
            } else {
                this.ctx.fillStyle = '#050505';
                this.ctx.fillRect(dx, dy, 72, 39);
                this.ctx.fillStyle = '#666';
                this.ctx.font = '11px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(game.t('extraMap.empty'), dx + 36, dy + 20);
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'alphabetic';
                this.ctx.font = '10px monospace';
                this.ctx.fillText(i + 1, dx, dy - 5);
            }
        }

        const backButton = createBackButtonLayout(this.ctx.canvas.height);
        this.drawSoftPadCommandButton(backButton, 'B', game.t('common.back'), 22);

        this.drawExtraMapActionMenu(game, gridLayout);
        this.drawNotice(game);
        this.drawExtraMapDownloadFullModal(game);
        this.drawExtraMapDeleteConfirm(game);
        this.ctx.restore();
    }

    drawNotice(game) {
        if (!game.noticeText) return;

        this.ctx.save();
        this.ctx.font = '18px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const width = Math.max(260, this.ctx.measureText(game.noticeText).width + 48);
        const x = (this.ctx.canvas.width - width) / 2;
        const y = this.ctx.canvas.height - 130;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        this.roundRect(x, y, width, 40, 8, true, false);
        this.ctx.strokeStyle = '#777';
        this.ctx.lineWidth = 2;
        this.roundRect(x, y, width, 40, 8, false, true);
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillText(game.noticeText, this.ctx.canvas.width / 2, y + 20);
        this.ctx.restore();
    }

    drawSharedMapLoadError(game) {
        this.ctx.save();
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        const box = {
            x: 180,
            y: 185,
            width: 600,
            height: 270
        };

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.roundRect(box.x, box.y, box.width, box.height, 10, true, false);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.roundRect(box.x, box.y, box.width, box.height, 10, false, true);

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 30px monospace';
        this.ctx.fillText(game.t('extraMap.loadError.title'), box.x + box.width / 2, box.y + 70);

        this.ctx.fillStyle = '#ccc';
        this.ctx.font = '18px monospace';
        game.tr('extraMap.loadError.lines').forEach((line, index) => {
            this.ctx.fillText(line, box.x + box.width / 2, box.y + 118 + index * 28);
        });

        this.drawSoftPadCommandButton({
            x: box.x + box.width / 2 - 120,
            y: box.y + box.height - 70,
            width: 240,
            height: 48
        }, 'B', game.t('extraMap.loadError.close'), 20);

        this.ctx.restore();
    }

    drawExtraMapDownloadFullModal(game) {
        if (!game.extraMapDownloadFullModalOpen) return;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        const box = {
            x: 160,
            y: 190,
            width: 640,
            height: 280
        };

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
        this.roundRect(box.x, box.y, box.width, box.height, 10, true, false);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.roundRect(box.x, box.y, box.width, box.height, 10, false, true);

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 28px monospace';
        this.ctx.fillText(game.t('extraMap.downloadFull.title'), box.x + box.width / 2, box.y + 62);

        this.ctx.fillStyle = '#ccc';
        this.ctx.font = '18px monospace';
        game.tr('extraMap.downloadFull.lines').forEach((line, index) => {
            this.ctx.fillText(line, box.x + box.width / 2, box.y + 116 + index * 28);
        });

        this.drawSoftPadCommandButton({
            x: box.x + box.width / 2 - 120,
            y: box.y + box.height - 70,
            width: 240,
            height: 48
        }, 'B', game.t('extraMap.downloadFull.close'), 20);

        this.ctx.restore();
    }

    drawExtraMapDeleteConfirm(game) {
        if (!game.extraMapDeleteConfirm) return;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        const layout = createExtraMapDeleteConfirmLayout(this.ctx.canvas.width, this.ctx.canvas.height);
        const { box } = layout;
        this.ctx.fillStyle = 'rgba(16, 16, 16, 0.96)';
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(box.x, box.y, box.width, box.height, 10);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '28px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(game.t('extraMap.deleteConfirm.title'), box.x + box.width / 2, box.y + 54);

        this.ctx.fillStyle = '#ccc';
        this.ctx.font = '18px monospace';
        game.tr('extraMap.deleteConfirm.lines').forEach((line, index) => {
            this.ctx.fillText(line, box.x + box.width / 2, box.y + 96 + index * 28);
        });

        this.drawSoftPadCommandButton(layout.confirmButton, 'A', game.t('extraMap.deleteConfirm.delete'), 18);
        this.drawSoftPadCommandButton(layout.cancelButton, 'B', game.t('extraMap.deleteConfirm.cancel'), 18);

        this.ctx.restore();
    }

    drawExtraMapActionMenu(game, gridLayout) {
        if (!game.extraMapActionMenu) return;

        const items = game.getExtraMapActionItems();
        const menu = createExtraMapActionMenuLayout(
            gridLayout.getItemHitRect(game.extraMapActionMenu.slotIndex),
            items.length,
            this.ctx.canvas.width,
            this.ctx.canvas.height
        );

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(menu.x, menu.y, menu.width, menu.height);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(menu.x, menu.y, menu.width, menu.height);

        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        items.forEach((item, index) => {
            const rect = menu.getItemRect(index);
            const selected = index === game.extraMapActionMenu.cursor;
            if (selected) {
                this.ctx.fillStyle = item.enabled ? '#333300' : '#202020';
                this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                this.ctx.strokeStyle = item.enabled ? '#ff0' : '#555';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            }

            this.ctx.fillStyle = item.enabled ? '#fff' : '#666';
            this.ctx.fillText(item.label, rect.x + 8, rect.y + rect.height / 2);
        });
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.restore();
    }

    drawFavoriteIcon(x, y) {
        this.ctx.save();
        this.ctx.translate(x + 5, y + 5);
        this.ctx.scale(0.65, 0.55);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 8);
        this.ctx.bezierCurveTo(-8.5, 1, -8, -8, -3.5, -8);
        this.ctx.bezierCurveTo(-1.3, -8, 0, -6, 0, -4.6);
        this.ctx.bezierCurveTo(0, -6, 1.3, -8, 3.5, -8);
        this.ctx.bezierCurveTo(8, -8, 8.5, 1, 0, 8);
        this.ctx.closePath();
        this.ctx.fillStyle = '#ff4f78';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffd3df';
        this.ctx.lineWidth = 1.6;
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawDifficultyStars(x, y, count) {
        this.ctx.save();
        for (let i = 0; i < count; i++) {
            this.drawSmallStar(x + 5 + i * 6.6, y + 5, 4.3, 1.9);
        }
        this.ctx.restore();
    }

    drawSmallStar(cx, cy, outerRadius, innerRadius) {
        this.ctx.beginPath();
        for (let point = 0; point < 10; point++) {
            const angle = -Math.PI / 2 + point * Math.PI / 5;
            const radius = point % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (point === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff1a8';
        this.ctx.lineWidth = 0.8;
        this.ctx.stroke();
    }

    drawTitleSettings(game) {
        this.drawTitleBackground();

        const layout = createSettingsLayout(this.ctx.canvas.width);
        const { box } = layout;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(box.x, box.y, box.width, box.height);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillText(game.t('settings.title'), layout.title.x, layout.title.y);

        const items = [
            { label: game.t('settings.gameSpeed'), val: `${game.targetFPS} FPS`, type: 'slider', min: 30, max: 60, current: game.targetFPS },
            { label: game.t('settings.padType'), val: "", type: 'switch', active: game.padType !== 0 },
            { label: game.t('settings.padPos'), val: game.padType === 0 ? "" : game.t('settings.drag'), type: 'info', disabled: game.padType === 0 },
            { label: game.t('settings.padSize'), val: game.padType === 0 ? "" : `${game.padSize}%`, type: 'slider', min: 50, max: 150, current: game.padSize, disabled: game.padType === 0 },
            { label: game.t('settings.screenSize'), val: `${game.tempScreenSize}%`, type: 'slider', min: 50, max: 100, current: game.tempScreenSize },
            { label: game.t('settings.language'), val: game.getLanguageLabel(), type: 'language' },
            { label: game.t('common.back'), type: 'button' }
        ];

        items.forEach((item, i) => {
            const iy = layout.getItemY(i);
            const isSelected = (game.settingsCursor === i);

            // Item Content Layout
            const contentX = layout.labelX;

            // Selection Marker (Simple dot or triangle)
            if (isSelected) {
                this.ctx.fillStyle = '#ff0';
                this.ctx.beginPath();
                this.ctx.arc(layout.markerX, iy, 4, 0, Math.PI * 2);
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
                const trackW = layout.slider.width;
                const tx = layout.slider.x;
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
                const sw = layout.switch.width;
                const tx = layout.switch.x;
                const segmentW = sw / 3;
                const labels = [
                    game.t('settings.padTypes.none'),
                    game.t('settings.padTypes.single'),
                    game.t('settings.padTypes.dual')
                ];

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
                this.ctx.fillText(game.t('common.back'), box.x + box.width / 2, iy + 5);
            } else if (item.type === 'language') {
                const tx = layout.language.x;
                const controlW = layout.language.width;
                this.ctx.fillStyle = isSelected ? '#088' : '#111';
                this.ctx.fillRect(tx, iy - 16, controlW, 32);
                this.ctx.strokeStyle = isSelected ? '#ff0' : '#444';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(tx, iy - 16, controlW, 32);

                this.ctx.fillStyle = isSelected ? '#fff' : '#aaa';
                this.ctx.font = 'bold 16px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`< ${item.val} >`, tx + controlW / 2, iy + 5);
            } else {
                this.ctx.fillStyle = '#666';
                this.ctx.font = '18px monospace';
                this.ctx.fillText(item.val, box.x + box.width - 40, iy + 5);
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
        this.ctx.fillText(game.t('howToPlay.title'), 480, 40);
        this.ctx.strokeStyle = '#333';
        this.ctx.beginPath(); this.ctx.moveTo(0, 60); this.ctx.lineTo(960, 60); this.ctx.stroke();

        // Footer (Fixed)
        const footY = this.ctx.canvas.height - 60;
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, footY, this.ctx.canvas.width, 60);

        // Draw Button-like frame for BACK (Tap)
        const backButton = createBackButtonLayout(this.ctx.canvas.height);

        this.drawSoftPadCommandButton(backButton, 'B', game.t('howToPlay.tapToBack'), 22);

        if (game.howToPlayScroll < game.getHowToPlayScrollMax()) {
            this.ctx.fillStyle = '#888';
            this.ctx.font = '18px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(game.t('howToPlay.scrollMore'), 40, backButton.y + 30);
        }

        // Content Area (Clipped & Scrolled)
        this.ctx.beginPath();
        this.ctx.rect(0, 60, this.ctx.canvas.width, this.ctx.canvas.height - 120);
        this.ctx.clip();

        this.ctx.translate(0, -game.howToPlayScroll + 90);

        this.ctx.textAlign = 'left';
        let y = 0;
        const x = 100;
        const gap = 30;

        const drawHeading = (text, color = '#ffcc00', font = '24px monospace') => {
            this.ctx.fillStyle = color;
            this.ctx.font = font;
            this.ctx.fillText(text, x - 20, y);
            y += 40;
        };
        const drawLines = (lines, offsetX = x, color = '#ddd', font = '20px monospace') => {
            this.ctx.fillStyle = color;
            this.ctx.font = font;
            lines.forEach(line => {
                this.ctx.fillText(line, offsetX, y);
                y += gap;
            });
        };
        const drawTileEntry = (tileId, namePath, linesPath, nameColor, bottomGap = 40) => {
            this.ctx.drawImage(this.assets.getTile(tileId), x, y - 25, 40, 40);
            this.ctx.fillStyle = nameColor;
            this.ctx.font = '20px monospace';
            this.ctx.fillText(game.t(namePath), x + 50, y);
            y += gap;
            drawLines(game.tr(linesPath), x + 50);
            y += bottomGap - gap;
        };

        drawHeading(game.t('howToPlay.prologue.title'), '#ddd');
        drawLines(game.tr('howToPlay.prologue.lines'));
        y += 20;

        drawHeading(game.t('howToPlay.objective.title'));
        this.ctx.drawImage(this.assets.getTile(3), x, y - 25, 40, 40);
        drawLines(game.tr('howToPlay.objective.lines'), x + 50, '#fff');
        y += 20;

        drawHeading(game.t('howToPlay.terrain.title'));
        drawTileEntry(3, 'howToPlay.terrain.portal.name', 'howToPlay.terrain.portal.lines', '#f156f1ff');
        drawTileEntry(4, 'howToPlay.terrain.redCrystal.name', 'howToPlay.terrain.redCrystal.lines', '#ff8888');
        drawTileEntry(5, 'howToPlay.terrain.blueCrystal.name', 'howToPlay.terrain.blueCrystal.lines', '#8888ff');
        drawTileEntry(1, 'howToPlay.terrain.soil.name', 'howToPlay.terrain.soil.lines', '#ce8059ff');
        drawTileEntry(2, 'howToPlay.terrain.rock.name', 'howToPlay.terrain.rock.lines', '#aaaaaa');
        drawTileEntry(6, 'howToPlay.terrain.soilMemory.name', 'howToPlay.terrain.soilMemory.lines', '#cfa07a');
        drawTileEntry(7, 'howToPlay.terrain.rockMemory.name', 'howToPlay.terrain.rockMemory.lines', '#aaaaaa');

        drawHeading(game.t('howToPlay.life.title'));
        this.ctx.drawImage(this.assets.player.life, x, y - 25, 40, 40);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px monospace';
        this.ctx.fillText(game.t('howToPlay.life.name'), x + 50, y);
        y += gap;
        drawLines(game.tr('howToPlay.life.lines'), x + 50);
        y += 20;

        drawHeading(game.t('howToPlay.controls.title'), '#ffcc00', 'bold 26px monospace');

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 21px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(game.t('howToPlay.controls.definitionsTitle'), x, y);
        y += 34;

        game.tr('howToPlay.controls.definitions').forEach(([label, text]) => {
            this.ctx.fillStyle = '#ffcc00';
            this.ctx.font = 'bold 17px monospace';
            this.ctx.fillText(label, x + 10, y);
            y += 23;

            this.ctx.fillStyle = '#ddd';
            this.ctx.font = '15px monospace';
            this.wrapText(text, 760).forEach(line => {
                this.ctx.fillText(line, x + 30, y);
                y += 21;
            });
            y += 8;
        });

        y += 8;
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 21px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(game.t('howToPlay.controls.mappingTitle'), x, y);
        y += 30;

        // Table Constants
        const tableX = 50;
        const colW = [185, 140, 200, 120, 235];
        const rowH = 46;
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
        const headers = game.tr('howToPlay.controls.headers');
        let curX = tableX;
        for (let i = 0; i < headers.length; i++) {
            this.ctx.fillText(headers[i], curX + colW[i] / 2, y + 30);
            curX += colW[i];
            if (i < headers.length - 1) {
                this.ctx.beginPath(); this.ctx.moveTo(curX, y); this.ctx.lineTo(curX, y + rowH); this.ctx.stroke();
            }
        }
        y += rowH;

        // Data Rows
        const rows = game.tr('howToPlay.controls.rows');

        // Row Icon Helper
        const drawIconBox = (ctx, bx, by, bw, bh, text, style) => {
            ctx.save();
            const radius = (style === 'circle-a' || style === 'circle-b') ? Math.min(bw, bh) / 2 : 6;
            ctx.beginPath();
            if (style === 'circle-a' || style === 'circle-b') {
                ctx.arc(bx + bw / 2, by + bh / 2, radius, 0, Math.PI * 2);
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
                    const items = i === 4 ? [cell] : cell.split(' / ');
                    let totalW = 0;
                    items.forEach(it => {
                        if (it.startsWith('(')) totalW += it.length * 9;
                        else {
                            const kw = this.getHowToPlayControlKeyWidth(it, i);
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
                            let style = 'key';
                            if (i === 1) {
                                style = (it === '↖' || it === '↗') ? 'smart' : 'pad';
                                if (it === 'A') style = 'circle-a';
                                if (it === 'B') style = 'circle-b';
                            }
                            const kw = this.getHowToPlayControlKeyWidth(it, i);
                            drawIconBox(this.ctx, startX, centerY - 15, kw, 30, it, style);
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
        game.tr('howToPlay.controls.footnotes').forEach(line => {
            this.ctx.fillText(line, tableX, y);
            y += 22;
        });
        y += 18;

        this.ctx.restore();
    }

    getHowToPlayControlKeyWidth(text, columnIndex) {
        if (columnIndex === 4) return text.startsWith('D-pad') ? 170 : 40;
        if (text.length >= 6) return 94;
        if (text.length >= 3 && columnIndex !== 1) return 80;
        return 40;
    }

    drawSelect(game) {
        this.ctx.save();
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px monospace';

        this.ctx.fillText(game.t('select.stage'), 280, 40);

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

        // Instruction Text (Right of bar) - Both modes use long press
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'right';

        // Draw Button-like frame for BACK
        const backButton = createBackButtonLayout(this.ctx.canvas.height);

        // Button Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(backButton.x, backButton.y, backButton.width, backButton.height, 10);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.stroke();

        // Button Progress (Long Press)
        if (game.selectExitTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            const fillW = (backButton.width * game.selectExitTimer) / game.giveUpMax;
            this.ctx.beginPath();
            this.ctx.roundRect(backButton.x, backButton.y, fillW, backButton.height, 10);
            this.ctx.fill();
        }

        this.drawSoftPadHoldButtonLabel(
            backButton.x + backButton.width / 2,
            backButton.y + backButton.height / 2,
            'B',
            game.t('common.back')
        );
        this.ctx.textAlign = 'left';

        const gridLayout = createSelectStageGridLayout();

        for (let i = 0; i < 50; i++) {
            const { x: dx, y: dy } = gridLayout.getItemRect(i);
            const isLocked = !game.isStageUnlocked(i);
            const isClearedBefore = game.isStageClearedBefore(i);
            const isClearedInCurrentGame = game.isStageClearedInCurrentGame(i);
            const isSelectable = game.isStageSelectable(i);

            this.ctx.strokeStyle = (i === game.selectCursor) ? '#ff0' : '#444';
            this.ctx.lineWidth = (i === game.selectCursor) ? 3 : 1;
            this.ctx.strokeRect(dx - 2, dy - 2, 76, 43);

            if (isLocked) {
                this.ctx.fillStyle = '#050505';
                this.ctx.fillRect(dx, dy, 72, 39);

                this.ctx.fillStyle = '#777';
                this.ctx.font = '11px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(game.t('select.locked'), dx + 36, dy + 20);
                this.ctx.textAlign = 'start';
                this.ctx.textBaseline = 'alphabetic';
            } else if (isClearedInCurrentGame) {
                this.ctx.fillStyle = '#050505';
                this.ctx.fillRect(dx, dy, 72, 39);

                this.drawStageClearStatusIcon(dx + 61, dy - 14, true);
                this.drawDifficultyStars(dx + 14, dy - 14, game.getNormalStageDifficulty(i));

                this.ctx.fillStyle = '#ff0';
                this.ctx.font = '14px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(game.t('select.clear'), dx + 36, dy + 20);
                this.ctx.textAlign = 'start';
                this.ctx.textBaseline = 'alphabetic';
            } else {
                this.drawMiniMap(i, dx, dy);
                this.drawStageClearStatusIcon(dx + 61, dy - 14, isClearedBefore);
                this.drawDifficultyStars(dx + 14, dy - 14, game.getNormalStageDifficulty(i));
            }

            this.ctx.fillStyle = isSelectable ? '#fff' : '#666';
            this.ctx.font = '10px monospace';
            this.ctx.fillText(i + 1, dx, dy - 5);
        }
        this.ctx.restore();
    }

    drawStageClearStatusIcon(x, y, isCleared, radius = 5) {
        this.ctx.save();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = isCleared ? '#2fd66f' : '#777';
        this.ctx.fillStyle = isCleared ? 'rgba(47, 214, 111, 0.16)' : 'rgba(0, 0, 0, 0.4)';

        this.ctx.beginPath();
        this.ctx.arc(x + 5, y + 5, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        if (isCleared) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 5 - radius * 0.6, y + 5);
            this.ctx.lineTo(x + 5 - radius * 0.2, y + 5 + radius * 0.55);
            this.ctx.lineTo(x + 5 + radius * 0.75, y + 5 - radius * 0.65);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawMiniMap(index, dx, dy) {
        if (!ALL_LEVELS[index]) return;
        this.drawMiniMapData(ALL_LEVELS[index], dx, dy);
    }

    drawMiniMapData(level, dx, dy) {
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

    drawExtraMapEditorMenu(game) {
        const layout = createEditorMenuLayout(this.ctx.canvas.width);
        const { box } = layout;
        const items = game.getExtraMapEditorMenuItems();

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(box.x, box.y, box.width, box.height);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillText(game.t('extraMap.editor.title'), layout.title.x, layout.title.y);

        items.forEach((item, index) => {
            const iy = layout.getItemY(index);
            const isSelected = game.extraMapEditorSession.menuCursor === index;

            if (isSelected) {
                this.ctx.fillStyle = '#ff0';
                this.ctx.beginPath();
                this.ctx.arc(layout.markerX, iy, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }

            if (item.id === 'back') {
                this.ctx.fillStyle = isSelected ? '#ff0' : '#fff';
                this.ctx.font = isSelected ? 'bold 24px monospace' : '22px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(item.label, layout.title.x, iy + 5);
                return;
            }

            this.ctx.fillStyle = isSelected ? '#ff0' : '#888';
            this.ctx.font = isSelected ? 'bold 20px monospace' : '18px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(item.label, layout.labelX, iy + 5);

            if (item.id === 'difficulty') {
                this.ctx.fillStyle = isSelected ? '#088' : '#111';
                this.ctx.fillRect(layout.value.x, iy - 16, layout.value.width, 32);
                this.ctx.strokeStyle = isSelected ? '#ff0' : '#444';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(layout.value.x, iy - 16, layout.value.width, 32);
                this.ctx.fillStyle = isSelected ? '#fff' : '#aaa';
                this.ctx.font = 'bold 16px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`< ${item.value} >`, layout.value.x + layout.value.width / 2, iy + 5);
            }
        });

        this.drawDifficultyDescription(game, layout);
        if (game.extraMapEditorSession.controlsOpen) {
            this.drawExtraMapEditorControls(game);
        }
        this.ctx.restore();
    }

    drawExtraMapEditorControls(game) {
        const box = {
            x: 30,
            y: 95,
            width: 900,
            height: 520
        };
        const content = {
            x: box.x + 30,
            y: box.y + 78,
            width: box.width - 60,
            height: box.height - 158
        };
        const footer = {
            x: box.x + 30,
            y: box.y + box.height - 82,
            width: box.width - 60,
            height: 58
        };
        let y = content.y;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.93)';
        this.ctx.fillRect(box.x, box.y, box.width, box.height);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 30px monospace';
        this.ctx.fillText(game.t('extraMap.editor.controls.title'), box.x + box.width / 2, box.y + 48);

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(content.x, content.y, content.width, content.height);
        this.ctx.clip();
        this.ctx.translate(0, -game.extraMapEditorSession.controlsScroll);

        y = this.drawEditorControlFlow(game, content.x, y, content.width);
        y += 16;
        y = this.drawEditorEditActions(game.tr('extraMap.editor.controls.actions'), content.x, y, content.width);
        y += 16;
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '15px monospace';
        game.tr('extraMap.editor.controls.footnotes').forEach(line => {
            this.ctx.fillText(line, content.x, y);
            y += 24;
        });
        this.ctx.restore();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
        this.ctx.fillRect(footer.x, footer.y, footer.width, footer.height);

        if (game.extraMapEditorSession.controlsScroll < game.getExtraMapEditorControlsScrollMax()) {
            this.ctx.fillStyle = '#888';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(game.t('howToPlay.scrollMore'), footer.x, footer.y + 35);
        }

        const closeButton = {
            x: footer.x + footer.width - 220,
            y: footer.y + 7,
            width: 220,
            height: 44
        };
        this.drawSoftPadCommandButton(closeButton, 'B', game.t('extraMap.editor.controls.close'), 18);
    }

    drawEditorControlFlow(game, x, y, width) {
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(game.t('extraMap.editor.controls.flowTitle'), x, y + 24);
        y += 42;

        this.ctx.fillStyle = '#ddd';
        this.ctx.font = '16px monospace';
        game.tr('extraMap.editor.controls.flowLines').forEach((line, index) => {
            this.ctx.fillStyle = index === 0 ? '#fff' : '#ccc';
            this.ctx.fillText(`${index + 1}. ${line}`, x + 8, y);
            y += 26;
        });

        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 4);
        this.ctx.lineTo(x + width, y + 4);
        this.ctx.stroke();
        return y + 22;
    }

    drawEditorEditActions(actions, x, y, width) {
        actions.forEach((action, index) => {
            const [title, face, description] = action;
            const items = String(face).split(' / ');
            const blockHeight = items.length > 4 ? 112 : 96;
            this.ctx.fillStyle = index % 2 === 0 ? '#111' : '#1a1a1a';
            this.ctx.fillRect(x, y, width, blockHeight);
            this.ctx.strokeStyle = '#444';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, width, blockHeight);

            this.ctx.fillStyle = '#ffcc00';
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(title, x + 14, y + 28);

            if (items.length > 4) {
                this.drawControlItems(items.slice(0, 4), x + 20, y + 54, 1, index);
                this.drawControlItems(items.slice(4), x + 20, y + 84, 1, index);
            } else {
                this.drawControlItems(items, x + 20, y + 61, 1, index);
            }

            this.ctx.fillStyle = '#ddd';
            this.ctx.font = '15px monospace';
            this.wrapText(description, width - 360).slice(0, 3).forEach((line, lineIndex) => {
                this.ctx.fillText(line, x + 360, y + 28 + lineIndex * 22);
            });

            y += blockHeight + 10;
        });

        return y;
    }

    drawControlItems(items, startX, centerY, columnIndex = 1) {
        items.forEach(item => {
            if (item.startsWith('(')) {
                this.ctx.fillStyle = '#aaa';
                this.ctx.font = '13px monospace';
                this.ctx.textAlign = 'center';
                const textWidth = item.length * 9;
                this.ctx.fillText(item, startX + textWidth / 2, centerY + 6);
                startX += textWidth + 6;
                return;
            }

            const style = this.getControlCellStyle(item, columnIndex);
            const width = item.length >= 3 && style === 'key' ? 80 : 40;
            const height = 30;
            this.drawControlIconBox(startX, centerY - height / 2, width, height, item, style);
            startX += width + 6;
        });
    }

    getControlCellStyle(item, columnIndex) {
        if (columnIndex === 3) {
            if (item === 'A') return 'circle-a';
            if (item === 'B') return 'circle-b';
            if (item === '↖' || item === '↗') return 'smart';
            return 'pad';
        }
        return 'key';
    }

    drawSoftPadButtonLabel(centerX, centerY, button, label, fontSize = 20, color = '#fff') {
        this.ctx.font = `bold ${fontSize}px monospace`;
        const textWidth = this.ctx.measureText(label).width || label.length * fontSize * 0.6;
        const totalWidth = 30 + 10 + textWidth;
        const iconX = centerX - totalWidth / 2;
        const textX = iconX + 40;
        this.drawControlIconBox(iconX, centerY - 15, 30, 30, button, button === 'B' ? 'circle-b' : 'circle-a');
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(label, textX, centerY + Math.round(fontSize * 0.35));
    }

    drawSoftPadHoldButtonLabel(centerX, centerY, button, label, fontSize = 20, color = '#fff') {
        this.ctx.font = `bold ${fontSize}px monospace`;
        const holdText = 'HOLD';
        const holdWidth = this.ctx.measureText(holdText).width;
        const labelWidth = this.ctx.measureText(label).width || label.length * fontSize * 0.6;
        const totalWidth = holdWidth + 10 + 30 + 10 + labelWidth;
        let x = centerX - totalWidth / 2;

        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(holdText, x, centerY + Math.round(fontSize * 0.35));
        x += holdWidth + 10;
        this.drawControlIconBox(x, centerY - 15, 30, 30, button, button === 'B' ? 'circle-b' : 'circle-a');
        x += 40;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(label, x, centerY + Math.round(fontSize * 0.35));
    }

    drawSoftPadCommandButton(rect, button, label, fontSize = 22) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 10);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.drawSoftPadButtonLabel(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
            button,
            label,
            fontSize
        );
    }

    drawControlIconBox(x, y, width, height, text, style) {
        this.ctx.save();
        const radius = style === 'circle-a' || style === 'circle-b' ? Math.min(width, height) / 2 : 6;
        this.ctx.beginPath();
        if (style === 'circle-a' || style === 'circle-b') {
            this.ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
        } else {
            this.ctx.moveTo(x + radius, y);
            this.ctx.lineTo(x + width - radius, y);
            this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.ctx.lineTo(x + width, y + height - radius);
            this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.ctx.lineTo(x + radius, y + height);
            this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.ctx.lineTo(x, y + radius);
            this.ctx.quadraticCurveTo(x, y, x + radius, y);
        }
        this.ctx.closePath();

        if (style === 'key') {
            this.ctx.fillStyle = '#444';
            this.ctx.fill();
            this.ctx.strokeStyle = '#888';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.strokeStyle = '#aaa';
            this.ctx.beginPath();
            this.ctx.moveTo(x + 2, y + 1);
            this.ctx.lineTo(x + width - 2, y + 1);
            this.ctx.stroke();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 15px monospace';
        } else if (style === 'pad') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.fillStyle = '#ddd';
            this.ctx.font = '20px "Segoe UI Symbol", sans-serif';
        } else if (style === 'smart') {
            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.15)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 200, 0, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.fillStyle = '#ffcc00';
            this.ctx.font = '20px "Segoe UI Symbol", sans-serif';
        } else if (style === 'circle-a') {
            this.ctx.fillStyle = 'rgba(80, 80, 255, 0.3)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(120, 120, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 20px monospace';
        } else if (style === 'circle-b') {
            this.ctx.fillStyle = 'rgba(255, 80, 80, 0.3)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 120, 120, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 20px monospace';
        }

        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x + width / 2, y + height / 2 + (style.startsWith('circle') ? 8 : 7));
        this.ctx.restore();
    }

    drawDifficultyDescription(game, layout) {
        const rect = layout.description;
        const text = game.getExtraMapEditDifficultyDescription();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        const lines = this.wrapText(text, rect.width - 32);
        lines.slice(0, 4).forEach((line, index) => {
            this.ctx.fillText(line, rect.x + 16, rect.y + 28 + index * 22);
        });
    }

    wrapText(text, maxWidth) {
        const words = String(text).split(' ');
        const lines = [];
        let line = '';
        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;
            if (this.ctx.measureText(candidate).width <= maxWidth || !line) {
                line = candidate;
            } else {
                lines.push(line);
                line = word;
            }
        }
        if (line) lines.push(line);
        return lines;
    }
}
