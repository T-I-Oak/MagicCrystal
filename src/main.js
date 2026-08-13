import { Assets } from './Assets.js';
import { Game } from './Game.js';
import { setupLanguageSelector } from '../../GameWorksOAK/src/lib/core/i18n.js';
import { SUPPORTED_LANGUAGES } from './i18nText.js';
import { createSettingsLayout, isSettingsSliderHit } from './settingsLayout.js';
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
    createSelectStageFunctionBarLayout,
    createSelectStageGridLayout,
    createTitleMenuLayout
} from './uiLayout.js';
import { createCanvasPointerMapper, createRectAction, dispatchRectAction } from './canvasUi.js';

window.onload = async () => {
    const assets = new Assets();
    await assets.load();

    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    setupLanguageSelector('#language-selector', SUPPORTED_LANGUAGES);
    const game = new Game(canvas, assets);
    game.processSharedMapQuery();

    // Basic Scaling Logic
    const scaleGame = () => {
        const viewport = document.getElementById('viewport');
        const layer = document.getElementById('game-layer');
        const container = document.getElementById('game-container');
        if (!viewport || !container) return;

        // Use VisualViewport for accurate visible area on Safari
        const vv = window.visualViewport;
        const vw = vv ? vv.width : window.innerWidth;
        const vh = vv ? vv.height : window.innerHeight;

        // Base resolution including border (4px * 2) + 2px safety margin
        const bw = 970;
        const bh = 670; // Updated from 650 for 660px canvas

        // Scale to fit while maintaining aspect ratio
        let scale = Math.min(vw / bw, vh / bh);
        if (game && game.screenSize) {
            scale *= (game.screenSize / 100);
        }

        const gameWidth = bw * scale;

        // OFFSET COMPENSATION: 
        // 1. Calculate ideal physical center: (vw - gameWidth) / 2
        // 2. Subtract parent's relative offset (viewport.left) to pinpoint absolute 0 on screen
        const logicalCenter = (vw - gameWidth) / 2;
        const parentLeft = viewport.getBoundingClientRect().left;
        const finalLeft = logicalCenter - parentLeft;

        container.style.left = `${finalLeft}px`;
        container.style.transform = `scale(${scale})`;

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
    const canvasPointer = createCanvasPointerMapper(canvas);
    const getCanvasPointer = (clientX, clientY) => canvasPointer.toCanvasPoint(clientX, clientY);

    let lastY = 0;
    let isMoving = false;
    let isPointerDownForMenu = false;

    const handleMenuPointerDown = (clientX, clientY) => {
        if (!game) return;
        isPointerDownForMenu = true;
        const { x, y } = getCanvasPointer(clientX, clientY);
        lastY = clientY;
        isMoving = false;

        const downActions = getPointerDownActions();
        if (dispatchRectAction(downActions, { x, y })) return;

        if (game.state === 'PLAY' || game.state === 'EDITOR') {
            if (game.state === 'EDITOR') {
                if (game.isEditingExtraMap()) return;
                const tx = Math.floor(x / 40);
                const ty = Math.floor((y - 80) / 40);
                if (tx >= 0 && tx < game.level.cols && ty >= 0 && ty < game.level.rows) {
                    game.editor.cx = tx;
                    game.editor.cy = ty;
                    game.input.setVirtualKey('z', true);
                }
            } else {
                game.input.isPointerDown = true;
                game.input.pointerX = x;
                game.input.pointerY = y;
            }
            return;
        }
    };

    const handleMenuPointerMove = (clientX, clientY) => {
        if (!game || !isPointerDownForMenu) return;
        const { x, y } = getCanvasPointer(clientX, clientY);

        if (game.state === 'HOW_TO_PLAY') {
            const dy = clientY - lastY;
            if (Math.abs(dy) > 5) isMoving = true;

            game.howToPlayScroll = Math.max(
                0,
                Math.min(game.howToPlayScroll - dy * 1.5, game.getHowToPlayScrollMax())
            );
            lastY = clientY;
            return;
        }

        if (game.state === 'EDITOR' && game.isEditingExtraMap() && game.extraMapEditorSession?.controlsOpen) {
            const dy = clientY - lastY;
            if (Math.abs(dy) > 5) isMoving = true;

            game.extraMapEditorSession.controlsScroll = Math.max(
                0,
                Math.min(game.extraMapEditorSession.controlsScroll - dy * 1.5, game.getExtraMapEditorControlsScrollMax())
            );
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
        const layout = createSettingsLayout(canvas.width);
        const tx = layout.slider.x;
        const trackW = layout.slider.width;
        let ratio = (x - tx) / trackW;
        ratio = Math.max(0, Math.min(1, ratio));

        if (index === 0) { // SPEED
            game.targetFPS = Math.round(10 + ratio * (60 - 10));
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
        isPointerDownForMenu = false;

        // Always release virtual keys and pointer state
        game.input.setVirtualKey('x', false);
        game.input.setVirtualKey('z', false);
        game.input.setVirtualKey('Enter', false);
        game.input.setVirtualKey('ArrowUp', false);
        game.input.setVirtualKey('ArrowDown', false);
        game.input.setVirtualKey('ArrowLeft', false);
        game.input.setVirtualKey('ArrowRight', false);
        game.input.setVirtualKey('q', false);
        game.input.setVirtualKey('e', false);
        game.input.isPointerDown = false;
    };

    const handleMenuPointerClick = (clientX, clientY) => {
        if (!game || isMoving) return;
        if (Date.now() - game.lastStateChange < 200) return; // Guard against ghost clicks after transition
        const { x, y } = getCanvasPointer(clientX, clientY);

        dispatchRectAction(getClickActions(), { x, y });
    };

    const pressVirtualKey = (key) => {
        game.input.setVirtualKey(key, true);
        setTimeout(() => game.input.setVirtualKey(key, false), 50);
    };

    const getPointerDownActions = () => {
        if (game.state === 'SELECT') {
            const functionBar = createSelectStageFunctionBarLayout(canvas.width, canvas.height, game.getSelectStageActionItems());
            const actions = [
                createRectAction(functionBar.back, () => game.input.setVirtualKey('x', true)),
                createRectAction(functionBar.smartLeft, () => {}),
                createRectAction(functionBar.smartRight, () => {})
            ];
            functionBar.items.forEach((item) => {
                actions.push(createRectAction(item.rect, () => {}));
            });
            return [
                ...actions
            ];
        }

        if (game.state === 'HOW_TO_PLAY') {
            return [
                createRectAction(createBackButtonLayout(canvas.height), () => game.input.setVirtualKey('x', true))
            ];
        }

        if (game.state === 'EXTRA_MAP') {
            if (game.extraMapDeleteConfirm || game.extraMapDownloadFullModalOpen) {
                return [
                    createRectAction({ x: 0, y: 0, width: canvas.width, height: canvas.height }, () => {})
                ];
            }
            const functionBar = createExtraMapFunctionBarLayout(canvas.width, canvas.height, game.getExtraMapActionItems());
            const actions = [
                createRectAction(functionBar.back, () => {})
            ];
            functionBar.items.forEach((item) => {
                actions.push(createRectAction(item.rect, () => {}));
            });
            actions.push(createRectAction(functionBar.smartLeft, () => {}));
            actions.push(createRectAction(functionBar.smartRight, () => {}));
            return actions;
        }

        if (game.state === 'PLAY' || game.state === 'EDITOR') {
            if (game.state === 'EDITOR' && game.isEditingExtraMap()) {
                if (
                    game.extraMapEditorSession.controlsOpen ||
                    game.extraMapEditorSession.difficultyOpen
                ) {
                    return [
                        createRectAction({ x: 0, y: 0, width: canvas.width, height: canvas.height }, () => {})
                    ];
                }

                const functionBar = createEditorFunctionBarLayout(canvas.width, game.getExtraMapEditorFunctionBarItems());
                const actions = [
                    createRectAction(functionBar.discard, () => game.input.setVirtualKey('x', true))
                ];
                functionBar.items.forEach((item) => {
                    actions.push(createRectAction(item.rect, () => {}));
                });
                const tileGuide = createEditorTileGuideLayout();
                for (let index = 0; index < tileGuide.itemCount; index++) {
                    actions.push(createRectAction(tileGuide.getItemRect(index), () => {}));
                }
                return actions;
            }

            const actions = [
                createRectAction(createBackButtonLayout(canvas.height, 'playFooter'), () => {
                    game.input.setVirtualKey('x', true);
                })
            ];

            if (game.state === 'EDITOR') {
                const tileGuide = createEditorTileGuideLayout();
                for (let index = 0; index < tileGuide.itemCount; index++) {
                    actions.push(createRectAction(tileGuide.getItemRect(index), () => {
                        game.editor.selectedTile = index;
                    }));
                }
            }

            return actions;
        }

        if (game.state === 'SETTINGS') {
            const layout = createSettingsLayout(canvas.width);
            const actions = Array.from({ length: layout.itemCount }, (_, index) => (
                createRectAction(layout.getItemRect(index), (point) => {
                    handleSettingsPointerDown(index, layout, point.x);
                })
            ));
            actions.push(createRectAction(layout.closeButton, () => {
                game.input.setVirtualKey('x', true);
            }));
            return actions;
        }

        return [];
    };

    const handleSettingsPointerDown = (index, layout, x) => {
        game.settingsCursor = index;

        if (index === 0 || index === 4 || (index === 3 && game.padType !== 0)) {
            if (!isSettingsSliderHit(layout, x)) return;
            isMoving = true;
            game.input.isPointerDown = true;
            updateSliderValue(index, x);
        } else if (index === 1) {
            const sw = layout.switch.width;
            const tx = layout.switch.x;
            if (x >= tx && x <= tx + sw) {
                const segmentIndex = Math.floor((x - tx) / (sw / 3));
                game.padType = segmentIndex;

                if (game.padType === 1 && game.padPosX === 15) game.padPosX = 50;
                if (game.padType === 2 && game.padPosX === 50) game.padPosX = 15;

                game.updatePadLayout();
                game.saveSettings();
            }
        } else if (index === 5) {
            const tx = layout.language.x;
            if (x >= tx && x <= tx + layout.language.width) {
                const midpoint = tx + layout.language.width / 2;
                game.changeLanguage(x < midpoint ? -1 : 1);
            }
        }
    };

    const getClickActions = () => {
        if (game.state === 'TITLE') {
            const titleMenu = createTitleMenuLayout();
            return Array.from({ length: titleMenu.itemCount }, (_, index) => (
                createRectAction(titleMenu.getItemRect(index), () => {
                    game.titleCursor = index;
                    pressVirtualKey('Enter');
                })
            ));
        }

        if (game.state === 'SELECT') {
            const functionBar = createSelectStageFunctionBarLayout(canvas.width, canvas.height, game.getSelectStageActionItems());
            const actions = [
                createRectAction(functionBar.smartLeft, () => pressVirtualKey('q')),
                createRectAction(functionBar.smartRight, () => pressVirtualKey('e'))
            ];
            functionBar.items.forEach((item, index) => {
                actions.push(createRectAction(item.rect, () => {
                    if (game.selectStageFunctionCursor !== index) {
                        game.selectStageFunctionCursor = index;
                        return;
                    }
                    game.executeSelectStageAction(index);
                }));
            });

            const grid = createSelectStageGridLayout();
            Array.from({ length: grid.itemCount }, (_, index) => (
                createRectAction(grid.getItemHitRect(index), () => {
                    if (game.selectCursor !== index) {
                        game.selectCursor = index;
                        return;
                    }
                    game.selectCursor = index;
                    game.executeSelectStageAction(game.selectStageFunctionCursor);
                })
            )).forEach((action) => actions.push(action));
            return actions;
        }

        if (game.state === 'SHARED_MAP_LOAD_ERROR') {
            return [
                createRectAction({ x: 0, y: 0, width: canvas.width, height: canvas.height }, () => {
                    pressVirtualKey('x');
                })
            ];
        }

        if (game.state === 'EXTRA_MAP') {
            if (game.extraMapDeleteConfirm) {
                const modal = createExtraMapDeleteConfirmLayout(canvas.width, canvas.height);
                return [
                    createRectAction(modal.confirmButton, () => {
                        game.confirmExtraMapDelete();
                    }),
                    createRectAction(modal.cancelButton, () => {
                        game.closeExtraMapDeleteConfirm();
                    }),
                    createRectAction({ x: 0, y: 0, width: canvas.width, height: canvas.height }, () => {})
                ];
            }

            if (game.extraMapDownloadFullModalOpen) {
                return [
                    createRectAction({ x: 0, y: 0, width: canvas.width, height: canvas.height }, () => {
                        game.closeExtraMapDownloadFullModal();
                    })
                ];
            }

            const functionBar = createExtraMapFunctionBarLayout(canvas.width, canvas.height, game.getExtraMapActionItems());
            const actions = [
                createRectAction(functionBar.smartLeft, () => pressVirtualKey('q')),
                createRectAction(functionBar.smartRight, () => pressVirtualKey('e')),
                createRectAction(functionBar.back, () => pressVirtualKey('x'))
            ];
            functionBar.items.forEach((item, index) => {
                actions.push(createRectAction(item.rect, () => {
                    if (game.extraMapFunctionCursor !== index) {
                        game.extraMapFunctionCursor = index;
                        return;
                    }
                    game.extraMapFunctionCursor = index;
                    game.executeExtraMapAction(index);
                }));
            });

            const grid = createSelectStageGridLayout();
            Array.from({ length: grid.itemCount }, (_, index) => (
                createRectAction(grid.getItemHitRect(index), () => {
                    if (game.extraMapCursor !== index) {
                        game.extraMapCursor = index;
                        return;
                    }
                    game.extraMapCursor = index;
                    game.executeExtraMapAction(game.extraMapFunctionCursor, index);
                })
            )).forEach((action) => actions.push(action));
            return actions;
        }

        if (game.state === 'EDITOR' && game.isEditingExtraMap()) {
            if (game.extraMapEditorSession.controlsOpen) {
                const modal = createEditorControlsModalLayout();
                return [
                    createRectAction(modal.closeButton, () => {
                        if (isMoving) return;
                        game.closeExtraMapEditorControls();
                    }),
                    createRectAction({ x: 0, y: 0, width: canvas.width, height: canvas.height }, () => {})
                ];
            }

            if (game.extraMapEditorSession.difficultyOpen) {
                const modal = createEditorDifficultyModalLayout(canvas.width, canvas.height);
                const actions = [
                    createRectAction(modal.valueRect, (point) => {
                        game.extraMapEditorSession.difficultyCursor = 0;
                        if (
                            point.x >= modal.valueControlRect.x &&
                            point.x <= modal.valueControlRect.x + modal.valueControlRect.width
                        ) {
                            const midpoint = modal.valueControlRect.x + modal.valueControlRect.width / 2;
                            const maxDifficulty = game.getMaxExtraMapDifficulty();
                            game.extraMapEditorSession.difficulty = point.x < midpoint
                                ? Math.max(1, game.extraMapEditorSession.difficulty - 1)
                                : Math.min(maxDifficulty, game.extraMapEditorSession.difficulty + 1);
                        }
                    }),
                    createRectAction(modal.closeButton, () => {
                        game.closeExtraMapEditorDifficultyModal();
                    })
                ];
                actions.push(createRectAction({ x: 0, y: 0, width: canvas.width, height: canvas.height }, () => {}));
                return actions;
            }

            const functionBar = createEditorFunctionBarLayout(canvas.width, game.getExtraMapEditorFunctionBarItems());
            const actions = [
                createRectAction(functionBar.smartLeft, () => pressVirtualKey('q')),
                createRectAction(functionBar.smartRight, () => pressVirtualKey('e'))
            ];
            functionBar.items.forEach((item) => {
                actions.push(createRectAction(item.rect, () => {
                    if (game.getExtraMapEditorFunctionBarId() !== item.id) {
                        game.selectExtraMapEditorFunctionBarItem(item.id);
                        return;
                    }
                    game.executeExtraMapEditorFunction();
                }));
            });

            const tileGuide = createEditorTileGuideLayout();
            for (let index = 0; index < tileGuide.itemCount; index++) {
                actions.push(createRectAction(tileGuide.getItemRect(index), () => {
                    game.selectExtraMapEditorTile(index);
                }));
            }

            for (let y = 0; y < game.level.rows; y++) {
                for (let x = 0; x < game.level.cols; x++) {
                    actions.push(createRectAction({
                        x: x * 40,
                        y: 80 + y * 40,
                        width: 40,
                        height: 40
                    }, () => {
                        game.tapExtraMapEditorCell(x, y);
                    }));
                }
            }
            return actions;
        }

        return [];
    };

    canvas.addEventListener('mousedown', (e) => handleMenuPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => {
        if (e.buttons & 1) handleMenuPointerMove(e.clientX, e.clientY);
    });
    canvas.addEventListener('mouseup', handleMenuPointerUp);
    canvas.addEventListener('mouseleave', handleMenuPointerUp);
    canvas.addEventListener('click', (e) => handleMenuPointerClick(e.clientX, e.clientY));
    canvas.addEventListener('wheel', (e) => {
        if (!game) return;
        if (game.state === 'HOW_TO_PLAY') {
            game.howToPlayScroll = Math.max(0, Math.min(game.howToPlayScroll + e.deltaY, game.getHowToPlayScrollMax()));
            e.preventDefault();
            return;
        }
        if (game.state === 'EDITOR' && game.isEditingExtraMap() && game.extraMapEditorSession?.controlsOpen) {
            game.extraMapEditorSession.controlsScroll = Math.max(
                0,
                Math.min(game.extraMapEditorSession.controlsScroll + e.deltaY, game.getExtraMapEditorControlsScrollMax())
            );
            e.preventDefault();
        }
    }, { passive: false });

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
};
