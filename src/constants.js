export const APP_COPYRIGHT = {
    holder: 'T.I.OAK',
    year: '2026',
    portal: 'GameWorks OAK',
    portalUrl: 'https://t-i-oak.github.io/GameWorksOAK/'
};

export function formatCopyrightText(copyright = APP_COPYRIGHT) {
    return `© ${copyright.holder} ${copyright.year} | ${copyright.portal}`;
}
