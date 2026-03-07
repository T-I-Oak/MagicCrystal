window.onload = async () => {
    const assets = new Assets();
    await assets.load();

    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    const game = new Game(canvas, assets);

    // Basic Scaling Logic
    const scaleGame = () => {
        const viewport = document.getElementById('viewport');
        const container = document.getElementById('game-container');
        const debug = document.getElementById('debug-panel');
        if (!viewport || !container) return;

        // Use VisualViewport for accurate visible area on Safari (excludes UI like tabs)
        const vv = window.visualViewport;
        const vw = vv ? vv.width : window.innerWidth;
        const vh = vv ? vv.height : window.innerHeight;

        // Base resolution including border (4px * 2) + 2px safety margin
        const bw = 970;
        const bh = 650;

        // Scale to fit while maintaining aspect ratio
        let scale = Math.min(vw / bw, vh / bh);

        if (game && game.screenSize) {
            scale *= (game.screenSize / 100);
        }

        // Apply absolute centering with translate
        container.style.transform = `translate(-50%, 0) scale(${scale})`;

        // Update Debug Panel
        if (debug) {
            const rect = container.getBoundingClientRect();
            const safeTop = getComputedStyle(viewport).paddingTop || "0px";
            debug.innerHTML = `
                v: ${game ? game.version : '?'}<br>
                Viewport: ${Math.round(vw)}x${Math.round(vh)}<br>
                SafeTop: ${safeTop}<br>
                Game Rect Left: ${Math.round(rect.left)}px<br>
                Game Rect Top: ${Math.round(rect.top)}px<br>
                Game Width: ${Math.round(rect.width)}px<br>
                Scale: ${scale.toFixed(3)}
            `;
        }
    };

    window.addEventListener('resize', scaleGame);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scaleGame);
        window.visualViewport.addEventListener('scroll', scaleGame);
    }
    scaleGame(); // Initial Scale

    // Drag Handle Logic
    const handles = document.querySelectorAll('.drag-handle');
    let isDragging = false;

    const onDragStart = (e) => {
        if (!game || game.state !== 'SETTINGS' || game.settingsCursor !== 2) return;
        isDragging = true;
        e.preventDefault();
        e.stopPropagation();
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const viewport = document.getElementById('viewport');
        const rect = viewport.getBoundingClientRect();

        // Convert to Percentage (0-100)
        let px = ((clientX - rect.left) / rect.width) * 100;
        let py = ((rect.bottom - clientY) / rect.height) * 100; // Bottom is 0

        // Clamp
        px = Math.max(0, Math.min(100, px));
        py = Math.max(0, Math.min(100, py));

        game.padPosX = Math.floor(px);
        game.padPosY = Math.floor(py);
        game.updatePadLayout();
    };

    const onDragEnd = (e) => {
        isDragging = false;
        if (game) game.saveSettings();
    };

    handles.forEach(h => {
        h.addEventListener('mousedown', onDragStart);
        h.addEventListener('touchstart', onDragStart, { passive: false });
    });

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);

    // Touch Controls Binding
    const btns = document.querySelectorAll('#touch-controls .btn');
    btns.forEach(btn => {
        const key = btn.getAttribute('data-key');

        const down = (e) => {
            e.preventDefault();
            game.input.setVirtualKey(key, true);
        };
        const up = (e) => {
            e.preventDefault();
            game.input.setVirtualKey(key, false);
        };

        // Touch Events
        btn.addEventListener('touchstart', down, { passive: false });
        btn.addEventListener('touchend', up, { passive: false });

        // Mouse Events (for testing on Desktop)
        btn.addEventListener('mousedown', down);
        btn.addEventListener('mouseup', up);
        btn.addEventListener('mouseleave', up); // Ensure release if slide out
    });

    // Disable double tap zoom on buttons
    document.addEventListener('dblclick', function (event) {
        event.preventDefault();
    }, { passive: false });

    // --- Menu Tap / Click Support (TITLE & SETTINGS & SELECT) ---
    const getCanvasPointer = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    let lastY = 0;
    let isMoving = false;

    const handleMenuPointerDown = (clientX, clientY) => {
        if (!game) return;
        const { x, y } = getCanvasPointer(clientX, clientY);
        lastY = clientY;
        isMoving = false;

        // SELECT stage menu - BACK button area (Bottom-right)
        if (game.state === 'SELECT') {
            if (x > 720 && x < 940 && y > 580) {
                game.input.setVirtualKey('x', true);
                return;
            }
        }
        // HOW_TO_PLAY back button
        if (game.state === 'HOW_TO_PLAY') {
            if (x > 720 && x < 940 && y > 580) {
                // Return via virtual confirm
                game.input.setVirtualKey('Enter', true);
                return;
            }
        }
        // PLAY / EDITOR state
        if (game.state === 'PLAY' || game.state === 'EDITOR') {
            if (x > 720 && x < 940 && y > 580) {
                // BACK / RETIRE
                game.input.setVirtualKey('x', true);
            } else if (game.state === 'EDITOR' && y < 80) {
                // EDITOR: Tile Guide Area (Header)
                const guideX = 200;
                const column = Math.floor((x - guideX) / 200);
                const row = Math.floor((y - 15) / 200); // Wait, vertical spacing was 25!
                // Re-calculating row: y=15 to 40 is row 0, y=40 to 65 is row 1.
                const actualRow = (y < 40) ? 0 : 1;
                if (column >= 0 && column < 4 && y < 65) {
                    const index = column + actualRow * 4;
                    if (index >= 0 && index <= 7) {
                        game.editor.selectedTile = index;
                    }
                }
            } else {
                // Grid area
                if (game.state === 'EDITOR') {
                    // Update cursor and simulate placement
                    const tx = Math.floor(x / 40);
                    const ty = Math.floor((y - 80) / 40);
                    if (tx >= 0 && tx < game.level.cols && ty >= 0 && ty < game.level.rows) {
                        game.editor.cx = tx;
                        game.editor.cy = ty;
                        game.input.setVirtualKey('z', true); // Place tile
                    }
                } else {
                    // PLAY movement
                    game.input.isPointerDown = true;
                    game.input.pointerX = x;
                    game.input.pointerY = y;
                }
            }
            return;
        }

        // SETTINGS menu
        if (game.state === 'SETTINGS') {
            const menuBaseY = 160;
            const boxWidth = 600;
            const boxX = (canvas.width - boxWidth) / 2;
            const itemYStart = menuBaseY + 100;
            const itemGap = 55;

            if (x < boxX || x > boxX + boxWidth || y < menuBaseY || y > menuBaseY + 420) return;

            const index = Math.floor((y - (itemYStart - 25)) / itemGap);
            if (index < 0 || index > 5) return;

            game.settingsCursor = index;

            // Handle Interaction
            if (index === 0 || index === 4 || (index === 3 && game.padType !== 0)) {
                // Slider Interaction
                isMoving = true;
                game.input.isPointerDown = true;
                updateSliderValue(index, x);
            } else if (index === 1) {
                // Segmented Control Interaction
                const sw = 240;
                const tx = boxX + boxWidth - 280;
                if (x >= tx && x <= tx + sw) {
                    const segmentIndex = Math.floor((x - tx) / (sw / 3));
                    game.padType = segmentIndex;

                    // Smart auto-positioning
                    if (game.padType === 1 && game.padPosX === 15) game.padPosX = 50;
                    if (game.padType === 2 && game.padPosX === 50) game.padPosX = 15;

                    game.updatePadLayout();
                    game.saveSettings();
                }
            } else if (index === 5) {
                // BACK
                game.input.setVirtualKey('Enter', true);
                setTimeout(() => game.input.setVirtualKey('Enter', false), 50);
            }
            return;
        }
    };

    const handleMenuPointerMove = (clientX, clientY) => {
        if (!game) return;
        const { x, y } = getCanvasPointer(clientX, clientY);

        if (game.state === 'HOW_TO_PLAY') {
            const dy = clientY - lastY;
            if (Math.abs(dy) > 5) isMoving = true;

            game.howToPlayScroll -= dy * 1.5;
            lastY = clientY;
            return;
        }

        if (game.state === 'SETTINGS' && isMoving) {
            updateSliderValue(game.settingsCursor, x);
            return;
        }

        if (game.state === 'PLAY' && game.input.isPointerDown) {
            game.input.pointerX = x;
            game.input.pointerY = y;
        }
    };

    const updateSliderValue = (index, x) => {
        const boxWidth = 600;
        const boxX = (canvas.width - boxWidth) / 2;
        const tx = boxX + boxWidth - 200;
        const trackW = 160;
        let ratio = (x - tx) / trackW;
        ratio = Math.max(0, Math.min(1, ratio));

        if (index === 0) { // SPEED
            game.targetFPS = Math.round(30 + ratio * (60 - 30));
            game.deltaTime = 1000 / game.targetFPS;
            game.saveSettings();
        } else if (index === 3) { // PAD SIZE
            game.padSize = Math.round(50 + ratio * (150 - 50));
            game.updatePadLayout();
            game.saveSettings();
        } else if (index === 4) { // SCREEN SIZE
            game.tempScreenSize = Math.round(50 + ratio * (100 - 50));
            // Only update preview, no dispatch resize here
        }
    };

    const handleMenuPointerUp = () => {
        if (!game) return;

        // Finalize Screen Size if adjusted
        if (game.state === 'SETTINGS' && game.screenSize !== game.tempScreenSize) {
            game.screenSize = game.tempScreenSize;
            window.dispatchEvent(new Event('resize'));
            game.saveSettings();
        }
        isMoving = false;

        // Always release virtual keys and pointer state
        game.input.setVirtualKey('x', false);
        game.input.setVirtualKey('z', false);
        game.input.setVirtualKey('Enter', false);
        game.input.setVirtualKey('ArrowUp', false);
        game.input.setVirtualKey('ArrowDown', false);
        game.input.setVirtualKey('ArrowLeft', false);
        game.input.setVirtualKey('ArrowRight', false);
        game.input.isPointerDown = false;
    };

    const handleMenuPointerClick = (clientX, clientY) => {
        if (!game || isMoving) return;
        const { x, y } = getCanvasPointer(clientX, clientY);

        // TITLE main menu
        if (game.state === 'TITLE') {
            const menuBaseY = 250;
            const boxX = 260;
            const boxW = 440;
            const boxY = menuBaseY;
            const boxH = 200;

            if (x < boxX || x > boxX + boxW || y < boxY || y > boxY + boxH) return;

            let index = -1;
            if (y < menuBaseY + 65) index = 0;
            else if (y < menuBaseY + 105) index = 1;
            else if (y < menuBaseY + 145) index = 2;
            else index = 3;

            game.titleCursor = index;
            game.input.setVirtualKey('Enter', true);
            setTimeout(() => game.input.setVirtualKey('Enter', false), 50);
            return;
        }

        // SELECT stage menu (Grid only, BACK is handled via long press)
        if (game.state === 'SELECT') {
            const gridX = 60;
            const gridY = 80;
            const gapX = 85;
            const gapY = 85;
            const itemW = 72;
            const itemH = 39;

            for (let i = 0; i < 50; i++) {
                const col = i % 10;
                const row = Math.floor(i / 10);
                const dx = gridX + col * gapX;
                const dy = gridY + row * gapY;

                if (x >= dx - 5 && x <= dx + itemW + 5 && y >= dy - 10 && y <= dy + itemH + 10) {
                    game.selectCursor = i;
                    game.input.setVirtualKey('Enter', true);
                    setTimeout(() => game.input.setVirtualKey('Enter', false), 50);
                    return;
                }
            }
        }
    };

    canvas.addEventListener('mousedown', (e) => handleMenuPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => {
        if (e.buttons & 1) handleMenuPointerMove(e.clientX, e.clientY);
    });
    canvas.addEventListener('mouseup', handleMenuPointerUp);
    canvas.addEventListener('mouseleave', handleMenuPointerUp);
    canvas.addEventListener('click', (e) => handleMenuPointerClick(e.clientX, e.clientY));

    canvas.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        handleMenuPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        handleMenuPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    canvas.addEventListener('touchend', handleMenuPointerUp);
    canvas.addEventListener('touchcancel', handleMenuPointerUp);

    game.start();
    console.log("Game Started (Responsive Version)");
};
