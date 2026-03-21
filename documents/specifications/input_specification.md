# 入力システム仕様書

## 概要
`Input.js` は、キーボード、マウス、およびタッチ入力を抽象化し、ゲームロジックから扱いやすいインターフェースを提供します。
特に、フレーム間での短い入力を取りこぼさないためのバッファリング機能と、押し下げられた瞬間を判定するエッジ検出機能を備えています。

## 抽象入力（アクション）のマッピング
以下の「アクション」に対して、複数の物理キーが割り当てられています。

| アクション | キーボード | ゲームパッド (Standard) | 内容 |
| :--- | :--- | :--- | :--- |
| `up` | `ArrowUp`, `w`, `Numpad8` | D-pad Up, L-Stick Up | 下方向（メニュー移動用） |
| `down` | `ArrowDown`, `s`, `Numpad5`, `Numpad2` | D-pad Down, L-Stick Down | 下方向 |
| `left` | `ArrowLeft`, `a`, `Numpad4` | D-pad Left, L-Stick Left | 左方向 |
| `right` | `ArrowRight`, `d`, `Numpad6` | D-pad Right, L-Stick Right | 右方向 |
| `jump` | `ArrowUp`, `w`, `Numpad8` | A ボタン (0), L-Stick Up | ジャンプ |
| `confirm` | `z`, `Enter`, `Space`, `Numpad1` | A ボタン (0) | 決定 / 穴掘り |
| `cancel` | `x`, `Numpad3` | B ボタン (1) | キャンセル / ギブアップ |
| `smartLeft` | `q`, `Numpad7` | L1 (4) | 左クイックターン / 反転ジャンプ |
| `smartRight` | `e`, `Numpad9` | R1 (5) | 右クイックターン / 反転ジャンプ |

## ゲームパッド詳細マッピング
Standard Gamepad Layout に基づき、以下のようにマッピングします。

- **方向キー**: D-pad (Buttons 12-15) および 左スティック (Axes 0, 1)
- **決定 (Confirm)**: Button 0 (A / Cross)
- **キャンセル (Cancel)**: Button 1 (B / Circle)
- **ジャンプ (Jump)**: Button 0 (A / Cross) または 上方向入力
- **スマートジャンプ (Smart Left/Right)**: Buttons 4 (L1), 5 (R1)
  - L1キー1回押しで左向き、再度押し（または向き変更済みで押し）で左反転ジャンプとなります。
- **一時停止 (Pause)**: Button 9 (Start)

## エディター専用キー
エディターモードでは、上記のアクションに加えて以下の操作が可能です。

| 操作 | キー | 内容 |
| :--- | :--- | :--- |
| カーソル移動 | `up`, `down`, `left`, `right` アクションに対応するキー | エディタカーソルの移動 |
| タイル選択 | `0` ～ `7` (`Digit0` ～ `Digit7`) | 指定したIDのタイルを選択し、即座に配置 |
| 配置 | `confirm` (`z`, `Numpad1`) | 現在選択されているタイルをカーソル位置に配置 |
| タイル巡回 | `smartLeft` / `smartRight` | 選択中のタイルを前後に切り替え |

## Space キーの挙動
Space キーは `confirm`（決定）アクションに割り当てられています。

- **メニュー画面 (TITLE, SELECT, SETTINGS 等)**:
  - 項目を決定する操作として機能します。
  - `down`（下移動）には含まれないため、メニューカーソルを動かすことはありません。
- **ゲームプレイ画面 (PLAY)**:
  - **穴掘り (Dig)** アクションとして機能します。
  - ※ 内部的には `confirm` アクションがアクティブな場合に掘削が実行されます。
- **遊び方画面 (HOW_TO_PLAY)**:
  - タイトル画面に戻る操作として機能します。

## 主要メソッド

### `update()`
毎フレーム（ゲームループ内）で呼び出す必要があります。
- `prevActions` を更新し、エッジ検出の基準を次のフレームへ進めます。
- `bufferedKeys` をクリアします。

### `isPressed(action)`
指定したアクションが現在「押されている」状態（または直前のフレームから現在までの間に一瞬でも押された状態）であれば `true` を返します。

### `isJustPressed(action)`
指定したアクションが「このフレームで新しく押された」場合に `true` を返します。
バッファリングにより、1フレーム未満の短いタップも確実に1回分の `isJustPressed` として検出されます。

### `clear()`
すべての入力状態をリセットします。ブラウザのフォーカス喪失時などに自動的に呼び出されます。

## 入力の流れ
1. ブラウザイベント（`keydown`, `touchstart` 等）が `bufferedKeys` と `keys` を更新。
2. ゲームループ開始。
3. `Game` が `update()` を呼び出し、その中で `Input` の状態を確認（`isJustPressed` 等）。
4. `Game` がループの最後で `input.update()` を呼び出し、バッファをクリアして次のフレームに備える。
