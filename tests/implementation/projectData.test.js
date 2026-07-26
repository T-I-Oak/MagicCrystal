import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const PACKAGE_PATH = 'package.json';
const UPDATE_HISTORY_PATH = 'public/data/update_history.json';
const DEVELOPMENT_MAJOR_VERSION = 0;

function readJson(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function getMajorVersion(version) {
    return Number(version.split('.')[0]);
}

describe('project data', () => {
    it('keeps update history empty while the project is in v0', () => {
        const packageJson = readJson(PACKAGE_PATH);
        const updateHistory = readJson(UPDATE_HISTORY_PATH);

        expect(Array.isArray(updateHistory)).toBe(true);

        if (getMajorVersion(packageJson.version) === DEVELOPMENT_MAJOR_VERSION) {
            expect(updateHistory).toEqual([]);
        }
    });
});
