import { formatCopyrightText } from './constants.js';

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 720;
export const SHARE_IMAGE_TITLE = 'Magic Crystal';
export const CONGRATULATIONS_SHARE_IMAGE_WIDTH = 1200;
export const CONGRATULATIONS_SHARE_IMAGE_HEIGHT = 910;
const PORTAL_TILE = 3;

const TILE_COLORS = [
    '#1b1730',
    '#8B4513',
    '#8a8a8a',
    '#3b0068',
    '#e6293f',
    '#2096ff',
    '#3a2418',
    '#2d3036'
];

export function createExtraMapShareImagePayload({ stage, difficulty, url }) {
    return {
        title: SHARE_IMAGE_TITLE,
        difficulty,
        url,
        stage,
        copyrightText: formatCopyrightText()
    };
}

export function createCongratulationsShareImagePayload({ date = new Date() } = {}) {
    return {
        title: SHARE_IMAGE_TITLE,
        dateText: formatShareDate(date),
        copyrightText: formatCopyrightText()
    };
}

export function paintExtraMapShareImage(ctx, payload, assets = null) {
    validateShareImagePayload(payload);
    const { width, height } = ctx.canvas;

    ctx.fillStyle = '#111018';
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#21172c');
    gradient.addColorStop(0.55, '#10131e');
    gradient.addColorStop(1, '#251029');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawShareTitle(ctx, assets?.logo, width / 2, 78);

    const map = {
        x: 144,
        y: 170,
        tile: 38,
        cols: 24,
        rows: 13
    };
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(map.x - 18, map.y - 18, map.cols * map.tile + 36, map.rows * map.tile + 36);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 4;
    ctx.strokeRect(map.x - 18, map.y - 18, map.cols * map.tile + 36, map.rows * map.tile + 36);

    drawShareStage(ctx, payload.stage, map, assets);
    drawSharePlayer(ctx, payload.stage, map, assets?.player?.standRight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(payload.copyrightText, width / 2, 705);
}

export async function createExtraMapShareImageBlob(payload, { documentRef = globalThis.document, assets = null } = {}) {
    const canvas = createShareCanvas(documentRef);
    paintExtraMapShareImage(canvas.getContext('2d'), payload, assets);
    return canvasToPngBlob(canvas);
}

export function paintCongratulationsShareImage(ctx, payload, assets = null) {
    validateCongratulationsShareImagePayload(payload);
    if (!assets?.clear?.width || !assets?.clear?.height) {
        throw new Error('[CongratulationsShareImage] clear image is required.');
    }

    const { width, height } = ctx.canvas;
    const footerHeight = 64;

    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(assets.clear, 0, 0, width, height - footerHeight);

    drawOutlinedCenteredText(ctx, payload.dateText, width / 2, height - footerHeight - 54, {
        font: 'bold 72px serif',
        fillStyle: '#fff4c8',
        strokeStyle: 'rgba(0, 0, 0, 0.86)',
        lineWidth: 7,
        shadowColor: 'rgba(255, 205, 80, 0.55)',
        shadowBlur: 14
    });

    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, height - footerHeight, width, footerHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(payload.copyrightText, width / 2, height - footerHeight / 2 + 1);
}

export async function createCongratulationsShareImageBlob(payload, { documentRef = globalThis.document, assets = null } = {}) {
    const canvas = createShareCanvas(documentRef, CONGRATULATIONS_SHARE_IMAGE_WIDTH, CONGRATULATIONS_SHARE_IMAGE_HEIGHT);
    paintCongratulationsShareImage(canvas.getContext('2d'), payload, assets);
    return canvasToPngBlob(canvas);
}

function createShareCanvas(documentRef, width = SHARE_IMAGE_WIDTH, height = SHARE_IMAGE_HEIGHT) {
    if (!documentRef?.createElement) {
        throw new Error('[ExtraMapShareImage] document is required.');
    }

    const canvas = documentRef.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error('[ExtraMapShareImage] failed to create image blob.'));
        }, 'image/png');
    });
}

function drawShareStage(ctx, stage, map, assets) {
    for (let y = 0; y < map.rows; y++) {
        for (let x = 0; x < map.cols; x++) {
            const tile = stage[y][x];
            const dx = map.x + x * map.tile;
            const dy = map.y + y * map.tile;
            const openGroundImage = assets?.getTile?.(0);
            const tileImage = assets?.getTile?.(tile);
            if (openGroundImage) {
                ctx.drawImage(openGroundImage, dx, dy, map.tile, map.tile);
            } else {
                ctx.fillStyle = TILE_COLORS[0];
                ctx.fillRect(dx, dy, map.tile, map.tile);
            }
            if (tile === 0) continue;
            if (tileImage) {
                ctx.drawImage(tileImage, dx, dy, map.tile, map.tile);
            } else {
                ctx.fillStyle = TILE_COLORS[tile] || TILE_COLORS[0];
                ctx.fillRect(dx, dy, map.tile, map.tile);
            }
        }
    }
}

function drawShareTitle(ctx, logo, centerX, centerY) {
    if (!logo?.width || !logo?.height) {
        throw new Error('[ExtraMapShareImage] logo image is required.');
    }

    const logoWidth = 500;
    const logoHeight = logo.height * (logoWidth / logo.width);
    ctx.drawImage(logo, centerX - logoWidth / 2, centerY - logoHeight / 2, logoWidth, logoHeight);
}

function drawSharePlayer(ctx, stage, map, playerImage) {
    if (!playerImage?.width || !playerImage?.height) {
        throw new Error('[ExtraMapShareImage] player image is required.');
    }

    const portal = findPortal(stage);
    const size = map.tile * 1.25;
    const dx = map.x + portal.x * map.tile + (map.tile - size) / 2;
    const dy = map.y + portal.y * map.tile + map.tile - size;
    ctx.drawImage(playerImage, dx, dy, size, size);
}

function findPortal(stage) {
    let portal = null;
    for (let y = 0; y < stage.length; y++) {
        for (let x = 0; x < stage[y].length; x++) {
            if (stage[y][x] !== PORTAL_TILE) continue;
            if (portal) throw new Error('[ExtraMapShareImage] stage must contain exactly one portal.');
            portal = { x, y };
        }
    }
    if (!portal) throw new Error('[ExtraMapShareImage] stage must contain exactly one portal.');
    return portal;
}

function validateShareImagePayload(payload) {
    if (!payload) throw new Error('[ExtraMapShareImage] payload is required.');
    if (!Array.isArray(payload.stage) || payload.stage.length !== 13) {
        throw new Error('[ExtraMapShareImage] stage must have 13 rows.');
    }
    for (const row of payload.stage) {
        if (!Array.isArray(row) || row.length !== 24) {
            throw new Error('[ExtraMapShareImage] stage rows must have 24 columns.');
        }
    }
    if (!Number.isInteger(payload.difficulty) || payload.difficulty < 1 || payload.difficulty > 5) {
        throw new Error('[ExtraMapShareImage] difficulty must be 1..5.');
    }
    findPortal(payload.stage);
}

function validateCongratulationsShareImagePayload(payload) {
    if (!payload) throw new Error('[CongratulationsShareImage] payload is required.');
    if (!payload.dateText) throw new Error('[CongratulationsShareImage] date text is required.');
    if (!payload.copyrightText) throw new Error('[CongratulationsShareImage] copyright text is required.');
}

function formatShareDate(date) {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) throw new Error('[CongratulationsShareImage] date is invalid.');
    const month = value.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    return `${month}. ${value.getUTCDate()}, ${value.getUTCFullYear()}`;
}

function drawOutlinedCenteredText(ctx, text, x, y, options) {
    ctx.save();
    ctx.font = options.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = options.shadowColor;
    ctx.shadowBlur = options.shadowBlur;
    ctx.lineWidth = options.lineWidth;
    ctx.strokeStyle = options.strokeStyle;
    ctx.fillStyle = options.fillStyle;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
}
