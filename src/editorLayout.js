export const EDITOR_TILE_GUIDE_LAYOUT = {
    x: 200,
    y: 15,
    columns: 4,
    itemWidth: 200,
    itemHeight: 25,
    iconSize: 20,
    labelOffsetX: 25,
    labelOffsetY: 15,
    itemCount: 8
};

export const EDITOR_FUNCTION_BAR_LAYOUT = {
    y: 607,
    height: 44,
    marginX: 10,
    gap: 6,
    smartWidth: 46,
    discardWidth: 170
};

export const EDITOR_DIFFICULTY_MODAL_LAYOUT = {
    boxWidth: 640,
    boxHeight: 360,
    titleOffsetY: 58,
    valueOffsetY: 128,
    valueHitHalfHeight: 34,
    labelOffsetX: 62,
    valueControlOffsetX: 250,
    itemCount: 1,
    buttonWidth: 220,
    buttonHeight: 44,
    buttonBottomOffset: 54,
    itemSidePadding: 44,
    descriptionOffsetY: 178,
    descriptionHeight: 80
};

export const EDITOR_CONTROLS_MODAL_LAYOUT = {
    box: {
        x: 30,
        y: 95,
        width: 900,
        height: 520
    },
    contentPaddingX: 30,
    contentOffsetY: 78,
    footerHeight: 58,
    footerBottomPadding: 24,
    closeButtonWidth: 220,
    closeButtonHeight: 44,
    closeButtonTopPadding: 7
};

export function createEditorTileGuideLayout() {
    return {
        ...EDITOR_TILE_GUIDE_LAYOUT,
        getItemRect(index) {
            const col = index % EDITOR_TILE_GUIDE_LAYOUT.columns;
            const row = Math.floor(index / EDITOR_TILE_GUIDE_LAYOUT.columns);
            return {
                x: EDITOR_TILE_GUIDE_LAYOUT.x + col * EDITOR_TILE_GUIDE_LAYOUT.itemWidth,
                y: EDITOR_TILE_GUIDE_LAYOUT.y + row * EDITOR_TILE_GUIDE_LAYOUT.itemHeight,
                width: EDITOR_TILE_GUIDE_LAYOUT.itemWidth,
                height: EDITOR_TILE_GUIDE_LAYOUT.itemHeight
            };
        },
        getItemIndexAt(x, y) {
            if (
                x < EDITOR_TILE_GUIDE_LAYOUT.x ||
                y < EDITOR_TILE_GUIDE_LAYOUT.y ||
                x >= EDITOR_TILE_GUIDE_LAYOUT.x + EDITOR_TILE_GUIDE_LAYOUT.columns * EDITOR_TILE_GUIDE_LAYOUT.itemWidth
            ) {
                return -1;
            }

            const col = Math.floor((x - EDITOR_TILE_GUIDE_LAYOUT.x) / EDITOR_TILE_GUIDE_LAYOUT.itemWidth);
            const row = Math.floor((y - EDITOR_TILE_GUIDE_LAYOUT.y) / EDITOR_TILE_GUIDE_LAYOUT.itemHeight);
            const index = row * EDITOR_TILE_GUIDE_LAYOUT.columns + col;
            if (index < 0 || index >= EDITOR_TILE_GUIDE_LAYOUT.itemCount) {
                return -1;
            }

            const rect = this.getItemRect(index);
            if (y < rect.y || y >= rect.y + rect.height) {
                return -1;
            }

            return index;
        }
    };
}

function estimateButtonLabelWidth(label, fontSize = 18) {
    return Array.from(label ?? '').reduce((total, char) => {
        const codePoint = char.codePointAt(0);
        const isWide = codePoint > 0x2e80;
        return total + fontSize * (isWide ? 1 : 0.62);
    }, 0);
}

function getFunctionButtonWidth(item) {
    const minWidth = 96;
    const horizontalPadding = 20;
    const confirmFaceReserve = 36;
    const tileIconReserve = item.id === 'terrain' ? 28 : 0;
    const labels = item.labelCandidates?.length ? item.labelCandidates : [item.label];
    const labelWidth = labels.reduce((max, label) => Math.max(max, estimateButtonLabelWidth(label)), 0);
    return Math.ceil(Math.max(minWidth, labelWidth + horizontalPadding + confirmFaceReserve + tileIconReserve));
}

export function createEditorFunctionBarLayout(canvasWidth, functionItems = []) {
    const y = EDITOR_FUNCTION_BAR_LAYOUT.y;
    const height = EDITOR_FUNCTION_BAR_LAYOUT.height;
    const gap = EDITOR_FUNCTION_BAR_LAYOUT.gap;
    const minButtonWidth = 96;
    const discard = {
        x: canvasWidth - EDITOR_FUNCTION_BAR_LAYOUT.marginX - EDITOR_FUNCTION_BAR_LAYOUT.discardWidth,
        y,
        width: EDITOR_FUNCTION_BAR_LAYOUT.discardWidth,
        height
    };
    let x = EDITOR_FUNCTION_BAR_LAYOUT.marginX;

    const smartLeft = {
        x,
        y,
        width: EDITOR_FUNCTION_BAR_LAYOUT.smartWidth,
        height
    };
    x += smartLeft.width + gap;

    const specs = functionItems.map((item) => ({
        ...item,
        width: getFunctionButtonWidth(item)
    }));
    const availableWidth = Math.max(
        0,
        discard.x - x - EDITOR_FUNCTION_BAR_LAYOUT.smartWidth - gap * (specs.length + 1) - 2
    );
    const totalWidth = specs.reduce((sum, item) => sum + item.width, 0);
    if (totalWidth > availableWidth) {
        const shrinkTarget = totalWidth - availableWidth;
        const shrinkable = specs.reduce((sum, item) => sum + Math.max(0, item.width - minButtonWidth), 0);
        if (shrinkable > 0) {
            specs.forEach((item) => {
                const share = Math.max(0, item.width - minButtonWidth) / shrinkable;
                item.width = Math.max(minButtonWidth, Math.floor(item.width - shrinkTarget * share));
            });
        }
    }

    const items = specs.map((item) => {
        const rect = { x, y, width: item.width, height };
        x += item.width + gap;
        return { id: item.id, rect };
    });

    const smartRight = {
        x,
        y,
        width: EDITOR_FUNCTION_BAR_LAYOUT.smartWidth,
        height
    };
    x += smartRight.width + gap + 2;

    return {
        smartLeft,
        smartRight,
        items,
        discard,
        getItemRect(index) {
            return this.items[index]?.rect ?? null;
        }
    };
}

export function createEditorDifficultyModalLayout(canvasWidth, canvasHeight) {
    const box = {
        x: Math.round((canvasWidth - EDITOR_DIFFICULTY_MODAL_LAYOUT.boxWidth) / 2),
        y: Math.round((canvasHeight - EDITOR_DIFFICULTY_MODAL_LAYOUT.boxHeight) / 2),
        width: EDITOR_DIFFICULTY_MODAL_LAYOUT.boxWidth,
        height: EDITOR_DIFFICULTY_MODAL_LAYOUT.boxHeight
    };

    return {
        box,
        itemCount: EDITOR_DIFFICULTY_MODAL_LAYOUT.itemCount,
        title: {
            x: box.x + box.width / 2,
            y: box.y + EDITOR_DIFFICULTY_MODAL_LAYOUT.titleOffsetY
        },
        valueRect: {
            x: box.x + EDITOR_DIFFICULTY_MODAL_LAYOUT.itemSidePadding,
            y: box.y + EDITOR_DIFFICULTY_MODAL_LAYOUT.valueOffsetY - EDITOR_DIFFICULTY_MODAL_LAYOUT.valueHitHalfHeight,
            width: box.width - EDITOR_DIFFICULTY_MODAL_LAYOUT.itemSidePadding * 2,
            height: EDITOR_DIFFICULTY_MODAL_LAYOUT.valueHitHalfHeight * 2
        },
        valueLabel: {
            x: box.x + EDITOR_DIFFICULTY_MODAL_LAYOUT.labelOffsetX,
            y: box.y + EDITOR_DIFFICULTY_MODAL_LAYOUT.valueOffsetY
        },
        valueControlRect: {
            x: box.x + EDITOR_DIFFICULTY_MODAL_LAYOUT.valueControlOffsetX,
            y: box.y + EDITOR_DIFFICULTY_MODAL_LAYOUT.valueOffsetY - 22,
            width: box.width - EDITOR_DIFFICULTY_MODAL_LAYOUT.valueControlOffsetX - EDITOR_DIFFICULTY_MODAL_LAYOUT.itemSidePadding,
            height: 44
        },
        description: {
            x: box.x + EDITOR_DIFFICULTY_MODAL_LAYOUT.itemSidePadding,
            y: box.y + EDITOR_DIFFICULTY_MODAL_LAYOUT.descriptionOffsetY,
            width: box.width - EDITOR_DIFFICULTY_MODAL_LAYOUT.itemSidePadding * 2,
            height: EDITOR_DIFFICULTY_MODAL_LAYOUT.descriptionHeight
        },
        closeButton: {
            x: box.x + box.width - EDITOR_DIFFICULTY_MODAL_LAYOUT.itemSidePadding - EDITOR_DIFFICULTY_MODAL_LAYOUT.buttonWidth,
            y: box.y + box.height - EDITOR_DIFFICULTY_MODAL_LAYOUT.buttonBottomOffset,
            width: EDITOR_DIFFICULTY_MODAL_LAYOUT.buttonWidth,
            height: EDITOR_DIFFICULTY_MODAL_LAYOUT.buttonHeight
        },
        getItemRect(index) {
            if (index === 0) return this.valueRect;
            return null;
        }
    };
}

export function createEditorControlsModalLayout() {
    const box = { ...EDITOR_CONTROLS_MODAL_LAYOUT.box };
    const footer = {
        x: box.x + EDITOR_CONTROLS_MODAL_LAYOUT.contentPaddingX,
        y: box.y + box.height - EDITOR_CONTROLS_MODAL_LAYOUT.footerHeight - EDITOR_CONTROLS_MODAL_LAYOUT.footerBottomPadding,
        width: box.width - EDITOR_CONTROLS_MODAL_LAYOUT.contentPaddingX * 2,
        height: EDITOR_CONTROLS_MODAL_LAYOUT.footerHeight
    };

    return {
        box,
        content: {
            x: box.x + EDITOR_CONTROLS_MODAL_LAYOUT.contentPaddingX,
            y: box.y + EDITOR_CONTROLS_MODAL_LAYOUT.contentOffsetY,
            width: box.width - EDITOR_CONTROLS_MODAL_LAYOUT.contentPaddingX * 2,
            height: box.height - EDITOR_CONTROLS_MODAL_LAYOUT.contentOffsetY - EDITOR_CONTROLS_MODAL_LAYOUT.footerHeight - EDITOR_CONTROLS_MODAL_LAYOUT.footerBottomPadding
        },
        footer,
        closeButton: {
            x: footer.x + footer.width - EDITOR_CONTROLS_MODAL_LAYOUT.closeButtonWidth,
            y: footer.y + EDITOR_CONTROLS_MODAL_LAYOUT.closeButtonTopPadding,
            width: EDITOR_CONTROLS_MODAL_LAYOUT.closeButtonWidth,
            height: EDITOR_CONTROLS_MODAL_LAYOUT.closeButtonHeight
        }
    };
}
