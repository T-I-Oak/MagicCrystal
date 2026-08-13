import { expandLanguageResource } from '../../GameWorksOAK/src/lib/core/i18n.js';

export const SUPPORTED_LANGUAGES = ['ja', 'en'];

const TEXT = {
    common: {
        ok: {
            'lang-store': {
                ja: 'OK',
                en: 'OK'
            }
        },
        cancel: {
            'lang-store': {
                ja: 'CANCEL',
                en: 'CANCEL'
            }
        },
        back: {
            'lang-store': {
                ja: 'BACK',
                en: 'BACK'
            }
        },
        close: {
            'lang-store': {
                ja: 'CLOSE',
                en: 'CLOSE'
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
            extraMap: {
                'lang-store': {
                    ja: 'EXTRA MAP',
                    en: 'EXTRA MAP'
                }
            },
            unavailable: {
                'lang-store': {
                    ja: '???',
                    en: '???'
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
    congratulations: {
        actions: {
            share: {
                'lang-store': {
                    ja: 'SHARE',
                    en: 'SHARE'
                }
            },
            title: {
                'lang-store': {
                    ja: 'TITLE',
                    en: 'TITLE'
                }
            }
        },
        notice: {
            shareFailed: {
                'lang-store': {
                    ja: '共有を実行できませんでした',
                    en: 'Sharing could not be started'
                }
            }
        },
        shareTextPrompt: {
            'lang-store': {
                ja: 'Magic Crystal の全50ステージをクリアーしました！',
                en: 'I cleared all 50 stages in Magic Crystal!'
            }
        },
        shareConfirm: {
            title: {
                'lang-store': {
                    ja: 'CLEAR SHARE',
                    en: 'CLEAR SHARE'
                }
            },
            lines: {
                'lang-store': {
                    ja: [
                        'クリアー画像をクリップボードにコピーしました。',
                        'X を開いて貼り付けますか？'
                    ],
                    en: [
                        'The clear image has been copied to the clipboard.',
                        'Open X and paste it?'
                    ]
                }
            },
            openX: {
                'lang-store': {
                    ja: 'OPEN X',
                    en: 'OPEN X'
                }
            },
            close: {
                'lang-store': {
                    ja: 'CLOSE',
                    en: 'CLOSE'
                }
            }
        }
    },
    extraMap: {
        title: {
            'lang-store': {
                ja: 'EXTRA MAP',
                en: 'EXTRA MAP'
            }
        },
        placeholder: {
            'lang-store': {
                ja: 'EXTRA MAP COMING SOON',
                en: 'EXTRA MAP COMING SOON'
            }
        },
        empty: {
            'lang-store': {
                ja: 'EMPTY',
                en: 'EMPTY'
            }
        },
        actions: {
            play: {
                'lang-store': {
                    ja: 'PLAY',
                    en: 'PLAY'
                }
            },
            edit: {
                'lang-store': {
                    ja: 'EDIT',
                    en: 'EDIT'
                }
            },
            copy: {
                'lang-store': {
                    ja: 'COPY',
                    en: 'COPY'
                }
            },
            create: {
                'lang-store': {
                    ja: 'CREATE',
                    en: 'CREATE'
                }
            },
            paste: {
                'lang-store': {
                    ja: 'PASTE',
                    en: 'PASTE'
                }
            },
            share: {
                'lang-store': {
                    ja: 'SHARE',
                    en: 'SHARE'
                }
            },
            delete: {
                'lang-store': {
                    ja: 'DELETE',
                    en: 'DELETE'
                }
            },
            favorite: {
                'lang-store': {
                    ja: 'FAVORITE',
                    en: 'FAVORITE'
                }
            },
            unfavorite: {
                'lang-store': {
                    ja: 'UNFAVORITE',
                    en: 'UNFAVORITE'
                }
            },
            controls: {
                'lang-store': {
                    ja: 'HOW TO EDIT',
                    en: 'HOW TO EDIT'
                }
            },
            help: {
                'lang-store': {
                    ja: 'HELP',
                    en: 'HELP'
                }
            },
            difficultyShort: {
                'lang-store': {
                    ja: 'DIFFICULTY',
                    en: 'DIFFICULTY'
                }
            },
            saveShort: {
                'lang-store': {
                    ja: 'SAVE',
                    en: 'SAVE'
                }
            },
            discardShort: {
                'lang-store': {
                    ja: 'DISCARD',
                    en: 'DISCARD'
                }
            }
        },
        notice: {
            editLocked: {
                'lang-store': {
                    ja: '通常マップを10ステージクリアすると使用できます',
                    en: 'Clear 10 normal stages to unlock editing'
                }
            },
            noCopiedStage: {
                'lang-store': {
                    ja: 'コピー済みステージがありません',
                    en: 'No copied stage'
                }
            },
            shareRequiresClear: {
                'lang-store': {
                    ja: 'クリア済みマップのみシェアできます',
                    en: 'Clear the map before sharing'
                }
            },
            shareFailed: {
                'lang-store': {
                    ja: '共有を実行できませんでした',
                    en: 'Sharing could not be started'
                }
            },
            favoriteDeleteProtected: {
                'lang-store': {
                    ja: 'お気に入りマップは削除できません',
                    en: 'Favorite maps cannot be deleted'
                }
            }
        },
        shareConfirm: {
            title: {
                'lang-store': {
                    ja: 'MAP SHARE',
                    en: 'SHARE MAP'
                }
            },
            lines: {
                'lang-store': {
                    ja: [
                        'マップ画像をクリップボードにコピーしました。',
                        'X を開いて貼り付けますか？'
                    ],
                    en: [
                        'The map image has been copied to the clipboard.',
                        'Open X and paste it?'
                    ]
                }
            },
            openX: {
                'lang-store': {
                    ja: 'OPEN X',
                    en: 'OPEN X'
                }
            },
            close: {
                'lang-store': {
                    ja: 'CLOSE',
                    en: 'CLOSE'
                }
            }
        },
        shareTextPrompt: {
            'lang-store': {
                ja: '自作ステージに挑戦してみて！',
                en: 'Play my custom stage!'
            }
        },
        shareDifficultyLabel: {
            'lang-store': {
                ja: '難易度',
                en: 'Difficulty'
            }
        },
        loadError: {
            title: {
                'lang-store': {
                    ja: 'MAP LOAD FAILED',
                    en: 'MAP LOAD FAILED'
                }
            },
            lines: {
                'lang-store': {
                    ja: [
                        '共有マップを読み込めませんでした。',
                        'URL の map 情報が不正です。'
                    ],
                    en: [
                        'The shared map could not be loaded.',
                        'The map data in the URL is invalid.'
                    ]
                }
            },
            close: {
                'lang-store': {
                    ja: 'CLOSE',
                    en: 'CLOSE'
                }
            }
        },
        downloadFull: {
            title: {
                'lang-store': {
                    ja: 'MAP DOWNLOAD FAILED',
                    en: 'MAP DOWNLOAD FAILED'
                }
            },
            lines: {
                'lang-store': {
                    ja: [
                        'マップに空きがないためダウンロードできませんでした。',
                        'マップに空きを作ってからダウンロードしなおしてください。'
                    ],
                    en: [
                        'The map could not be downloaded because there are no empty slots.',
                        'Create an empty slot, then download it again.'
                    ]
                }
            },
            close: {
                'lang-store': {
                    ja: 'CLOSE',
                    en: 'CLOSE'
                }
            }
        },
        deleteConfirm: {
            title: {
                'lang-store': {
                    ja: 'DELETE MAP?',
                    en: 'DELETE MAP?'
                }
            },
            lines: {
                'lang-store': {
                    ja: [
                        'この保持マップを削除します。',
                        '削除すると元に戻せません。'
                    ],
                    en: [
                        'Delete this saved map.',
                        'This cannot be undone.'
                    ]
                }
            },
            delete: {
                'lang-store': {
                    ja: 'DELETE',
                    en: 'DELETE'
                }
            },
            cancel: {
                'lang-store': {
                    ja: 'CANCEL',
                    en: 'CANCEL'
                }
            }
        },
        editor: {
            difficulty: {
                'lang-store': {
                    ja: 'DIFFICULTY',
                    en: 'DIFFICULTY'
                }
            },
            difficultySettingsTitle: {
                'lang-store': {
                    ja: 'DIFFICULTY SETTINGS',
                    en: 'DIFFICULTY SETTINGS'
                }
            },
            difficultyDescriptions: {
                'lang-store': {
                    ja: [
                        '操作やルート判断がシンプルで、気軽に遊べる難しさ。',
                        'ルート選択を少し考える必要がある難しさ。',
                        'タイミングとルート選択を考える必要がある難しさ。',
                        '手順の見落としが失敗につながりやすい難しさ。',
                        '正確な操作と深い読みが必要な高難度。'
                    ],
                    en: [
                        'Easy to play, with simple controls and route choices.',
                        'Requires a little route planning.',
                        'Requires timing and route planning.',
                        'Mistakes in the route or order are costly.',
                        'Very hard, requiring precise control and careful planning.'
                    ]
                }
            },
            controls: {
                title: {
                    'lang-store': {
                        ja: '- HOW TO EDIT -',
                        en: '- HOW TO EDIT -'
                    }
                },
                close: {
                    'lang-store': {
                        ja: 'CLOSE',
                        en: 'CLOSE'
                    }
                },
                flowTitle: {
                    'lang-store': {
                        ja: '基本の流れ',
                        en: 'Basic Flow'
                    }
                },
                flowLines: {
                    'lang-store': {
                        ja: [
                            '編集カーソルを動かして、変更したいマスを選びます。',
                            'スマートキーで HELP / 地形 / DIFFICULTY / SAVE を選びます。',
                            '地形選択中に決定キーを押すと、そのマスの地形が変わります。',
                            'フルキーの 0 から 7 の各キーを押すと、地形選択と配置を同時に行えます。'
                        ],
                        en: [
                            'Move the edit cursor to choose the tile you want to change.',
                            'Use the Smart keys to choose HELP, terrain, DIFFICULTY, or SAVE.',
                            'When terrain is selected, press Confirm to change the selected tile.',
                            'Press any full keyboard number key from 0 through 7 to select and place terrain directly.'
                        ]
                    }
                },
                actions: {
                    'lang-store': {
                        ja: [
                            ['編集カーソルの移動', '◀ / ▶ / ▲ / ▼', '左 / 右 / 上 / 下移動キーで、変更したいマスを選びます。'],
                            ['機能の選択', '↖ / ↗', 'スマート左 / 右キーで、HELP、地形、DIFFICULTY、SAVE を切り替えます。'],
                            ['選択機能の実行', 'A', '決定キーで、選択中の地形配置、説明表示、難易度設定、保存を実行します。'],
                            ['編集の破棄', 'B', 'キャンセルキー長押しで、編集内容を破棄して終了します。'],
                            ['地形の直接配置', '0 / 1 / 2 / 3 / 4 / 5 / 6 / 7', 'Keyboard のフルキー 0 から 7 の各キーで、対応する地形を直接配置できます。']
                        ],
                        en: [
                            ['Move Edit Cursor', '◀ / ▶ / ▲ / ▼', 'Use the left / right / up / down keys to choose the tile to change.'],
                            ['Select Function', '↖ / ↗', 'Use the Smart Left / Right keys to switch HELP, terrain, DIFFICULTY, or SAVE.'],
                            ['Run Function', 'A', 'Use the Confirm key to place terrain, show help, set difficulty, or save.'],
                            ['Discard Edit', 'B', 'Hold the Cancel key to discard changes and exit.'],
                            ['Place Directly', '0 / 1 / 2 / 3 / 4 / 5 / 6 / 7', 'Use any full keyboard number key from 0 through 7 to place the matching terrain directly.']
                        ]
                    }
                },
                footnotes: {
                    'lang-store': {
                        ja: [
                            '各操作キーが Keyboard / Numpad / Gamepad のどれに対応するかは、HOW TO PLAY の操作キー対応表を参照してください。',
                            'DIFFICULTY SETTINGS 表示中は、左右で難易度を変更し、Bで閉じます。'
                        ],
                        en: [
                            'See the Control Key Map in HOW TO PLAY for Keyboard / Numpad / Gamepad mappings.',
                            'In DIFFICULTY SETTINGS, use left/right to change difficulty, then press B to close.'
                        ]
                    }
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
                ja: 'BACK',
                en: 'BACK'
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
            empty: {
                name: {
                    'lang-store': {
                        ja: '空き地',
                        en: 'Empty'
                    }
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
                        en: 'Recall Ruby'
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
                            'Taking another Recall Ruby during the countdown',
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
                        en: 'Stasis Sapphire'
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
                            'While under the effect of a Recall Ruby,',
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
                            'Terrain left behind by the Recall Ruby.',
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
                            'Terrain transformed by the Stasis Sapphire.',
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
            definitionsTitle: {
                'lang-store': {
                    ja: '操作キーの定義',
                    en: 'Control Key Definitions'
                }
            },
            definitions: {
                'lang-store': {
                    ja: [
                        ['左移動キー / 右移動キー', '通常はカーソルや選択位置を左右に動かします。ゲーム中はキャラクターを左右に移動します。'],
                        ['上移動キー', '通常はカーソルや選択位置を上に動かします。ゲーム中はジャンプします。'],
                        ['下移動キー', '通常はカーソルや選択位置を下に動かします。ゲーム中は向き反転します。'],
                        ['決定キー', '通常は選択中の項目を決定します。ゲーム中は穴掘りを行います。'],
                        ['スマート左キー / スマート右キー', 'ゲーム中は指定方向にスマートジャンプします。'],
                        ['キャンセルキー', '戻る、閉じる、メニューを開くなどの文脈操作に使います。長押しが必要な画面では戻る/リタイアを実行します。']
                    ],
                    en: [
                        ['Left / Right key', 'Usually moves the cursor or selection left/right. In play, moves the character left/right.'],
                        ['Up key', 'Usually moves the cursor or selection up. In play, jumps.'],
                        ['Down key', 'Usually moves the cursor or selection down. In play, turns around.'],
                        ['Confirm key', 'Usually confirms the selected item. In play, digs.'],
                        ['Smart Left / Smart Right key', 'In play, performs a smart jump in the selected direction.'],
                        ['Cancel key', 'Used by context to go back, close, or open a menu. On hold screens, performs back/retire.']
                    ]
                }
            },
            mappingTitle: {
                'lang-store': {
                    ja: '操作キー対応表',
                    en: 'Control Key Map'
                }
            },
            headers: {
                'lang-store': {
                    ja: ['操作キー', 'Soft Pad', 'Keyboard', 'Numpad', 'Gamepad'],
                    en: ['Control Key', 'Soft Pad', 'Keyboard', 'Numpad', 'Gamepad']
                }
            },
            rows: {
                'lang-store': {
                    ja: [
                        ['左移動キー', '◀', 'A / ←', '4', 'D-pad / stick Left'],
                        ['右移動キー', '▶', 'D / →', '6', 'D-pad / stick Right'],
                        ['上移動キー', '▲', 'W / ↑', '8', 'D-pad / stick Up'],
                        ['下移動キー', '▼', 'S / ↓', '2 / 5', 'D-pad / stick Down'],
                        ['決定キー', 'A', 'Space / Z', '1', 'A'],
                        ['スマート左キー', '↖', 'Q', '7', 'L1'],
                        ['スマート右キー', '↗', 'E', '9', 'R1'],
                        ['キャンセルキー', 'B', 'X', '3', 'B']
                    ],
                    en: [
                        ['Left key', '◀', 'A / ←', '4', 'D-pad / stick Left'],
                        ['Right key', '▶', 'D / →', '6', 'D-pad / stick Right'],
                        ['Up key', '▲', 'W / ↑', '8', 'D-pad / stick Up'],
                        ['Down key', '▼', 'S / ↓', '2 / 5', 'D-pad / stick Down'],
                        ['Confirm key', 'A', 'Space / Z', '1', 'A'],
                        ['Smart Left key', '↖', 'Q', '7', 'L1'],
                        ['Smart Right key', '↗', 'E', '9', 'R1'],
                        ['Cancel key', 'B', 'X', '3', 'B']
                    ]
                }
            },
            footnotes: {
                'lang-store': {
                    ja: [
                        'Gamepad の D-pad / Stick は、どちらでも同じ方向キーとして扱います。'
                    ],
                    en: [
                        'Gamepad D-pad and Stick directions are treated as the same direction keys.'
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
        extraStage: {
            'lang-store': {
                ja: 'EXTRA STAGE {number}',
                en: 'EXTRA STAGE {number}'
            }
        },
        retire: {
            'lang-store': {
                ja: 'RETIRE',
                en: 'RETIRE'
            }
        },
        back: {
            'lang-store': {
                ja: 'BACK',
                en: 'BACK'
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
        clear: {
            'lang-store': {
                ja: 'CLEAR',
                en: 'CLEAR'
            }
        },
        locked: {
            'lang-store': {
                ja: 'LOCKED',
                en: 'LOCKED'
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
