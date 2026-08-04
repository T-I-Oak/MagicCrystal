export const SETTINGS_LAYOUT = {
    boxY: 130,
    boxWidth: 600,
    boxHeight: 475,
    titleOffsetY: 50,
    itemStartOffsetY: 100,
    itemGap: 55,
    itemHitHalfHeight: 25,
    markerOffsetX: 25,
    labelOffsetX: 60,
    sliderRightOffsetX: 200,
    sliderWidth: 160,
    sliderHitPaddingX: 14,
    switchRightOffsetX: 280,
    switchWidth: 240,
    languageRightOffsetX: 250,
    languageWidth: 210,
    itemCount: 7
};

export function createSettingsLayout(canvasWidth) {
    const boxX = (canvasWidth - SETTINGS_LAYOUT.boxWidth) / 2;
    const itemYStart = SETTINGS_LAYOUT.boxY + SETTINGS_LAYOUT.itemStartOffsetY;

    return {
        box: {
            x: boxX,
            y: SETTINGS_LAYOUT.boxY,
            width: SETTINGS_LAYOUT.boxWidth,
            height: SETTINGS_LAYOUT.boxHeight
        },
        itemCount: SETTINGS_LAYOUT.itemCount,
        title: {
            x: canvasWidth / 2,
            y: SETTINGS_LAYOUT.boxY + SETTINGS_LAYOUT.titleOffsetY
        },
        getItemY(index) {
            return itemYStart + index * SETTINGS_LAYOUT.itemGap;
        },
        getItemRect(index) {
            const itemY = itemYStart + index * SETTINGS_LAYOUT.itemGap;
            return {
                x: boxX,
                y: itemY - SETTINGS_LAYOUT.itemHitHalfHeight,
                width: SETTINGS_LAYOUT.boxWidth,
                height: SETTINGS_LAYOUT.itemHitHalfHeight * 2
            };
        },
        getItemIndexAt(x, y) {
            if (
                x < boxX ||
                x > boxX + SETTINGS_LAYOUT.boxWidth ||
                y < SETTINGS_LAYOUT.boxY ||
                y > SETTINGS_LAYOUT.boxY + SETTINGS_LAYOUT.boxHeight
            ) {
                return -1;
            }

            const index = Math.floor((y - (itemYStart - SETTINGS_LAYOUT.itemHitHalfHeight)) / SETTINGS_LAYOUT.itemGap);
            const itemY = itemYStart + index * SETTINGS_LAYOUT.itemGap;
            if (Math.abs(y - itemY) > SETTINGS_LAYOUT.itemHitHalfHeight) {
                return -1;
            }

            return index >= 0 && index < SETTINGS_LAYOUT.itemCount ? index : -1;
        },
        markerX: boxX + SETTINGS_LAYOUT.labelOffsetX - SETTINGS_LAYOUT.markerOffsetX,
        labelX: boxX + SETTINGS_LAYOUT.labelOffsetX,
        slider: {
            x: boxX + SETTINGS_LAYOUT.boxWidth - SETTINGS_LAYOUT.sliderRightOffsetX,
            width: SETTINGS_LAYOUT.sliderWidth
        },
        switch: {
            x: boxX + SETTINGS_LAYOUT.boxWidth - SETTINGS_LAYOUT.switchRightOffsetX,
            width: SETTINGS_LAYOUT.switchWidth
        },
        language: {
            x: boxX + SETTINGS_LAYOUT.boxWidth - SETTINGS_LAYOUT.languageRightOffsetX,
            width: SETTINGS_LAYOUT.languageWidth
        }
    };
}

export function isSettingsSliderHit(layout, x) {
    return (
        x >= layout.slider.x - SETTINGS_LAYOUT.sliderHitPaddingX &&
        x <= layout.slider.x + layout.slider.width + SETTINGS_LAYOUT.sliderHitPaddingX
    );
}
