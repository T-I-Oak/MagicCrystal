import { ALL_LEVELS } from './levels.js';
import { createSettingsLayout } from './settingsLayout.js';
import { formatCopyrightText } from './constants.js';
import {
    createEditorControlsModalLayout,
    createEditorDifficultyModalLayout,
    createEditorFunctionBarLayout,
    createEditorTileGuideLayout
} from './editorLayout.js';
import {
    createBackButtonLayout,
    createExtraMapDeleteConfirmLayout,
    createExtraMapFunctionBarLayout,
    createCongratulationsLayout,
    createSelectStageFunctionBarLayout,
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
        if (state === 'CONGRATULATIONS' || state === 'ALLCLEAR') {
            this.drawCongratulations(game);
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
                if (isCurrent) {
                    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.08)';
                    this.ctx.fillRect(gx - 5, gy - 2, tileGuideLayout.itemWidth - 10, tileGuideLayout.itemHeight);
                    this.ctx.strokeStyle = '#ff0';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(gx - 5, gy - 2, tileGuideLayout.itemWidth - 10, tileGuideLayout.itemHeight);
                }

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

        if (state === 'EDITOR' && game.isEditingExtraMap()) {
            this.drawExtraMapEditorFunctionBar(game);
        } else {

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
                this.drawSoftPadHoldButtonLabel(
                    backButton.x + backButton.width / 2,
                    backButton.y + backButton.height / 2,
                    'B',
                    game.t('common.back')
                );
            } else {
                this.drawSoftPadHoldButtonLabel(
                    backButton.x + backButton.width / 2,
                    backButton.y + backButton.height / 2,
                    'B',
                    game.t('play.retire')
                );
            }
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

        if (state === 'EDITOR' && game.isEditingExtraMap() && game.extraMapEditorSession.controlsOpen) {
            this.drawExtraMapEditorControls(game);
        }
        if (state === 'EDITOR' && game.isEditingExtraMap() && game.extraMapEditorSession.difficultyOpen) {
            this.drawExtraMapEditorDifficultyModal(game);
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

    drawTitleLogo() {
        if (!this.assets.logo) return;

        const width = 640;
        const height = width * (this.assets.logo.height / this.assets.logo.width);
        const x = (this.ctx.canvas.width - width) / 2;
        const y = 74;
        this.ctx.drawImage(this.assets.logo, x, y, width, height);
    }

    drawTitleMain(game) {
        this.drawTitleBackground();
        this.drawTitleLogo();

        // Draw Menu Items (Overlay)
        // Add semi-transparent box for readability
        // Move down to avoid overlapping the central Logo
        const menuLayout = createTitleMenuLayout();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.roundRect(menuLayout.box.x, menuLayout.box.y, menuLayout.box.width, menuLayout.box.height, 10, true, false);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.roundRect(menuLayout.box.x, menuLayout.box.y, menuLayout.box.width, menuLayout.box.height, 10, false, true);

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

        this.drawExtraMapFunctionBar(game);
        this.drawNotice(game);
        this.drawExtraMapDeleteConfirmModal(game);
        this.drawExtraMapDownloadFullModal(game);
        this.ctx.restore();
    }

    drawExtraMapFunctionBar(game) {
        const items = game.getExtraMapActionItems();
        const layout = createExtraMapFunctionBarLayout(this.ctx.canvas.width, this.ctx.canvas.height, items);

        this.ctx.save();
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, layout.items[0].rect.y - 10, this.ctx.canvas.width, this.ctx.canvas.height - layout.items[0].rect.y + 10);

        this.drawControlIconBox(layout.smartLeft.x, layout.smartLeft.y, layout.smartLeft.width, layout.smartLeft.height, '↖', 'smart');
        this.drawControlIconBox(layout.smartRight.x, layout.smartRight.y, layout.smartRight.width, layout.smartRight.height, '↗', 'smart');

        layout.items.forEach((layoutItem, index) => {
            const item = items[index];
            if (!item) return;
            this.drawExtraMapFunctionButton(layoutItem.rect, item, index === game.extraMapFunctionCursor);
        });

        this.drawSoftPadCommandButton(layout.back, 'B', game.t('common.back'), 22);
        this.ctx.restore();
    }

    drawExtraMapFunctionButton(rect, item, selected) {
        this.ctx.save();
        this.ctx.fillStyle = item.enabled
            ? (selected ? '#0a5b86' : 'rgba(255, 255, 255, 0.08)')
            : 'rgba(255, 255, 255, 0.035)';
        this.ctx.strokeStyle = selected ? '#ff0' : (item.enabled ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.12)');
        this.ctx.lineWidth = selected ? 3 : 2;
        this.ctx.beginPath();
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
        this.ctx.fill();
        this.ctx.stroke();

        let textX = rect.x + 12;
        const centerY = rect.y + rect.height / 2;
        if (selected && item.enabled) {
            this.drawControlIconBox(textX, centerY - 14, 28, 28, 'A', 'circle-a');
            textX += 36;
        }

        this.ctx.fillStyle = item.enabled ? '#fff' : '#666';
        this.ctx.font = selected && item.enabled ? 'bold 18px monospace' : '18px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(item.label, textX, centerY + 1);
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

    drawActionModal({
        backgroundFill = 'rgba(0, 0, 0, 0.72)',
        panelFill = 'rgba(0, 0, 0, 0.92)',
        box,
        title,
        titleOffsetY = 56,
        titleFont = 'bold 28px monospace',
        lines = [],
        lineStartOffsetY = 112,
        lineGap = 28,
        lineFont = '18px monospace',
        lineColor = '#ccc',
        buttons = []
    }) {
        this.ctx.save();
        if (backgroundFill) {
            this.ctx.fillStyle = backgroundFill;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }

        this.ctx.fillStyle = panelFill;
        this.roundRect(box.x, box.y, box.width, box.height, 10, true, false);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.roundRect(box.x, box.y, box.width, box.height, 10, false, true);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = titleFont;
        this.ctx.fillText(title, box.x + box.width / 2, box.y + titleOffsetY);

        this.ctx.fillStyle = lineColor;
        this.ctx.font = lineFont;
        lines.forEach((line, index) => {
            this.ctx.fillText(line, box.x + box.width / 2, box.y + lineStartOffsetY + index * lineGap);
        });

        this.drawModalActionButtons(buttons);
        this.ctx.restore();
    }

    drawModalActionButtons(buttons = []) {
        buttons.forEach(({ rect, button, label, fontSize = 20, selected = false }) => {
            if (selected) {
                this.drawSelectableSoftPadCommandButton(rect, button, label, true, fontSize);
            } else {
                this.drawSoftPadCommandButton(rect, button, label, fontSize);
            }
        });
    }

    drawSharedMapLoadError(game) {
        const box = {
            x: 180,
            y: 185,
            width: 600,
            height: 270
        };

        this.drawActionModal({
            backgroundFill: '#111',
            panelFill: 'rgba(0, 0, 0, 0.9)',
            box,
            title: game.t('extraMap.loadError.title'),
            titleOffsetY: 70,
            lines: game.tr('extraMap.loadError.lines'),
            lineStartOffsetY: 118,
            buttons: [{
                rect: {
                    x: box.x + box.width / 2 - 120,
                    y: box.y + box.height - 70,
                    width: 240,
                    height: 48
                },
                button: 'B',
                label: game.t('extraMap.loadError.close')
            }]
        });
    }

    drawCongratulations(game) {
        const layout = createCongratulationsLayout(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();
        this.ctx.fillStyle = '#05050a';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (this.assets.clear) {
            const scale = Math.min(
                layout.image.width / this.assets.clear.width,
                layout.image.height / this.assets.clear.height
            );
            const width = this.assets.clear.width * scale;
            const height = this.assets.clear.height * scale;
            const x = layout.image.x + (layout.image.width - width) / 2;
            const y = layout.image.y + (layout.image.height - height) / 2;
            this.ctx.drawImage(this.assets.clear, x, y, width, height);
        } else {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 46px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CONGRATULATIONS', this.ctx.canvas.width / 2, 220);
        }

        this.drawCongratulationsConfetti(game);
        this.drawCongratulationsButtons(game, layout);
        this.drawNotice(game);
        this.ctx.restore();
    }

    drawCongratulationsButtons(game, layout) {
        this.drawSelectableSoftPadCommandButton(
            layout.shareButton,
            'A',
            game.t('congratulations.actions.share'),
            game.congratulationsCursor === 0,
            22
        );
        this.drawSelectableSoftPadCommandButton(
            layout.titleButton,
            'B',
            game.t('congratulations.actions.title'),
            game.congratulationsCursor === 1,
            22
        );
    }

    drawCongratulationsConfetti(game) {
        const elapsed = Math.max(0, (Date.now() - game.lastStateChange) / 1000);
        const colors = ['#ff3b2f', '#1f9bff', '#ffd24d', '#ffffff'];
        this.ctx.save();
        for (let i = 0; i < 72; i++) {
            const seed = Math.sin(i * 92.17) * 10000;
            const base = seed - Math.floor(seed);
            const x = (base * this.ctx.canvas.width + Math.sin(elapsed * 1.5 + i) * 28) % this.ctx.canvas.width;
            const speed = 45 + (i % 7) * 10;
            const y = ((elapsed * speed + i * 37) % (this.ctx.canvas.height + 80)) - 80;
            const w = 5 + (i % 3) * 3;
            const h = 12 + (i % 4) * 2;
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(elapsed * (0.8 + (i % 5) * 0.2) + i);
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.globalAlpha = 0.78;
            this.ctx.fillRect(-w / 2, -h / 2, w, h);
            this.ctx.restore();
        }
        this.ctx.restore();
    }

    drawExtraMapDownloadFullModal(game) {
        if (!game.extraMapDownloadFullModalOpen) return;

        const box = {
            x: 160,
            y: 190,
            width: 640,
            height: 280
        };

        this.drawActionModal({
            panelFill: 'rgba(0, 0, 0, 0.94)',
            box,
            title: game.t('extraMap.downloadFull.title'),
            titleOffsetY: 62,
            lines: game.tr('extraMap.downloadFull.lines'),
            lineStartOffsetY: 116,
            buttons: [{
                rect: {
                    x: box.x + box.width / 2 - 120,
                    y: box.y + box.height - 70,
                    width: 240,
                    height: 48
                },
                button: 'B',
                label: game.t('extraMap.downloadFull.close')
            }]
        });
    }

    drawExtraMapDeleteConfirmModal(game) {
        if (!game.extraMapDeleteConfirm) return;

        const layout = createExtraMapDeleteConfirmLayout(this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawActionModal({
            box: layout.box,
            title: game.t('extraMap.deleteConfirm.title'),
            lines: game.tr('extraMap.deleteConfirm.lines'),
            buttons: [
                {
                    rect: layout.confirmButton,
                    button: 'A',
                    label: game.t('extraMap.deleteConfirm.delete')
                },
                {
                    rect: layout.cancelButton,
                    button: 'B',
                    label: game.t('extraMap.deleteConfirm.cancel')
                }
            ]
        });
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

    drawSmallStar(cx, cy, outerRadius, innerRadius, fillStyle = '#ffcc00', strokeStyle = '#fff1a8') {
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
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = 0.8;
        this.ctx.stroke();
    }

    drawSettingsModalFrame(box, titlePoint, title) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.roundRect(box.x, box.y, box.width, box.height, 10, true, false);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.roundRect(box.x, box.y, box.width, box.height, 10, false, true);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillText(title, titlePoint.x, titlePoint.y);
    }

    drawSettingsSelectionMarker(x, y, selected) {
        if (!selected) return;

        this.ctx.fillStyle = '#ff0';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSettingsItemLabel(label, x, y, selected, disabled = false) {
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.fillStyle = disabled ? '#444' : (selected ? '#ff0' : '#888');
        this.ctx.font = selected ? 'bold 20px monospace' : '18px monospace';
        this.ctx.fillText(label, x, y + 5);
    }

    drawSettingsChoiceFrame(rect, selected) {
        this.ctx.fillStyle = selected ? '#088' : '#111';
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        this.ctx.strokeStyle = selected ? '#ff0' : '#444';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    drawSettingsChoiceText(rect, value, selected) {
        this.drawSettingsChoiceFrame(rect, selected);
        this.ctx.fillStyle = selected ? '#fff' : '#aaa';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.fillText(`< ${value} >`, rect.x + rect.width / 2, rect.y + rect.height / 2 + 6);
    }

    drawTitleSettings(game) {
        if (game.settingsReturnState === 'SELECT') {
            this.drawSelect(game);
        } else {
            this.drawTitleBackground();
            this.drawTitleLogo();
        }

        const layout = createSettingsLayout(this.ctx.canvas.width);
        const { box } = layout;

        this.drawSettingsModalFrame(box, layout.title, game.t('settings.title'));

        const items = [
            { label: game.t('settings.gameSpeed'), val: `${game.targetFPS} FPS`, type: 'slider', min: 10, max: 60, current: game.targetFPS },
            { label: game.t('settings.padType'), val: "", type: 'switch', active: game.padType !== 0 },
            { label: game.t('settings.padPos'), val: game.padType === 0 ? "" : game.t('settings.drag'), type: 'info', disabled: game.padType === 0 },
            { label: game.t('settings.padSize'), val: game.padType === 0 ? "" : `${game.padSize}%`, type: 'slider', min: 50, max: 150, current: game.padSize, disabled: game.padType === 0 },
            { label: game.t('settings.screenSize'), val: `${game.tempScreenSize}%`, type: 'slider', min: 50, max: 100, current: game.tempScreenSize },
            { label: game.t('settings.language'), val: game.getLanguageLabel(), type: 'language' }
        ];

        items.forEach((item, i) => {
            const iy = layout.getItemY(i);
            const isSelected = (game.settingsCursor === i);

            // Item Content Layout
            const contentX = layout.labelX;

            this.drawSettingsSelectionMarker(layout.markerX, iy, isSelected);

            if (item.type !== 'button') {
                this.drawSettingsItemLabel(item.label, contentX, iy, isSelected, item.disabled);
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
            } else if (item.type === 'language') {
                this.drawSettingsChoiceText(
                    {
                        x: layout.language.x,
                        y: iy - 16,
                        width: layout.language.width,
                        height: 32
                    },
                    item.val,
                    isSelected
                );
            } else {
                this.ctx.fillStyle = '#666';
                this.ctx.font = '18px monospace';
                this.ctx.fillText(item.val, box.x + box.width - 40, iy + 5);
            }
        });

        this.drawSoftPadCommandButton(layout.closeButton, 'B', game.t('common.close'), 22);
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
                            this.drawControlIconBox(startX, centerY - 15, kw, 30, it, style);
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

        this.drawSelectStageFunctionBar(game);
        this.ctx.restore();
    }

    drawSelectStageFunctionBar(game) {
        const items = game.getSelectStageActionItems();
        const layout = createSelectStageFunctionBarLayout(this.ctx.canvas.width, this.ctx.canvas.height, items);

        this.ctx.save();
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, layout.smartLeft.y - 10, this.ctx.canvas.width, this.ctx.canvas.height - layout.smartLeft.y + 10);

        this.drawControlIconBox(layout.smartLeft.x, layout.smartLeft.y, layout.smartLeft.width, layout.smartLeft.height, '↖', 'smart');
        this.drawControlIconBox(layout.smartRight.x, layout.smartRight.y, layout.smartRight.width, layout.smartRight.height, '↗', 'smart');

        layout.items.forEach((layoutItem, index) => {
            const item = items[index];
            if (!item) return;
            this.drawExtraMapFunctionButton(layoutItem.rect, item, index === game.selectStageFunctionCursor);
        });

        this.drawSelectStageBackButton(layout.back, game);
        this.ctx.restore();
    }

    drawSelectStageBackButton(rect, game) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
        this.ctx.fill();
        this.ctx.stroke();

        if (game.selectExitTimer > 0) {
            this.ctx.fillStyle = 'rgba(255, 80, 80, 0.28)';
            const fillW = (rect.width * game.selectExitTimer) / game.giveUpMax;
            this.ctx.beginPath();
            this.ctx.roundRect(rect.x, rect.y, fillW, rect.height, 8);
            this.ctx.fill();
        }

        this.drawSoftPadHoldButtonLabel(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
            'B',
            game.t('common.back'),
            16
        );
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

    drawExtraMapEditorFunctionBar(game) {
        const barItems = game.getExtraMapEditorFunctionBarItems();
        const layout = createEditorFunctionBarLayout(this.ctx.canvas.width, barItems);
        const selectedBarId = game.getExtraMapEditorFunctionBarId();

        this.ctx.save();
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, layout.smartLeft.y - 7, this.ctx.canvas.width, layout.smartLeft.height + 14);

        this.drawControlIconBox(layout.smartLeft.x, layout.smartLeft.y, layout.smartLeft.width, layout.smartLeft.height, '↖', 'smart');
        this.drawControlIconBox(layout.smartRight.x, layout.smartRight.y, layout.smartRight.width, layout.smartRight.height, '↗', 'smart');

        layout.items.forEach((layoutItem, index) => {
            const item = barItems[index];
            if (!item) return;
            this.drawEditorFunctionButton(
                layoutItem.rect,
                item.label,
                selectedBarId === item.id,
                item.id === 'terrain' ? game.editor.selectedTile : null
            );
        });
        this.drawEditorDiscardButton(layout.discard, game);

        this.ctx.restore();
    }

    drawEditorFunctionButton(rect, label, selected, tileId = null) {
        this.ctx.save();
        this.ctx.fillStyle = selected ? '#0a5b86' : 'rgba(255, 255, 255, 0.08)';
        this.ctx.strokeStyle = selected ? '#ff0' : 'rgba(255, 255, 255, 0.24)';
        this.ctx.lineWidth = selected ? 3 : 2;
        this.ctx.beginPath();
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
        this.ctx.fill();
        this.ctx.stroke();

        let x = rect.x + 10;
        const centerY = rect.y + rect.height / 2;
        if (selected) {
            this.drawControlIconBox(x, centerY - 14, 28, 28, 'A', 'circle-a');
            x += 36;
        }
        if (tileId !== null) {
            this.ctx.drawImage(this.assets.getTile(tileId), x, centerY - 11, 22, 22);
            x += 28;
        }

        this.ctx.fillStyle = selected ? '#fff' : '#ddd';
        this.ctx.font = selected ? 'bold 18px monospace' : '18px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, centerY + 1);
        this.ctx.restore();
    }

    drawEditorDiscardButton(rect, game) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
        this.ctx.fill();
        this.ctx.stroke();

        if (game.giveUpTimer > 0) {
            this.ctx.fillStyle = 'rgba(255, 80, 80, 0.28)';
            const fillW = (rect.width * game.giveUpTimer) / game.giveUpMax;
            this.ctx.beginPath();
            this.ctx.roundRect(rect.x, rect.y, fillW, rect.height, 8);
            this.ctx.fill();
        }

        this.drawSoftPadHoldButtonLabel(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
            'B',
            game.t('extraMap.actions.discardShort'),
            16
        );
        this.ctx.restore();
    }

    getEditorTileName(game, tileId) {
        return game.getEditorTileName(tileId);
    }

    drawExtraMapEditorDifficultyModal(game) {
        const layout = createEditorDifficultyModalLayout(this.ctx.canvas.width, this.ctx.canvas.height);
        const { box } = layout;
        const difficulty = game.extraMapEditorSession.difficulty;
        const selectedRow = game.extraMapEditorSession.difficultyCursor;
        const functionBar = createEditorFunctionBarLayout(
            this.ctx.canvas.width,
            game.getExtraMapEditorFunctionBarItems()
        );

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, functionBar.smartLeft.y - 7);
        this.drawSettingsModalFrame(box, layout.title, game.t('extraMap.editor.difficultySettingsTitle'));
        this.drawSettingsSelectionMarker(layout.valueLabel.x - 24, layout.valueLabel.y, selectedRow === 0);
        this.drawSettingsItemLabel(
            game.t('extraMap.editor.difficulty'),
            layout.valueLabel.x,
            layout.valueLabel.y,
            selectedRow === 0
        );
        this.drawDifficultySettingValue(layout.valueControlRect, difficulty, selectedRow === 0);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
        this.ctx.fillRect(layout.description.x, layout.description.y, layout.description.width, layout.description.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(layout.description.x, layout.description.y, layout.description.width, layout.description.height);

        this.ctx.fillStyle = '#ddd';
        this.ctx.font = '18px monospace';
        this.ctx.textAlign = 'left';
        const description = this.normalizeDifficultyDescription(
            game.tr('extraMap.editor.difficultyDescriptions')[difficulty - 1] ?? ''
        );
        const lines = this.wrapTextByWidth(description, layout.description.width - 32).slice(0, 2);
        const lineY = layout.description.y + (lines.length > 1 ? 30 : 48);
        lines.forEach((line, lineIndex) => {
            this.ctx.fillText(line, layout.description.x + 16, lineY + lineIndex * 24);
        });

        this.drawSoftPadCommandButton(layout.closeButton, 'B', game.t('common.close'), 18);
        this.ctx.restore();
    }

    drawDifficultySettingValue(rect, difficulty, selected) {
        this.ctx.save();
        this.drawSettingsChoiceFrame(rect, selected);

        this.ctx.fillStyle = selected ? '#fff' : '#aaa';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('<', rect.x + 42, rect.y + rect.height / 2 + 1);
        this.ctx.fillText('>', rect.x + rect.width - 42, rect.y + rect.height / 2 + 1);
        this.drawModalDifficultyStars(rect.x + rect.width / 2 - (difficulty - 1) * 10, rect.y + rect.height / 2, difficulty);
        this.ctx.restore();
    }

    normalizeDifficultyDescription(text) {
        return String(text).replace(/^★+:\s*/, '');
    }

    drawModalDifficultyStars(x, centerY, count, enabled = true) {
        this.ctx.save();
        for (let i = 0; i < count; i++) {
            this.drawSmallStar(
                x + i * 17,
                centerY,
                8,
                3.5,
                enabled ? '#ffcc00' : '#4e4e4e',
                enabled ? '#fff1a8' : '#666'
            );
        }
        this.ctx.restore();
    }

    drawExtraMapEditorControls(game) {
        const layout = createEditorControlsModalLayout();
        const { box, content, footer, closeButton } = layout;
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

        this.drawSoftPadCommandButton(closeButton, 'B', game.t('extraMap.editor.controls.close'), 18);
    }

    drawEditorControlFlow(game, x, y, width) {
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(game.t('extraMap.editor.controls.flowTitle'), x, y + 24);
        y += 52;

        this.ctx.fillStyle = '#ddd';
        this.ctx.font = '16px monospace';
        this.ctx.fillStyle = '#ccc';
        game.tr('extraMap.editor.controls.flowLines').forEach((line, index) => {
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
            this.ctx.font = '15px monospace';
            const descriptionLines = this.wrapTextByWidth(description, width - 382).slice(0, 4);
            const keyRows = items.length > 4 ? 2 : 1;
            const keyAreaHeight = keyRows * 30 + (keyRows - 1) * 0;
            const descriptionHeight = descriptionLines.length * 22;
            const blockHeight = Math.max(96, 46 + keyAreaHeight, 46 + descriptionHeight);
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
            descriptionLines.forEach((line, lineIndex) => {
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
        if (item === 'A') return 'circle-a';
        if (item === 'B') return 'circle-b';
        if (columnIndex === 3) {
            if (item === '↖' || item === '↗') return 'smart';
            return 'pad';
        }
        return 'key';
    }

    drawSoftPadButtonLabel(centerX, centerY, button, label, fontSize = 20, color = '#fff') {
        this.ctx.font = `bold ${fontSize}px monospace`;
        const textWidth = this.ctx.measureText(label).width || label.length * fontSize * 0.6;
        const gap = 14;
        const totalWidth = 30 + gap + textWidth;
        const iconX = centerX - totalWidth / 2;
        const textX = iconX + 30 + gap;
        this.drawControlIconBox(iconX, centerY - 15, 30, 30, button, button === 'B' ? 'circle-b' : 'circle-a');
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, textX, centerY + 1);
    }

    drawSoftPadHoldButtonLabel(centerX, centerY, button, label, fontSize = 20, color = '#fff') {
        this.ctx.font = `bold ${fontSize}px monospace`;
        const holdText = 'HOLD';
        const holdWidth = this.ctx.measureText(holdText).width;
        const labelWidth = this.ctx.measureText(label).width || label.length * fontSize * 0.6;
        const gap = 14;
        const totalWidth = holdWidth + 10 + 30 + gap + labelWidth;
        let x = centerX - totalWidth / 2;

        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(holdText, x, centerY + 1);
        x += holdWidth + 10;
        this.drawControlIconBox(x, centerY - 15, 30, 30, button, button === 'B' ? 'circle-b' : 'circle-a');
        x += 30 + gap;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, centerY + 1);
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

    drawSelectableSoftPadCommandButton(rect, button, label, selected, fontSize = 22) {
        this.ctx.fillStyle = selected ? '#0a5b86' : 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 10);
        this.ctx.fill();
        this.ctx.strokeStyle = selected ? '#ff0' : 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = selected ? 2 : 1;
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
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2 + 1);
        this.ctx.restore();
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

    wrapTextByWidth(text, maxWidth) {
        const source = String(text);
        if (source.includes(' ')) return this.wrapText(source, maxWidth);

        const lines = [];
        let line = '';
        for (const char of Array.from(source)) {
            const candidate = `${line}${char}`;
            if (this.ctx.measureText(candidate).width <= maxWidth || !line) {
                line = candidate;
            } else {
                lines.push(line);
                line = char;
            }
        }
        if (line) lines.push(line);
        return lines;
    }
}
