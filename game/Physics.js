class Physics {
    isAligned(player) {
        return (player.x % 4 === 0 && player.y % 4 === 0);
    }
    isSolid(tileId) { return (tileId === 1 || tileId === 2); }

    update(player, level, input, game) {
        if (player.lives <= 0) return;

        // Movement Step: 1 unit (10px) but logic uses 1/4 tile units.
        // We run 1 tick of movement per update call (assuming updatePlay logic)
        // Original basic: Moves 1 unit per VSYNC?
        // Our logic: updatePlay called every frame (if deltaTime accumulated)
        // One frame = One movement step.

        const gridX = Math.floor(player.x / 4);
        const gridY = Math.floor(player.y / 4);
        const subX = player.x % 4;
        const subY = player.y % 4;
        const isAligned = (subX === 0 && subY === 0);

        if (typeof player.sy === 'undefined') player.sy = 0;

        if (player.jumpState === 0) {
            // === WALK (JS=0) ===
            // If moving horizontally (subX != 0), continue horizontal movement
            if (subX !== 0) {
                player.sy = 0;
            }
            // If moving vertically (falling, subY != 0), continue vertical fall
            else if (subY !== 0) {
                player.sx = 0; player.sy = 1; // Enforce vertical drop
            } else {
                // Aligned: Check Below
                const tileBelow = level.getTile(gridX, gridY + 1);
                if (this.isSolid(tileBelow)) {
                    player.sx = 0; player.sy = 0;
                    this.processInput(player, level, input, game);
                } else {
                    // Start Fall (Stay in JS=0)
                    player.sx = 0; player.sy = 1;
                }
            }
        }

        if (player.jumpState > 0) {
            // === JUMP/FALL ===
            if (isAligned) {
                let sx = 0, sy = 0;
                let dir = player.faceRight ? 1 : -1;
                if (this.isSolid(level.getTile(gridX + dir, gridY))) sx = 0; else sx = dir;

                let vDir = (player.jumpState === 1) ? 1 : -1;
                const tileVertical = level.getTile(gridX, gridY + vDir);
                if (this.isSolid(tileVertical)) {
                    sy = 0;
                } else {
                    sy = vDir;
                }

                if (player.y <= 0 && vDir === -1) sy = 0;
                if (player.jumpState === 5 && sx !== 0) sy = 0;

                if (sx !== 0 && sy !== 0) {
                    if (this.isSolid(level.getTile(gridX + sx, gridY + sy))) sx = 0;
                }

                player.sx = sx; player.sy = sy;
            }
            if (player.jumpState > 1) player.jumpState--;
        }

        player.x += player.sx;
        player.y += player.sy;

        // Correct for landing immediately if now aligned after move
        if (player.jumpState > 0 && player.x % 4 === 0 && player.y % 4 === 0) {
            const nextGridX = player.x / 4;
            const nextGridY = player.y / 4;
            if (this.isSolid(level.getTile(nextGridX, nextGridY + 1))) {
                player.jumpState = 0;
            }
        }

        // Check Collection (Post Movement, if Aligned)
        const finalSubX = player.x % 4;
        const finalSubY = player.y % 4;
        if (finalSubX === 0 && finalSubY === 0) {
            this.checkCollection(player, level, game);
        }
    }

    checkCollection(player, level, game) {
        const gridX = Math.floor(player.x / 4);
        const gridY = Math.floor(player.y / 4);
        const tile = level.getTile(gridX, gridY);

        // Buried Check (Failure)
        if (tile === 1 || tile === 2) {
            if (game) game.handleGameOver();
            return;
        }

        // Crystal Collection
        if (tile === 4 || tile === 5) {
            const newTile = tile + 2; // 4->6 (Trace1), 5->7 (Trace2)
            level.setTile(gridX, gridY, newTile);

            if (game) {
                game.crystalCount--;
                game.ES = 0; // Always reset ES first
                if (tile === 4) game.ES = 60; // Set ES only for Red Crystal (4)
            }
        }

        // Clear Check (Portal)
        if (tile === 3 && game && game.crystalCount === 0) {
            game.handleLevelClear();
        }
    }

    processInput(player, level, input, game) {
        if (player.turnWait > 0) {
            player.turnWait--;
            if (player.turnWait <= 0) {
                player.turnWait = 0;
                player.isDigging = false; // Reset state
            }
            return;
        }

        // Digging (Down)
        if (input.stick === 2) {
            const gridX = Math.floor(player.x / 4);
            const gridY = Math.floor(player.y / 4);
            const tileBelow = level.getTile(gridX, gridY + 1);
            if (tileBelow === 1) { // Only Dig Dirt (1)
                level.setTile(gridX, gridY + 1, 6); // Turn into Dirt 2 (6)
                player.sx = 0; player.sy = 0;
                player.turnWait = 2; // Original DS=2
                player.isDigging = true;
                return;
            }
        }

        // Smart Keys (Q/E)
        if (input.smartLeft) {
            if (player.faceRight) {
                player.faceRight = false;
            } else {
                player.jumpState = 9;
            }
            return;
        }
        if (input.smartRight) {
            if (!player.faceRight) {
                player.faceRight = true;
            } else {
                player.jumpState = 9;
            }
            return;
        }

        // Standard Inputs
        // Jump: 8 (Up), 7 (UpLeft), 9 (UpRight)
        if (input.stick === 8 || input.stick === 7 || input.stick === 9) {
            // Auto-turn for diagonal jumps if facing wrong way
            let dx = 0;
            if (input.stick === 7) dx = -1;
            else if (input.stick === 9) dx = 1;

            if (dx !== 0 && ((dx === 1 && !player.faceRight) || (dx === -1 && player.faceRight))) {
                player.faceRight = (dx === 1);
                player.turnWait = 3;
                player.sx = 0;
                return;
            }
            player.jumpState = 9; return;
        }

        let dx = 0;
        // Check Move Intent
        if (input.stick === 4 || input.stick === 1) dx = -1;
        else if (input.stick === 6 || input.stick === 3) dx = 1;

        if (dx !== 0) {
            // Turn Logic: If changing direction, Turn ONLY.
            if ((dx === 1 && !player.faceRight) || (dx === -1 && player.faceRight)) {
                player.faceRight = (dx === 1);
                player.turnWait = 3; // 3 Frames Fixed Wait
                player.sx = 0;
                return;
            }

            // Move Logic (Already facing correct way)
            const gridX = Math.floor(player.x / 4);
            const gridY = Math.floor(player.y / 4);
            const tileNext = level.getTile(gridX + dx, gridY);
            if (!this.isSolid(tileNext)) {
                player.sx = dx;
            } else {
                player.sx = 0;
            }
        } else {
            player.sx = 0;
        }
    }
}
