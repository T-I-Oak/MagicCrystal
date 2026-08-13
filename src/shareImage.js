import { formatCopyrightText } from './constants.js';

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 720;
export const SHARE_IMAGE_TITLE = 'Magic Crystal';
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

function createShareCanvas(documentRef) {
    if (!documentRef?.createElement) {
        throw new Error('[ExtraMapShareImage] document is required.');
    }

    const canvas = documentRef.createElement('canvas');
    canvas.width = SHARE_IMAGE_WIDTH;
    canvas.height = SHARE_IMAGE_HEIGHT;
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
            const image = assets?.getTile?.(tile);
            if (image) {
                ctx.drawImage(image, dx, dy, map.tile, map.tile);
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
