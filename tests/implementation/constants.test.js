import { describe, expect, it } from 'vitest';
import { APP_COPYRIGHT, formatCopyrightText } from '../../src/constants.js';

describe('constants', () => {
    it('defines copyright metadata outside rendering code', () => {
        expect(APP_COPYRIGHT).toEqual({
            holder: 'T.I.OAK',
            year: '2026',
            portal: 'GameWorks OAK',
            portalUrl: 'https://t-i-oak.github.io/GameWorksOAK/'
        });
        expect(formatCopyrightText()).toBe('© T.I.OAK 2026 | GameWorks OAK');
    });
});
