import { SETTINGS_LAYOUT } from './settingsLayout.js';

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

export const EDITOR_MENU_LAYOUT = {
    boxY: SETTINGS_LAYOUT.boxY,
    boxWidth: SETTINGS_LAYOUT.boxWidth,
    boxHeight: SETTINGS_LAYOUT.boxHeight,
    titleOffsetY: SETTINGS_LAYOUT.titleOffsetY,
    itemStartOffsetY: SETTINGS_LAYOUT.itemStartOffsetY,
    itemGap: SETTINGS_LAYOUT.itemGap,
    itemHitHalfHeight: SETTINGS_LAYOUT.itemHitHalfHeight,
    markerOffsetX: SETTINGS_LAYOUT.markerOffsetX,
    labelOffsetX: SETTINGS_LAYOUT.labelOffsetX,
    valueRightOffsetX: SETTINGS_LAYOUT.languageRightOffsetX,
    valueWidth: SETTINGS_LAYOUT.languageWidth,
    descriptionOffsetY: 185,
    descriptionHeight: 80,
    itemRows: [0, 1, 4, 5, 6],
    itemCount: 5
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

export function createEditorMenuLayout(canvasWidth) {
    const boxX = (canvasWidth - EDITOR_MENU_LAYOUT.boxWidth) / 2;

    return {
        box: {
            x: boxX,
            y: EDITOR_MENU_LAYOUT.boxY,
            width: EDITOR_MENU_LAYOUT.boxWidth,
            height: EDITOR_MENU_LAYOUT.boxHeight
        },
        itemCount: EDITOR_MENU_LAYOUT.itemCount,
        title: {
            x: canvasWidth / 2,
            y: EDITOR_MENU_LAYOUT.boxY + EDITOR_MENU_LAYOUT.titleOffsetY
        },
        description: {
            x: boxX + EDITOR_MENU_LAYOUT.labelOffsetX,
            y: EDITOR_MENU_LAYOUT.boxY + EDITOR_MENU_LAYOUT.descriptionOffsetY,
            width: EDITOR_MENU_LAYOUT.boxWidth - EDITOR_MENU_LAYOUT.labelOffsetX * 2,
            height: EDITOR_MENU_LAYOUT.descriptionHeight
        },
        markerX: boxX + EDITOR_MENU_LAYOUT.labelOffsetX - EDITOR_MENU_LAYOUT.markerOffsetX,
        labelX: boxX + EDITOR_MENU_LAYOUT.labelOffsetX,
        value: {
            x: boxX + EDITOR_MENU_LAYOUT.boxWidth - EDITOR_MENU_LAYOUT.valueRightOffsetX,
            width: EDITOR_MENU_LAYOUT.valueWidth
        },
        getItemY(index) {
            const row = EDITOR_MENU_LAYOUT.itemRows[index] ?? 0;
            return EDITOR_MENU_LAYOUT.boxY + EDITOR_MENU_LAYOUT.itemStartOffsetY + row * EDITOR_MENU_LAYOUT.itemGap;
        },
        getItemRect(index) {
            const itemY = this.getItemY(index);
            return {
                x: boxX,
                y: itemY - EDITOR_MENU_LAYOUT.itemHitHalfHeight,
                width: EDITOR_MENU_LAYOUT.boxWidth,
                height: EDITOR_MENU_LAYOUT.itemHitHalfHeight * 2
            };
        },
        getItemIndexAt(x, y) {
            if (
                x < boxX ||
                x > boxX + EDITOR_MENU_LAYOUT.boxWidth ||
                y < EDITOR_MENU_LAYOUT.boxY ||
                y > EDITOR_MENU_LAYOUT.boxY + EDITOR_MENU_LAYOUT.boxHeight
            ) {
                return -1;
            }

            for (let index = 0; index < EDITOR_MENU_LAYOUT.itemCount; index++) {
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
