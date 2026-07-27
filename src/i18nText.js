import { expandLanguageResource } from '../../GameWorksOAK/src/lib/core/i18n.js';

export const SUPPORTED_LANGUAGES = ['ja', 'en'];

const TEXT = {
    common: {
        back: {
            'lang-store': {
                ja: 'BACK',
                en: 'BACK'
            }
        },
        languageNames: {
            ja: {
                'lang-store': {
                    ja: '日本語',
                    en: 'Japanese'
                }
            },
            en: {
                'lang-store': {
                    ja: 'English',
                    en: 'English'
                }
            }
        }
    },
    title: {
        menu: {
            gamePlay: {
                'lang-store': {
                    ja: 'GAME PLAY',
                    en: 'GAME PLAY'
                }
            },
            howToPlay: {
                'lang-store': {
                    ja: 'HOW TO PLAY',
                    en: 'HOW TO PLAY'
                }
            },
            mapEditor: {
                'lang-store': {
                    ja: 'MAP EDITOR',
                    en: 'MAP EDITOR'
                }
            },
            settings: {
                'lang-store': {
                    ja: 'SETTINGS',
                    en: 'SETTINGS'
                }
            }
        }
    },
    settings: {
        title: {
            'lang-store': {
                ja: 'SETTINGS',
                en: 'SETTINGS'
            }
        },
        gameSpeed: {
            'lang-store': {
                ja: 'GAME SPEED',
                en: 'GAME SPEED'
            }
        },
        padType: {
            'lang-store': {
                ja: 'PAD TYPE',
                en: 'PAD TYPE'
            }
        },
        padPos: {
            'lang-store': {
                ja: 'PAD POS',
                en: 'PAD POS'
            }
        },
        padSize: {
            'lang-store': {
                ja: 'PAD SIZE',
                en: 'PAD SIZE'
            }
        },
        screenSize: {
            'lang-store': {
                ja: 'SCREEN SIZE',
                en: 'SCREEN SIZE'
            }
        },
        language: {
            'lang-store': {
                ja: 'LANGUAGE',
                en: 'LANGUAGE'
            }
        },
        drag: {
            'lang-store': {
                ja: 'DRAG',
                en: 'DRAG'
            }
        },
        padTypes: {
            none: {
                'lang-store': {
                    ja: 'NONE',
                    en: 'NONE'
                }
            },
            single: {
                'lang-store': {
                    ja: 'SINGLE',
                    en: 'SINGLE'
                }
            },
            dual: {
                'lang-store': {
                    ja: 'DUAL',
                    en: 'DUAL'
                }
            }
        }
    },
    howToPlay: {
        title: {
            'lang-store': {
                ja: '- HOW TO PLAY -',
                en: '- HOW TO PLAY -'
            }
        },
        tapToBack: {
            'lang-store': {
                ja: 'TAP TO BACK',
                en: 'TAP TO BACK'
            }
        },
        scrollMore: {
            'lang-store': {
                ja: 'Scroll to Read More...',
                en: 'Scroll to Read More...'
            }
        },
        prologue: {
            title: {
                'lang-store': {
                    ja: '■ プロローグ',
                    en: '■ Prologue'
                }
            },
            lines: {
                'lang-store': {
                    ja: [
                        '魔導師見習いのあなたは、師匠の言いつけで',
                        '「魔力の結晶」を集めることになりました。',
                        '結晶に秘められた力は、大地の記憶そのものを操ります。',
                        '赤と青、ふたつの魔力を使い分け、',
                        '変化し続ける大地を乗り越えましょう。'
                    ],
                    en: [
                        'As an apprentice mage, you have been sent by your master',
                        'to gather Magic Crystals.',
                        'The power within them can shape the land\'s own memories.',
                        'Use the red and blue magic wisely,',
                        'and cross the ever-changing ground ahead.'
                    ]
                }
            }
        },
        objective: {
            title: {
                'lang-store': {
                    ja: '■ 目的',
                    en: '■ Goal'
                }
            },
            lines: {
                'lang-store': {
                    ja: [
                        'ステージ上のすべての結晶を集めた状態で',
                        '「ポータル」に到達すればクリアです。'
                    ],
                    en: [
                        'Collect every crystal on the stage,',
                        'then reach the Portal to clear it.'
                    ]
                }
            }
        },
        terrain: {
            title: {
                'lang-store': {
                    ja: '■ 地形',
                    en: '■ Terrain'
                }
            },
            portal: {
                name: {
                    'lang-store': {
                        ja: 'ポータル',
                        en: 'Portal'
                    }
                },
                lines: {
                    'lang-store': {
                        ja: [
                            'ステージの開始地点であり、帰還地点でもある魔法装置です。',
                            'すべてのクリスタルを集めた状態で、',
                            '再びこのポータルに戻ることでステージクリアとなります。',
                            '探索の終わりは、いつも始まりの場所です。'
                        ],
                        en: [
                            'A magical device that marks both your starting point and your way home.',
                            'After collecting every crystal,',
                            'return to this Portal to clear the stage.',
                            'Every journey ends where it began.'
                        ]
                    }
                }
            },
            redCrystal: {
                name: {
                    'lang-store': {
                        ja: '回帰の紅晶',
                        en: 'Red Crystal of Return'
                    }
                },
                lines: {
                    'lang-store': {
                        ja: [
                            '周囲の「過去の記憶」を呼び戻す魔力が秘められた結晶です。',
                            '取得すると、カウントダウン後に壊れた地形が元に戻ります。',
                            'カウントダウン中に次の回帰の紅晶を取ると、',
                            '地形変化までの時間が【延長】されます。',
                            '取得後、その場所は「土の記憶」へと変化します。'
                        ],
                        en: [
                            'A crystal that calls back the "past memory" of nearby ground.',
                            'After you take it, broken terrain returns when the countdown ends.',
                            'Taking another Red Crystal of Return during the countdown',
                            'extends the time before the terrain changes.',
                            'After collection, its tile becomes Soil Memory.'
                        ]
                    }
                }
            },
            blueCrystal: {
                name: {
                    'lang-store': {
                        ja: '固定の蒼晶',
                        en: 'Blue Crystal of Fixing'
                    }
                },
                lines: {
                    'lang-store': {
                        ja: [
                            '時間変化を拒絶する魔力が秘められた結晶です。',
                            'カウントダウン中に取得すると、',
                            '地形変化までの時間が【クリア】されます。',
                            '取得後、その場所は「岩の記憶」へと変化します。'
                        ],
                        en: [
                            'A crystal with magic that rejects change over time.',
                            'If you take it during a countdown,',
                            'the remaining time before terrain changes is cleared.',
                            'After collection, its tile becomes Rock Memory.'
                        ]
                    }
                }
            },
            soil: {
                name: {
                    'lang-store': {
                        ja: '土',
                        en: 'Soil'
                    }
                },
                lines: {
                    'lang-store': {
                        ja: [
                            '壊すことができる地形です。',
                            '回帰の紅晶の影響下では、',
                            'カウントダウン後に元の形へ復活します。'
                        ],
                        en: [
                            'Terrain that can be broken.',
                            'While under the effect of a Red Crystal of Return,',
                            'it restores its original form after the countdown.'
                        ]
                    }
                }
            },
            rock: {
                name: {
                    'lang-store': {
                        ja: '岩',
                        en: 'Rock'
                    }
                },
                lines: {
                    'lang-store': {
                        ja: [
                            '壊すことができない地形です。',
                            '記憶が完全に固定された、大地の最終形態です。',
                            '一度岩になると、二度と変化しません。'
                        ],
                        en: [
                            'Terrain that cannot be broken.',
                            'It is the final form of ground whose memory has been fixed.',
                            'Once terrain becomes Rock, it never changes again.'
                        ]
                    }
                }
            },
            soilMemory: {
                name: {
                    'lang-store': {
                        ja: '土の記憶',
                        en: 'Soil Memory'
                    }
                },
                lines: {
                    'lang-store': {
                        ja: [
                            '回帰の紅晶の力によって残された地形です。',
                            'カウントダウンが終了すると、',
                            'かつて存在していた「土」として復活します。',
                            '赤の魔力が続く限り、何度でも再生します。'
                        ],
                        en: [
                            'Terrain left behind by the Red Crystal of Return.',
                            'When the countdown ends,',
                            'it restores the Soil that once existed there.',
                            'As long as the red magic remains, it can return again and again.'
                        ]
                    }
                }
            },
            rockMemory: {
                name: {
                    'lang-store': {
                        ja: '岩の記憶',
                        en: 'Rock Memory'
                    }
                },
                lines: {
                    'lang-store': {
                        ja: [
                            '固定の蒼晶の力によって変質した地形です。',
                            '時間の流れが完全に固定されています。',
                            'この地形は二度と変化せず、',
                            '破壊も再生も起こりません。'
                        ],
                        en: [
                            'Terrain transformed by the Blue Crystal of Fixing.',
                            'The flow of time has been completely locked.',
                            'This terrain will never change again,',
                            'and it can neither be broken nor restored.'
                        ]
                    }
                }
            }
        },
        life: {
            title: {
                'lang-store': {
                    ja: '■ ライフ',
                    en: '■ Lives'
                }
            },
            name: {
                'lang-store': {
                    ja: 'ライフの仕組み',
                    en: 'How Lives Work'
                }
            },
            lines: {
                'lang-store': {
                    ja: [
                        '初期ライフは3で、0になるとゲームオーバーです。',
                        'ステージをクリアするたびにライフが1つ増えます。（最大9）'
                    ],
                    en: [
                        'You start with 3 lives. If they reach 0, the game is over.',
                        'Clearing a stage adds 1 life, up to a maximum of 9.'
                    ]
                }
            }
        },
        controls: {
            title: {
                'lang-store': {
                    ja: '■ 操作方法',
                    en: '■ Controls'
                }
            },
            headers: {
                'lang-store': {
                    ja: ['操作項目', 'WASD / 矢印', 'テンキー', 'ソフトパッド', 'Gamepad'],
                    en: ['Action', 'WASD / Arrows', 'Numpad', 'Soft Pad', 'Gamepad']
                }
            },
            rows: {
                'lang-store': {
                    ja: [
                        ['左右移動', 'A / D / ← / →', '4 / 6', '◀ / ▶', 'Stick / 十字L/R'],
                        ['ジャンプ※1', 'W / ↑', '8', '▲', '十字上'],
                        ['Sジャンプ※2', 'Q / E', '7 / 9', '↖ / ↗', 'L1 / R1'],
                        ['向き反転', 'S / ↓', '2 / 5', '▼', '十字下'],
                        ['穴掘り', 'Space / Z', '1', 'A', 'A'],
                        ['リタイア※3', 'X / (長押し)', '3 / (長押し)', 'B / (長押し)', 'B / (長押し)']
                    ],
                    en: [
                        ['Move', 'A / D / ← / →', '4 / 6', '◀ / ▶', 'Stick / D-pad L/R'],
                        ['Jump*1', 'W / ↑', '8', '▲', 'D-pad Up'],
                        ['Smart Jump*2', 'Q / E', '7 / 9', '↖ / ↗', 'L1 / R1'],
                        ['Turn Around', 'S / ↓', '2 / 5', '▼', 'D-pad Down'],
                        ['Dig', 'Space / Z', '1', 'A', 'A'],
                        ['Retire*3', 'X / (Hold)', '3 / (Hold)', 'B / (Hold)', 'B / (Hold)']
                    ]
                }
            },
            footnotes: {
                'lang-store': {
                    ja: [
                        '※1 ジャンプ         : 向いている方向にジャンプします。',
                        '※2 スマートジャンプ : 指定した方向にジャンプします。',
                        '※3 リタイア         : ライフを1つ失い、ステージをやり直します。'
                    ],
                    en: [
                        '*1 Jump       : Jump in the direction you are facing.',
                        '*2 Smart Jump : Jump in the specified direction.',
                        '*3 Retire     : Lose 1 life and restart the stage.'
                    ]
                }
            }
        }
    },
    play: {
        editorMode: {
            'lang-store': {
                ja: 'EDITOR MODE',
                en: 'EDITOR MODE'
            }
        },
        clear: {
            'lang-store': {
                ja: 'Clear!!',
                en: 'Clear!!'
            }
        },
        miss: {
            'lang-store': {
                ja: 'Miss!!',
                en: 'Miss!!'
            }
        },
        gameOver: {
            'lang-store': {
                ja: 'GAME OVER',
                en: 'GAME OVER'
            }
        },
        stage: {
            'lang-store': {
                ja: 'STAGE {number}',
                en: 'STAGE {number}'
            }
        },
        retire: {
            'lang-store': {
                ja: 'X (B) RETIRE ●',
                en: 'X (B) RETIRE ●'
            }
        },
        back: {
            'lang-store': {
                ja: 'X (B) BACK ●',
                en: 'X (B) BACK ●'
            }
        }
    },
    select: {
        stage: {
            'lang-store': {
                ja: 'SELECT STAGE',
                en: 'SELECT STAGE'
            }
        },
        stageEditor: {
            'lang-store': {
                ja: 'SELECT STAGE (EDITOR)',
                en: 'SELECT STAGE (EDITOR)'
            }
        },
        clear: {
            'lang-store': {
                ja: 'CLEAR',
                en: 'CLEAR'
            }
        }
    }
};

function getValueByPath(source, path) {
    return path.split('.').reduce((current, key) => current?.[key], source);
}

export function t(path, params = {}) {
    const value = tr(path, params);
    return value === undefined ? path : String(value);
}

export function tr(path, params = {}) {
    const resource = getValueByPath(TEXT, path);
    const expanded = expandLanguageResource(resource);
    if (typeof expanded !== 'string') return expanded;

    return expanded.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key) => {
        return params[key] === undefined ? match : String(params[key]);
    });
}
