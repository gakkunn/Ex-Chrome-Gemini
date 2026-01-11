# Gemini 入力欄（Composer）のDOM仕様メモ（本拡張の依存セレクタ基準）

このドキュメントは **本リポジトリの拡張機能が実際に参照しているDOMセレクタ** を根拠に、`https://gemini.google.com/` 上の **入力欄（プロンプト入力/送信/添付）周辺** の DOM 形状を整理したメモです。

- **目的**: 入力欄まわりのDOMが変わった時に、どこが壊れたか/何を探し直すべきかが一目で分かるようにする
- **注意**: 下記は「Gemini の完全なDOM仕様」ではなく、**拡張機能が依存しているアンカー（安定しやすい属性）** に焦点を当てています。実際のDOMのクラス名やネストは変更される可能性があります。

---

## 1. 最重要アンカー（入力欄そのもの）

本拡張における「入力欄」は、`<textarea>` ではなく **Quill系の `contenteditable` エディタ** として扱われています。

### 1.1 入力欄コンテナ（Composer全体）

- **セレクタ**: `.input-gradient`
- **意味**: チャット入力エリア全体の外枠（入力欄＋ボタン群）をまとめるコンテナ
- **使われ方**:
  - 入力欄探索のスコープ（この中の `role="textbox"` を拾う）
  - `:focus-within` により入力欄フォーカス状態を判定
  - 拡張が `focused` クラスを付与して表示制御に利用（後述）

### 1.2 実入力エディタ（フォーカス対象）

フォーカス管理は、以下の優先順位で **実際に入力できるノード** を探します。

- **第一候補（より具体）**:
  - `.input-gradient .text-input-field .ql-editor[contenteditable="true"][role="textbox"]`
- **フォールバック（より広い）**:
  - `.input-gradient [contenteditable="true"][role="textbox"]`

ポイント:

- **`contenteditable="true"`**: テキスト入力可能な要素
- **`role="textbox"`**: スクリーンリーダ等向けの意味付け（Gemini側が付与）
- **`.ql-editor`**: Quillエディタの典型クラス。Geminiが内部でリッチテキストエディタを使っている前提

---

## 2. 推定DOMツリー（入力欄周辺の例）

実際のネスト/属性は変わり得ますが、本拡張のセレクタと一般的なQuill構造から、概ね次のような形を想定しています（**例示**）。

```html
<!-- Composer root -->
<div class="input-gradient">
  <!-- Direct child targeted by wide-screen CSS -->
  <div class="input-area-container">
    <!-- Text editor -->
    <div class="text-input-field">
      <div class="ql-container">
        <div
          class="ql-editor"
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
        >
          <p><br /></p>
        </div>
      </div>
    </div>

    <!-- Action buttons (send/upload/model/etc.) -->
    <div class="input-actions">
      <button aria-label="Open upload file menu">…</button>
      <button data-test-id="send-button" aria-label="Send">…</button>
    </div>
  </div>
</div>
```

---

## 3. フォーカス状態と拡張によるクラス付与

### 3.1 `:focus-within` によるフォーカス判定

拡張は `.input-gradient` に対して `:focus-within` を使い、入力欄にフォーカスがあるかを判定します。

### 3.2 `.focused` クラス（拡張が付与）

拡張のフォーカス管理（Shift+Space）では、フォーカス状態を視覚的に反映するために **`.input-gradient` に `focused` クラスを付与/除去** します。

### 3.3 wide screen モード（`html[data-gxt-wide="true"]`）時の入力欄表示制御

`wideScreen` 機能が有効な場合、拡張は `document.documentElement` に `data-gxt-wide="true"` を付与します。

この時、CSS（`src/content/style.css`）により以下の制御が入ります:

- `.input-gradient` 自体を画面下に固定（`position: absolute` / `bottom: 30px` 等）
- `.input-gradient > .input-area-container` を **通常は `opacity: 0`** にして隠す
- `:hover` / `:focus-within` / `.focused` で `opacity: 1` にして表示

つまり、**入力欄の実体は常にDOM上に存在**しつつ、表示は状態で変わる前提です。

---

## 4. 送信ボタン（入力欄の近傍要素）

送信動作（Ctrl+Enter / Cmd+Enter）では、以下の優先順でボタンを探索します。

### 4.1 優先セレクタ（安定度高め）

- `button[data-test-id="send-button"]`

### 4.2 aria-label による探索（ロケール差分を吸収）

- `button[aria-label="Send"]`
- `button[aria-label="Send message"]`
- `button[aria-label*="Send" i]`
- `button[aria-label*="送信"]`（日本語UI用）

### 4.3 無効状態の判定

以下のどちらかで「押せない」を判定します。

- `button.disabled === true`
- `button.getAttribute("aria-disabled") === "true"`

---

## 5. 添付（Upload）メニュー（入力欄の近傍要素）

アップロードは **入力欄のDOM内部ではなく、Angular Materialのオーバーレイ（`cdk-overlay-pane`）側に描画される** ことがあります。

### 5.1 メニューを開くトリガ（入力欄付近のボタン）

- `button[aria-label="Open upload file menu"]`
- `button.upload-card-button.open`（フォールバック）

### 5.2 メニューのルート（オーバーレイ側）

- `mat-action-list[aria-label="Upload file options"]`
  - これが見つかったら、近傍の `.cdk-overlay-pane` を「メニューのコンテナ」とみなします

### 5.3 「Upload files」項目の探索

- 優先: `button[data-test-id="local-images-files-uploader-button"]`
- フォールバック: `button` または `[role=button]` のうち
  - `textContent` もしくは `aria-label` に `/upload files/i` を含むもの

### 5.4 hidden トリガ（高速経路）

メニューを開かずに直接トリガできる場合があります（実装依存）。

- `images-files-uploader button.hidden-local-file-image-selector-button`
- `images-files-uploader [xapfileselectortrigger]`

補足:

- 実際のファイル選択は最終的に `<input type="file">` の `change` を伴います（拡張は `document` の `change` をキャプチャして状態解除に利用）。

---

## 6. 入力欄周辺の「モデル切替」UI（参考）

モデル切替は、入力欄の直近にあるモードボタン＋オーバーレイメニュー、という構造が前提です。

- **メニュー起動**: `[data-test-id="bard-mode-menu-button"] button`
- **メニュー本体**: `.cdk-overlay-pane [role="menu"]`
- **項目**:
  - `[data-test-id="bard-mode-option-fast"]`
  - `[data-test-id="bard-mode-option-thinking"]`
  - `[data-test-id="bard-mode-option-pro"]`

切替後は `.input-gradient [contenteditable="true"][role="textbox"]` にフォーカスを戻します。

---

## 7. DOM変更に強くするための探索手順（拡張の実装思想）

入力欄の探索は、概ね次の手順が安全です。

1. **Composerを限定**: まず `.input-gradient` を起点にする（ページ内に `role="textbox"` が複数ある可能性があるため）
2. **入力可能ノードを特定**: `.ql-editor[contenteditable="true"][role="textbox"]` を優先
3. **フォールバック**: `.input-gradient [contenteditable="true"][role="textbox"]` まで広げる
4. **押下系（送信/アップロード/モデル）**: `data-test-id` → `aria-label` → テキスト一致 の順に劣化させる

---

## 8. 関連実装（根拠コード）

このメモの根拠になっているファイル:

- `src/inject/features/focus-management.ts`（入力欄の探索・フォーカス付与・`.focused`）
- `src/inject/features/model-switch.ts`（入力欄へのフォーカス復帰、モデルメニュー）
- `src/inject/features/ctrl-enter-send.ts`（送信ボタン探索、`contenteditable` 判定）
- `src/inject/features/file-upload.ts`（アップロードメニュー/オーバーレイ探索）
- `src/content/style.css`（wide screen 時の `.input-gradient` / `.input-area-container`）

