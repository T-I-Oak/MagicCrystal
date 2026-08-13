# Backlog

バックログには詳細な要件が記載されていません。
設計・実装する際にはプロジェクトオーナーと相談しながら進めてください。

Magic Crystal はフレーム単位の挙動で成立するパズルゲームです。
開発時は [開発運用ルール](../specifications/development_rules.md) のゲームエンジン保護ルールを遵守し、キャラクターの移動・ジャンプ・落下・当たり判定・入力反映タイミングを変更しないでください。

## 要望・バグ指摘

### アプリ機能
- [ ] モバイル/タブレットブラウザ対応の共通チェックリストに基づき、表示・入力を見直す
    - 共通仕様 `07.mobile_browser_rules.md` と `99.compliance_checklist.md` に基づく対応です。
    - `main.js` の canvas 向け `touchstart` / `touchmove` listener が `{ passive: true }` になっているため、ゲーム操作領域でブラウザ標準操作を抑止できる設計になっているか確認します。
    - 画面全体のレスポンシブ調整に `game-container` の `transform: scale(...)` を使用しているため、共通ルールの「レスポンシブレイアウト目的で UI 全体を `transform: scale()` しない」に対する対応方針を検討します。
    - `html` / `body` / 画面ルートの高さ指定が `100dvh` 併用ルールを満たしているか確認します。
    - 共有確認など DOM overlay のモバイル短尺 viewport 対応として、内部スクロール領域やボタン操作不能状態が発生しないか確認します。
    - iPad Safari / Android Chrome の実機または相当 viewport で、ページスクロール抑止、safe area、モーダル、How To Play / How To Edit、ソフトパッド、共有導線を確認します。

### 共通ライブラリ適用
現時点で共通ライブラリ適用の残作業はありません。

## オーナー検証

現時点で確認待ちの項目はありません。
