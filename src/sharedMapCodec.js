export const SHARED_MAP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export const SHARED_MAP_FORMAT_FIXED = 'A';
export const SHARED_MAP_FORMAT_RLE = 'B';
export const SHARED_MAP_FORMAT_RLE2 = 'C';
export const SHARED_MAP_FORMAT_DICTIONARY = 'D';
export const SHARED_MAP_COLS = 24;
export const SHARED_MAP_ROWS = 13;
export const SHARED_MAP_TILE_COUNT = SHARED_MAP_COLS * SHARED_MAP_ROWS;
export const MIN_SHARED_MAP_DIFFICULTY = 1;
export const MAX_SHARED_MAP_DIFFICULTY = 5;
export const SHARED_MAP_PORTAL_TILE = 3;
export const SHARED_MAP_DICTIONARY_PATTERNS = [
    [1, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 4, 0],
    [0, 2, 0],
    [0, 2, 2, 0]
];

const RLE2_SHORT_RUN_LIMIT = 4;
const RLE2_LONG_RUN_LIMIT = 256;
const DICTIONARY_LONG_RUN_LIMIT = 196;
const DICTIONARY_REFERENCE_START = 56;

function flattenTiles(tiles) {
    if (!Array.isArray(tiles) || tiles.length !== SHARED_MAP_ROWS) {
        throw new Error('Shared map must have 13 rows.');
    }

    const flat = [];
    for (const row of tiles) {
        if (!Array.isArray(row) || row.length !== SHARED_MAP_COLS) {
            throw new Error('Shared map rows must have 24 columns.');
        }

        for (const tile of row) {
            if (!Number.isInteger(tile) || tile < 0 || tile > 7) {
                throw new Error('Shared map tiles must be integers from 0 to 7.');
            }
            flat.push(tile);
        }
    }

    return flat;
}

function inflateTiles(flat, formatName = 'Decoded') {
    if (!Array.isArray(flat) || flat.length !== SHARED_MAP_TILE_COUNT) {
        throw new Error(`${formatName} shared map data expands to an invalid length.`);
    }

    const portalCount = flat.filter(tile => tile === SHARED_MAP_PORTAL_TILE).length;
    if (portalCount !== 1) {
        throw new Error(`${formatName} shared map data must contain exactly one portal.`);
    }

    const tiles = [];
    for (let y = 0; y < SHARED_MAP_ROWS; y++) {
        tiles.push(flat.slice(y * SHARED_MAP_COLS, (y + 1) * SHARED_MAP_COLS));
    }
    return tiles;
}

function validateDifficulty(difficulty) {
    if (
        !Number.isInteger(difficulty) ||
        difficulty < MIN_SHARED_MAP_DIFFICULTY ||
        difficulty > MAX_SHARED_MAP_DIFFICULTY
    ) {
        throw new Error('Shared map difficulty must be an integer from 1 to 5.');
    }
}

function parseDifficulty(difficultyChar) {
    const difficulty = Number(difficultyChar);
    validateDifficulty(difficulty);
    return difficulty;
}

function alphabetChar(index) {
    const char = SHARED_MAP_ALPHABET[index];
    if (char === undefined) throw new Error('Shared map encoded value is out of range.');
    return char;
}

function alphabetIndex(char) {
    const index = SHARED_MAP_ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Shared map contains a non URL-safe codec character.');
    return index;
}

export function encodeSharedMapFixed(tiles, difficulty) {
    validateDifficulty(difficulty);
    const flat = flattenTiles(tiles);
    let body = '';

    for (let index = 0; index < flat.length; index += 2) {
        body += alphabetChar(flat[index] * 8 + flat[index + 1]);
    }

    return `${SHARED_MAP_FORMAT_FIXED}${difficulty}${body}`;
}

export function encodeSharedMapRle(tiles, difficulty) {
    validateDifficulty(difficulty);
    const flat = flattenTiles(tiles);
    let body = '';

    for (let index = 0; index < flat.length;) {
        const tile = flat[index];
        let runLength = 1;
        while (
            index + runLength < flat.length &&
            flat[index + runLength] === tile &&
            runLength < 8
        ) {
            runLength++;
        }

        body += alphabetChar(tile + (runLength - 1) * 8);
        index += runLength;
    }

    return `${SHARED_MAP_FORMAT_RLE}${difficulty}${body}`;
}

export function encodeSharedMapRle2(tiles, difficulty) {
    validateDifficulty(difficulty);
    return `${SHARED_MAP_FORMAT_RLE2}${difficulty}${encodeRle2Body(flattenTiles(tiles))}`;
}

export function encodeSharedMapDictionary(tiles, difficulty) {
    validateDifficulty(difficulty);
    return `${SHARED_MAP_FORMAT_DICTIONARY}${difficulty}${encodeDictionaryBody(flattenTiles(tiles))}`;
}

export function encodeSharedMap(tiles, difficulty) {
    const candidates = [
        encodeSharedMapFixed(tiles, difficulty),
        encodeSharedMapRle(tiles, difficulty),
        encodeSharedMapRle2(tiles, difficulty),
        encodeSharedMapDictionary(tiles, difficulty)
    ];
    return candidates.reduce((shortest, candidate) => (
        candidate.length < shortest.length ? candidate : shortest
    ));
}

function encodeRle2Body(flat) {
    let body = '';

    for (let index = 0; index < flat.length;) {
        const tile = flat[index];
        const runLength = countRun(flat, index, RLE2_LONG_RUN_LIMIT);
        body += encodeRle2Run(tile, runLength);
        index += runLength;
    }

    return body;
}

function encodeRle2Run(tile, runLength) {
    if (runLength <= RLE2_SHORT_RUN_LIMIT) {
        return alphabetChar(tile + (runLength - 1) * 8);
    }

    const runValue = runLength - 1;
    return (
        alphabetChar(tile + 32 + (runValue % RLE2_SHORT_RUN_LIMIT) * 8) +
        alphabetChar(Math.floor(runValue / RLE2_SHORT_RUN_LIMIT))
    );
}

function encodeDictionaryBody(flat) {
    const dp = new Array(flat.length + 1).fill(Infinity);
    const choice = new Array(flat.length);
    dp[flat.length] = 0;

    for (let index = flat.length - 1; index >= 0; index--) {
        const runLength = countRun(flat, index, DICTIONARY_LONG_RUN_LIMIT);
        for (let length = 1; length <= runLength; length++) {
            const cost = dictionaryRunCost(length) + dp[index + length];
            if (cost < dp[index]) {
                dp[index] = cost;
                choice[index] = { type: 'run', length };
            }
        }

        for (let dictionaryIndex = 0; dictionaryIndex < SHARED_MAP_DICTIONARY_PATTERNS.length; dictionaryIndex++) {
            const pattern = SHARED_MAP_DICTIONARY_PATTERNS[dictionaryIndex];
            if (!matchesPattern(flat, index, pattern)) continue;

            const cost = 1 + dp[index + pattern.length];
            if (cost < dp[index]) {
                dp[index] = cost;
                choice[index] = { type: 'dictionary', length: pattern.length, dictionaryIndex };
            }
        }
    }

    let body = '';
    for (let index = 0; index < flat.length;) {
        const token = choice[index];
        if (!token) throw new Error('Shared map dictionary encoding failed.');

        if (token.type === 'dictionary') {
            body += alphabetChar(DICTIONARY_REFERENCE_START + token.dictionaryIndex);
        } else {
            body += encodeDictionaryRun(flat[index], token.length);
        }
        index += token.length;
    }

    return body;
}

function encodeDictionaryRun(tile, runLength) {
    if (runLength <= RLE2_SHORT_RUN_LIMIT) {
        return alphabetChar(tile + (runLength - 1) * 8);
    }

    const runValue = runLength - 5;
    return (
        alphabetChar(tile + 32 + (runValue % 3) * 8) +
        alphabetChar(Math.floor(runValue / 3))
    );
}

function dictionaryRunCost(runLength) {
    return runLength <= RLE2_SHORT_RUN_LIMIT ? 1 : 2;
}

function countRun(flat, index, maxRunLength) {
    const tile = flat[index];
    let runLength = 1;
    while (
        index + runLength < flat.length &&
        flat[index + runLength] === tile &&
        runLength < maxRunLength
    ) {
        runLength++;
    }
    return runLength;
}

function matchesPattern(flat, index, pattern) {
    if (index + pattern.length > flat.length) return false;
    for (let offset = 0; offset < pattern.length; offset++) {
        if (flat[index + offset] !== pattern[offset]) return false;
    }
    return true;
}

export function decodeSharedMap(encoded) {
    if (typeof encoded !== 'string' || encoded.length < 2) {
        throw new Error('Shared map data is empty or too short.');
    }

    const format = encoded[0];
    const difficulty = parseDifficulty(encoded[1]);
    const body = encoded.slice(2);

    if (format === SHARED_MAP_FORMAT_FIXED) {
        return {
            format,
            difficulty,
            tiles: decodeSharedMapFixedBody(body)
        };
    }

    if (format === SHARED_MAP_FORMAT_RLE) {
        return {
            format,
            difficulty,
            tiles: decodeSharedMapRleBody(body)
        };
    }

    if (format === SHARED_MAP_FORMAT_RLE2) {
        return {
            format,
            difficulty,
            tiles: decodeSharedMapRle2Body(body)
        };
    }

    if (format === SHARED_MAP_FORMAT_DICTIONARY) {
        return {
            format,
            difficulty,
            tiles: decodeSharedMapDictionaryBody(body)
        };
    }

    throw new Error('Shared map format is unknown.');
}

function decodeSharedMapFixedBody(body) {
    const flat = [];
    for (const char of body) {
        const index = alphabetIndex(char);
        flat.push(Math.floor(index / 8), index % 8);
    }

    return inflateTiles(flat, 'Fixed');
}

function decodeSharedMapRleBody(body) {
    const flat = [];
    for (const char of body) {
        const index = alphabetIndex(char);
        const tile = index % 8;
        const runLength = Math.floor(index / 8) + 1;
        for (let i = 0; i < runLength; i++) {
            flat.push(tile);
        }
    }

    return inflateTiles(flat, 'RLE');
}

function decodeSharedMapRle2Body(body) {
    const flat = [];
    for (let index = 0; index < body.length;) {
        const firstIndex = alphabetIndex(body[index]);

        if (firstIndex < 32) {
            const tile = firstIndex % 8;
            const runLength = Math.floor(firstIndex / 8) + 1;
            appendRun(flat, tile, runLength);
            index++;
            continue;
        }

        const secondChar = body[index + 1];
        if (secondChar === undefined) {
            throw new Error('RLE-2 shared map data has an incomplete long run.');
        }

        const marker = firstIndex - 32;
        const tile = marker % 8;
        const remainder = Math.floor(marker / 8);
        const secondIndex = alphabetIndex(secondChar);
        const runLength = secondIndex * RLE2_SHORT_RUN_LIMIT + remainder + 1;
        if (runLength < 5 || runLength > RLE2_LONG_RUN_LIMIT) {
            throw new Error('RLE-2 shared map data has an invalid long run.');
        }
        appendRun(flat, tile, runLength);
        index += 2;
    }

    return inflateTiles(flat, 'RLE-2');
}

function decodeSharedMapDictionaryBody(body) {
    const flat = [];
    for (let index = 0; index < body.length;) {
        const firstIndex = alphabetIndex(body[index]);

        if (firstIndex < 32) {
            const tile = firstIndex % 8;
            const runLength = Math.floor(firstIndex / 8) + 1;
            appendRun(flat, tile, runLength);
            index++;
            continue;
        }

        if (firstIndex >= DICTIONARY_REFERENCE_START) {
            const pattern = SHARED_MAP_DICTIONARY_PATTERNS[firstIndex - DICTIONARY_REFERENCE_START];
            if (!pattern) throw new Error('Dictionary shared map data has an invalid dictionary reference.');
            flat.push(...pattern);
            index++;
            continue;
        }

        const secondChar = body[index + 1];
        if (secondChar === undefined) {
            throw new Error('Dictionary shared map data has an incomplete long run.');
        }

        const marker = firstIndex - 32;
        const tile = marker % 8;
        const remainder = Math.floor(marker / 8);
        const secondIndex = alphabetIndex(secondChar);
        const runLength = secondIndex * 3 + remainder + 5;
        if (runLength < 5 || runLength > DICTIONARY_LONG_RUN_LIMIT) {
            throw new Error('Dictionary shared map data has an invalid long run.');
        }
        appendRun(flat, tile, runLength);
        index += 2;
    }

    return inflateTiles(flat, 'Dictionary');
}

function appendRun(flat, tile, runLength) {
    for (let i = 0; i < runLength; i++) {
        flat.push(tile);
    }
}
