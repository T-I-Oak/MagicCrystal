export const TITLE_MENU_LAYOUT = {
    boxX: 260,
    boxY: 250,
    boxWidth: 440,
    boxHeight: 200,
    itemCenterX: 480,
    itemStartY: 295,
    itemGap: 40,
    itemHitOffsetY: -32,
    itemHitHeight: 40,
    itemCount: 4
};

export const BACK_BUTTON_LAYOUT = {
    x: 720,
    bottomOffset: 55,
    width: 220,
    height: 45,
    footerHeight: 60,
    playYOffset: 10,
    playHeight: 40
};

export const SELECT_STAGE_GRID_LAYOUT = {
    x: 60,
    y: 80,
    columns: 10,
    itemCount: 50,
    gapX: 85,
    gapY: 85,
    itemWidth: 72,
    itemHeight: 39,
    hitPaddingX: 5,
    hitPaddingTop: 10,
    hitPaddingBottom: 10
};

export function createTitleMenuLayout() {
    return {
        ...TITLE_MENU_LAYOUT,
        box: {
            x: TITLE_MENU_LAYOUT.boxX,
            y: TITLE_MENU_LAYOUT.boxY,
            width: TITLE_MENU_LAYOUT.boxWidth,
            height: TITLE_MENU_LAYOUT.boxHeight
        },
        getItemTextPoint(index) {
            return {
                x: TITLE_MENU_LAYOUT.itemCenterX,
                y: TITLE_MENU_LAYOUT.itemStartY + index * TITLE_MENU_LAYOUT.itemGap
            };
        },
        getItemRect(index) {
            return {
                x: TITLE_MENU_LAYOUT.boxX,
                y: TITLE_MENU_LAYOUT.itemStartY +
                    index * TITLE_MENU_LAYOUT.itemGap +
                    TITLE_MENU_LAYOUT.itemHitOffsetY,
                width: TITLE_MENU_LAYOUT.boxWidth,
                height: TITLE_MENU_LAYOUT.itemHitHeight
            };
        },
        getItemIndexAt(x, y) {
            for (let index = 0; index < TITLE_MENU_LAYOUT.itemCount; index++) {
                const rect = this.getItemRect(index);
                if (
                    x >= rect.x &&
                    x <= rect.x + rect.width &&
                    y >= rect.y &&
                    y <= rect.y + rect.height
                ) {
                    return index;
                }
            }
            return -1;
        }
    };
}

export function createBackButtonLayout(canvasHeight, variant = 'footer') {
    const isPlayFooter = variant === 'playFooter';
    const y = isPlayFooter
        ? canvasHeight - BACK_BUTTON_LAYOUT.footerHeight + BACK_BUTTON_LAYOUT.playYOffset
        : canvasHeight - BACK_BUTTON_LAYOUT.bottomOffset;
    const height = isPlayFooter ? BACK_BUTTON_LAYOUT.playHeight : BACK_BUTTON_LAYOUT.height;

    return {
        x: BACK_BUTTON_LAYOUT.x,
        y,
        width: BACK_BUTTON_LAYOUT.width,
        height,
        contains(x, y) {
            return (
                x >= this.x &&
                x <= this.x + this.width &&
                y >= this.y &&
                y <= this.y + this.height
            );
        }
    };
}

export function createSelectStageGridLayout() {
    return {
        ...SELECT_STAGE_GRID_LAYOUT,
        getItemRect(index) {
            const col = index % SELECT_STAGE_GRID_LAYOUT.columns;
            const row = Math.floor(index / SELECT_STAGE_GRID_LAYOUT.columns);
            return {
                x: SELECT_STAGE_GRID_LAYOUT.x + col * SELECT_STAGE_GRID_LAYOUT.gapX,
                y: SELECT_STAGE_GRID_LAYOUT.y + row * SELECT_STAGE_GRID_LAYOUT.gapY,
                width: SELECT_STAGE_GRID_LAYOUT.itemWidth,
                height: SELECT_STAGE_GRID_LAYOUT.itemHeight
            };
        },
        getItemHitRect(index) {
            const rect = this.getItemRect(index);
            return {
                x: rect.x - SELECT_STAGE_GRID_LAYOUT.hitPaddingX,
                y: rect.y - SELECT_STAGE_GRID_LAYOUT.hitPaddingTop,
                width: rect.width + SELECT_STAGE_GRID_LAYOUT.hitPaddingX * 2,
                height: rect.height + SELECT_STAGE_GRID_LAYOUT.hitPaddingTop + SELECT_STAGE_GRID_LAYOUT.hitPaddingBottom
            };
        },
        getItemIndexAt(x, y) {
            for (let index = 0; index < SELECT_STAGE_GRID_LAYOUT.itemCount; index++) {
                const rect = this.getItemHitRect(index);
                if (
                    x >= rect.x &&
                    x <= rect.x + rect.width &&
                    y >= rect.y &&
                    y <= rect.y + rect.height
                ) {
                    return index;
                }
            }
            return -1;
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

function getActionButtonWidth(item, minWidth = 96) {
    const horizontalPadding = 24;
    const confirmFaceReserve = 36;
    const labels = item.labelCandidates?.length ? item.labelCandidates : [item.label];
    const labelWidth = labels.reduce((max, label) => Math.max(max, estimateButtonLabelWidth(label)), 0);
    return Math.ceil(Math.max(minWidth, labelWidth + horizontalPadding + confirmFaceReserve));
}

export function createSelectStageFunctionBarLayout(canvasWidth = 960, canvasHeight = 720, actionItems = []) {
    const smartSize = 48;
    const itemHeight = 44;
    const gap = 8;
    const y = canvasHeight - 64;
    const leftX = 24;
    const back = { x: canvasWidth - 234, y, width: 210, height: itemHeight };
    const items = (actionItems ?? []).map((item) => ({
        id: item.id,
        width: getActionButtonWidth(item, 120)
    }));

    const availableWidth = back.x - 86 - smartSize - gap * (items.length + 1);
    const totalWidth = items.reduce((sum, item) => sum + item.width, 0);
    if (totalWidth > availableWidth) {
        const minWidth = 120;
        const shrinkTarget = totalWidth - availableWidth;
        const shrinkable = items.reduce((sum, item) => sum + Math.max(0, item.width - minWidth), 0);
        if (shrinkable > 0) {
            items.forEach((item) => {
                const share = Math.max(0, item.width - minWidth) / shrinkable;
                item.width = Math.max(minWidth, Math.floor(item.width - shrinkTarget * share));
            });
        }
    }

    let x = 86;
    const layoutItems = items.map((item) => {
        const rect = { x, y, width: item.width, height: itemHeight };
        x += item.width + gap;
        return { id: item.id, rect };
    });
    const maxRight = layoutItems.reduce((max, item) => Math.max(max, item.rect.x + item.rect.width), 86);
    const smartRightX = Math.min(back.x - gap - smartSize, maxRight + gap);

    return {
        smartLeft: { x: leftX, y, width: smartSize, height: smartSize },
        smartRight: { x: smartRightX, y, width: smartSize, height: smartSize },
        back,
        items: layoutItems
    };
}

function createFunctionButtonSpecs(actionItems, availableWidth) {
    const gap = 8;
    const minWidth = 96;
    const rowIds = [
        ['play', 'edit', 'create', 'copy', 'paste'],
        ['favorite', 'share', 'delete']
    ];
    const widthById = new Map((actionItems ?? []).map((item) => {
        return [item.id, getActionButtonWidth(item, minWidth)];
    }));

    return rowIds.flatMap((ids, row) => {
        const rowItems = ids
            .filter((id) => widthById.has(id))
            .map((id) => ({ id, width: widthById.get(id) }));
        const totalGap = Math.max(0, rowItems.length - 1) * gap;
        const totalWidth = rowItems.reduce((sum, item) => sum + item.width, 0) + totalGap;
        if (totalWidth > availableWidth) {
            const shrinkTarget = totalWidth - availableWidth;
            const shrinkable = rowItems.reduce((sum, item) => sum + Math.max(0, item.width - minWidth), 0);
            if (shrinkable > 0) {
                rowItems.forEach((item) => {
                    const share = Math.max(0, item.width - minWidth) / shrinkable;
                    item.width = Math.max(minWidth, Math.floor(item.width - shrinkTarget * share));
                });
            }
        }

        let x = 86;
        return rowItems.map((item) => {
            const spec = { id: item.id, row, x, width: item.width };
            x += item.width + gap;
            return spec;
        });
    });
}

export function createExtraMapFunctionBarLayout(canvasWidth = 960, canvasHeight = 720, actionItems = []) {
    const smartSize = 48;
    const itemHeight = 44;
    const gap = 8;
    const row1Y = canvasHeight - 116;
    const row2Y = canvasHeight - 64;
    const leftX = 24;
    const back = { x: canvasWidth - 234, y: row2Y, width: 210, height: itemHeight };
    const availableWidth = back.x - 86 - smartSize - gap * 2;
    const itemSpecs = createFunctionButtonSpecs(actionItems, availableWidth);
    const maxRight = itemSpecs.reduce((max, spec) => Math.max(max, spec.x + spec.width), 86);
    const rightX = Math.min(back.x - gap - smartSize, maxRight + gap);

    return {
        smartLeft: { x: leftX, y: row1Y + Math.round((itemHeight * 2 + gap - smartSize) / 2), width: smartSize, height: smartSize },
        smartRight: { x: rightX, y: row1Y + Math.round((itemHeight * 2 + gap - smartSize) / 2), width: smartSize, height: smartSize },
        back,
        items: itemSpecs.map((spec) => ({
            id: spec.id,
            rect: {
                x: spec.x,
                y: spec.row === 0 ? row1Y : row2Y,
                width: spec.width,
                height: itemHeight
            }
        }))
    };
}

export function createExtraMapDeleteConfirmLayout(canvasWidth = 960, canvasHeight = 720) {
    const box = {
        x: Math.round((canvasWidth - 560) / 2),
        y: Math.round((canvasHeight - 260) / 2),
        width: 560,
        height: 260
    };
    const buttonWidth = 210;
    const buttonHeight = 48;
    const gap = 20;
    const buttonY = box.y + box.height - 70;
    const centerX = box.x + box.width / 2;

    return {
        box,
        confirmButton: {
            x: centerX - buttonWidth - gap / 2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        },
        cancelButton: {
            x: centerX + gap / 2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        }
    };
}

export function createCongratulationsLayout(canvasWidth = 960, canvasHeight = 660) {
    const imageMaxWidth = 900;
    const imageMaxHeight = canvasHeight - 118;
    const buttonWidth = 220;
    const buttonHeight = 48;
    const gap = 28;
    const buttonY = canvasHeight - 68;
    const centerX = canvasWidth / 2;

    return {
        image: {
            x: Math.round((canvasWidth - imageMaxWidth) / 2),
            y: 18,
            width: imageMaxWidth,
            height: imageMaxHeight
        },
        shareButton: {
            x: Math.round(centerX - buttonWidth - gap / 2),
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        },
        titleButton: {
            x: Math.round(centerX + gap / 2),
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        }
    };
}
