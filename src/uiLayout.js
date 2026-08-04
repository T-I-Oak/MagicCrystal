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

export function createExtraMapActionMenuLayout(anchorRect, itemCount, canvasWidth = 960, canvasHeight = 720) {
    const itemHeight = 28;
    const padding = 8;
    const width = 128;
    const height = itemCount * itemHeight + padding * 2;
    const margin = 10;
    const minY = 56;
    const maxY = Math.max(minY, canvasHeight - 88 - height);
    let x = anchorRect.x + anchorRect.width + margin;
    let y = anchorRect.y - 4;

    if (x + width > canvasWidth - margin) {
        x = anchorRect.x - width - margin;
    }
    y = Math.min(maxY, Math.max(minY, y));

    return {
        x,
        y,
        width,
        height,
        itemCount,
        itemHeight,
        padding,
        getItemRect(index) {
            return {
                x: this.x + this.padding,
                y: this.y + this.padding + index * this.itemHeight,
                width: this.width - this.padding * 2,
                height: this.itemHeight
            };
        },
        getItemIndexAt(x, y) {
            for (let index = 0; index < this.itemCount; index++) {
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

export function createExtraMapDeleteConfirmLayout(canvasWidth = 960, canvasHeight = 720) {
    const box = {
        x: Math.round(canvasWidth / 2 - 240),
        y: Math.round(canvasHeight / 2 - 115),
        width: 480,
        height: 230
    };
    const buttonWidth = 180;
    const buttonHeight = 44;
    const buttonY = box.y + box.height - 62;

    return {
        box,
        confirmButton: {
            x: box.x + 55,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        },
        cancelButton: {
            x: box.x + box.width - 55 - buttonWidth,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        }
    };
}
