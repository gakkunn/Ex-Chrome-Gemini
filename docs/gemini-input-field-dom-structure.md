# Gemini入力欄のDOM構造について

このドキュメントは、**本拡張機能（`src/inject/features/*`）が実際に参照・操作しているセレクタ/属性/イベント**を一次情報として、Geminiの入力欄（プロンプト入力）周辺のDOM構造を整理したものです。

> 注意: これは「Geminiページの実DOMを丸ごとスナップショットしたもの」ではありません。UI更新でクラス構造が変わっても壊れにくいよう、拡張機能が依存している“最小のDOM契約”を中心に記述しています。

## 目次

1. [概要](#概要)
2. [観測ソースと前提](#観測ソースと前提)
3. [入力欄周辺の全体コンテキスト（上位要素・オーバーレイ）](#入力欄周辺の全体コンテキスト上位要素オーバーレイ)
4. [メインコンテナ](#メインコンテナ)
5. [入力エリアコンテナ](#入力エリアコンテナ)
6. [テキスト入力フィールド](#テキスト入力フィールド)
7. [送信ボタン](#送信ボタン)
8. [ファイルアップロード機能](#ファイルアップロード機能)
9. [フォーカス管理](#フォーカス管理)
10. [DOM操作の実装例](#dom操作の実装例)
11. [付録: 入力欄関連セレクタ一覧](#付録-入力欄関連セレクタ一覧)
12. [注意事項](#注意事項)

---

## 概要

拡張機能の実装から、入力欄（プロンプト）は主に以下の要素に依存していることが分かります。

- **入力欄ルート**: `.input-gradient`
- **入力欄本体（エディタ）**: `[contenteditable="true"][role="textbox"]`（Quill利用時は `.text-input-field .ql-editor` を優先）
- **送信ボタン**: `button[data-test-id="send-button"]`（フォールバック: `aria-label`）
- **アップロードメニュー/トリガー**: `button[aria-label="Open upload file menu"]` / `mat-action-list[aria-label="Upload file options"]` / `images-files-uploader ...`

また、メニュー類（アップロード/モデル切替など）は入力欄DOMの中ではなく、**`<body>` 直下のオーバーレイ（`.cdk-overlay-pane`）**に描画される点が重要です。

---

## 観測ソースと前提

このドキュメントは「Geminiの実DOMをフルダンプしたもの」ではなく、**この拡張機能が実際に参照しているセレクタ/属性/イベント**から、入力欄周辺のDOM形式を整理したものです。

### 主な観測ソース（= 拡張機能が依存しているDOM）

- **入力欄ルート/エディタ取得**: `src/inject/features/focus-management.ts`
- **入力欄へフォーカス復帰**: `src/inject/features/model-switch.ts`
- **送信ボタンの取得**: `src/inject/features/ctrl-enter-send.ts`
- **アップロードメニュー/隠しトリガー取得**: `src/inject/features/file-upload.ts`
- **「入力中かどうか」の判定**: `src/inject/features/vim-scroll.ts` / `src/inject/features/new-chat-close-sidebar.ts`
- **入力欄コンテナの表示制御（Wideモード）**: `src/content/style.css`

### 重要な前提

- **入力欄は `contenteditable` 実装を前提**: `<textarea>` ではなく `contenteditable="true"` の要素を前提にしています（拡張機能側の判定/セレクタがそれに寄っています）。
- **UIはSPA + 動的生成**: ページ遷移や状態変化でDOMが再構築され得るため、拡張機能はリトライや監視（MutationObserver）を前提にしています（詳細は[注意事項](#注意事項)）。
- **クラス/属性は変更され得る**: `data-test-id` があるものは比較的安定ですが、それ以外（クラス名など）は変更の影響を受けやすいです。

---

## 入力欄周辺の全体コンテキスト（上位要素・オーバーレイ）

入力欄そのもの（`.input-gradient` 配下）と、**メニュー/ダイアログ（`<body>` 直下に出るオーバーレイ）**はDOM上の置き場所が異なる点が重要です。

### 上位要素（ページ側のコンポーネント）

CSSから、GeminiのUIはカスタム要素やコンポーネントを多用していることが分かります（例: `chat-app`, `bard-logo`, `zero-state-block-picker` など）。入力欄コンテナ `.input-gradient` は通常これらの配下に存在します。

### オーバーレイ（CDK Overlay / Angular Material）

アップロードメニューやモデル切替メニューは、入力欄内ではなく **`.cdk-overlay-pane`（オーバーレイ）配下**に描画されます（拡張機能側のセレクタより）。

代表的に登場する要素:

- **アップロードメニュー**: `mat-action-list[aria-label="Upload file options"]`
- **モデル切替メニュー**: `.cdk-overlay-pane [role="menu"]`
- **確認ダイアログ（例: 削除）**: `mat-dialog-container`

#### モデル切替関連（拡張機能が参照する `data-test-id`）

モデル切替はオーバーレイ（`.cdk-overlay-pane`）内のメニューとして描画される想定で、拡張機能側は以下のセレクタに依存しています（`src/inject/features/model-switch.ts`）。

- **トリガー**: `[data-test-id="bard-mode-menu-button"] button`
- **メニュー本体**: `.cdk-overlay-pane [role="menu"]`
- **選択肢**:
  - `[data-test-id="bard-mode-option-fast"]`
  - `[data-test-id="bard-mode-option-thinking"]`
  - `[data-test-id="bard-mode-option-pro"]`

「入力欄 `.input-gradient` を探してもメニューが見つからない」場合は、`document.body` 配下のオーバーレイを別途探索する必要があります。

### （推定）CDK Overlayの典型的なDOM階層

拡張機能は `.cdk-overlay-pane` を起点に探索していますが、GeminiがAngular CDKを利用している場合、オーバーレイは概ね次のように **`<body>` 直下**に描画されます（クラス名の詳細はUI更新で変わり得ます）。

```html
<body>
  <!-- ...通常のアプリDOM... -->

  <div class="cdk-overlay-container">
    <!-- Backdropが出る場合 -->
    <div class="cdk-overlay-backdrop ..."></div>

    <!-- pane は複数同時に存在し得る -->
    <div class="cdk-overlay-pane">
      <!-- 例: Upload menu -->
      <mat-action-list aria-label="Upload file options">
        ...
      </mat-action-list>
    </div>

    <div class="cdk-overlay-pane">
      <!-- 例: Model menu -->
      <div role="menu">
        ...
      </div>
    </div>
  </div>
</body>
```

ポイント:

- **paneは複数同時に存在し得る**: そのため拡張機能は `mat-action-list[...]` から `closest('.cdk-overlay-pane')` で「該当メニューのpane」を特定しています。
- **探索範囲**: 入力欄配下ではなく `document`/`document.body` 起点で探索するのが安全です。

---

## メインコンテナ

### セレクタ

```css
.input-gradient
```

### 説明

入力欄全体を包む最上位のコンテナ要素です。この要素は以下の特徴を持ちます：

- 入力欄の背景グラデーションやスタイリングを提供
- フォーカス状態の管理に使用される（`.focused` クラス、`:focus-within`）
- 子要素として `.input-area-container` を含む

### DOM構造の例

```html
<div class="input-gradient">
  <!-- 入力エリアコンテナやその他の子要素 -->
</div>
```

### コード内での使用例

```27:32:src/inject/features/focus-management.ts
    const container = document.querySelector('.input-gradient') as HTMLElement | null;
    const editor =
      (container?.querySelector(
        '.text-input-field .ql-editor[contenteditable="true"][role="textbox"]'
      ) as HTMLElement | null) ||
      (container?.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement | null);
```

---

## 入力エリアコンテナ

### セレクタ

```css
.input-gradient > .input-area-container
```

### 説明

メインコンテナ（`.input-gradient`）の直接の子要素で、実際の入力フィールドやボタンを含むコンテナです。

### 特徴

- メインコンテナの直接の子要素として存在
- Wideモードでは非表示（opacity 0）にされ、ホバー/フォーカスで表示される
- テキスト入力フィールドや送信ボタンなどのアクション群を含む

### CSSでの使用例（Wideモード）

```55:69:src/content/style.css
html[data-gxt-wide='true'] .input-gradient > .input-area-container {
  opacity: 0;
  transition: opacity 0.3s ease !important;
  pointer-events: auto !important; /* allow hover/focus detection even when hidden */
}

/* Show when either the parent or the input container itself is hovered/focused */
html[data-gxt-wide='true'] .input-gradient:hover > .input-area-container,
html[data-gxt-wide='true'] .input-gradient > .input-area-container:hover,
html[data-gxt-wide='true'] .input-gradient.focused > .input-area-container,
html[data-gxt-wide='true'] .input-gradient:focus-within > .input-area-container,
html[data-gxt-wide='true'] .input-gradient > .input-area-container:focus-within {
  opacity: 1;
  pointer-events: auto !important;
}
```

---

## テキスト入力フィールド

### セレクタ（優先順位順）

1. **優先セレクタ**（Quillエディタを使用している場合）:

```css
.input-gradient .text-input-field .ql-editor[contenteditable="true"][role="textbox"]
```

2. **フォールバックセレクタ**:

```css
.input-gradient [contenteditable="true"][role="textbox"]
```

### 説明

実際にテキストを入力する `contenteditable` 要素です。GeminiはリッチテキストエディタとしてQuillを使用している可能性があり、その場合は `.ql-editor` クラスを持つ要素が実際の入力フィールドとなります。

### 入力欄の最小DOMツリー（拡張機能が依存するノード）

拡張機能が「入力欄」として最低限依存しているのは、以下の関係です（タグ名は省略しています）:

```
.input-gradient                                 (入力欄全体のルート)
  └── [contenteditable="true"][role="textbox"]  (実際の入力フィールド)
       ※ Quill採用時は .text-input-field .ql-editor が該当しやすい
```

### （参考）Quill採用時に典型的な内部構造

拡張機能は `.ql-editor` を優先探索しているため、入力欄がQuillベースの場合、概ね次のような構造を想定できます（実DOMはUI更新で変わる可能性があります）。

```html
<div class="input-gradient">
  <div class="input-area-container">
    <div class="text-input-field">
      <div class="ql-container">
        <div
          class="ql-editor"
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
        ></div>
        <div class="ql-clipboard" contenteditable="true" tabindex="-1"></div>
      </div>
    </div>
    <!-- 例: 送信/添付などのアクション群（実DOMは変更され得る） -->
  </div>
</div>
```

### 属性

- `contenteditable="true"`: 要素が編集可能であることを示す
- `role="textbox"`: アクセシビリティのためのARIAロール
- `.ql-editor`: Quillエディタを使用している場合に付与されるクラス

### （推定）Quill（`.ql-editor`）内部のDOM表現

拡張機能は「入力欄そのもの」を `.ql-editor[contenteditable="true"][role="textbox"]` として扱いますが、Quill採用時は内部で次のような“入力内容の表現”が一般的です（Geminiの実装都合で差分がある可能性があります）。

- **行（段落）**: `<p>...</p>` の繰り返し
- **空の状態**: `<p><br></p>` のようなプレースホルダ行になりやすい
- **プレースホルダ**: `.ql-editor` に `data-placeholder="..."` が付与され、空のとき `.ql-blank` クラスが付く（CSS `::before` で表示されることが多い）

例（イメージ）:

```html
<div
  class="ql-editor ql-blank"
  contenteditable="true"
  role="textbox"
  data-placeholder="Ask Gemini"
>
  <p><br /></p>
</div>

<div class="ql-editor" contenteditable="true" role="textbox">
  <p>1行目</p>
  <p>2行目</p>
</div>
```

注意:

- Quillには補助要素として `.ql-clipboard[contenteditable="true"]` が存在することがあります。**`[contenteditable="true"]` だけで拾うと誤爆**するので、拡張機能のように `role="textbox"` まで絞るのが安全です。
- 入力内容を読む場合は `innerText` と `textContent` の差（改行の扱い）に注意してください。

### コード内での使用例

#### フォーカス管理での使用

```42:48:src/inject/features/focus-management.ts
export function toggleFocus(): void {
  const container = document.querySelector('.input-gradient') as HTMLElement | null;
  const editor =
    (container?.querySelector(
      '.text-input-field .ql-editor[contenteditable="true"][role="textbox"]'
    ) as HTMLElement | null) ||
    (container?.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement | null);
```

#### モデル切り替え後のフォーカス復帰

```120:130:src/inject/features/model-switch.ts
      // Focus input field after model change
      await new Promise((r) => setTimeout(r, 200));
      const inputField = document.querySelector(SELECTORS.INPUT_FIELD) as HTMLElement | null;
      if (inputField) {
        try {
          inputField.focus({ preventScroll: true });
          console.log('[Model Switch] Focused back to input field');
        } catch (err) {
          console.warn('[Model Switch] Failed to focus input field:', err);
        }
      }
```

#### Vimスクロールでの入力欄判定

```52:66:src/inject/features/vim-scroll.ts
function isInInputField(element: Element | null): boolean {
  if (!element) return false;

  // Check if it's a standard input element
  const tagName = element.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // Check if element is contenteditable or inside contenteditable
  if ((element as HTMLElement).isContentEditable) return true;
  if (element.closest && element.closest('[contenteditable="true"]')) return true;

  return false;
}
```

---

## 送信ボタン

### セレクタ（優先順位順）

1. **主要セレクタ**:

```css
button[data-test-id="send-button"]
```

2. **ARIAラベルベースのセレクタ**:

```css
button[aria-label="Send"]
button[aria-label="Send message"]
button[aria-label*="Send" i]  /* 大文字小文字を区別しない */
button[aria-label*="送信"]     /* 日本語ロケール対応 */
```

### 説明

メッセージを送信するためのボタンです。複数のセレクタが試行され、最初に見つかった有効なボタンが使用されます。

### 状態判定（無効判定）

ボタンは以下の条件で無効と判定されます：

- `(btn as HTMLButtonElement).disabled === true`
- `aria-disabled="true"`
- 非表示（`offsetParent === null`）

### コード内での使用例

```33:67:src/inject/features/ctrl-enter-send.ts
function getSendButton(): { button: HTMLElement | null; disabled: boolean } {
  // Try common selectors first, then fall back to heuristics
  // Note: selector also covers the Japanese "Send" label for locale support
  const candidates = [
    'button[data-test-id="send-button"]',
    'button[aria-label="Send"]',
    'button[aria-label="Send message"]',
    'button[aria-label*="Send" i]',
    'button[aria-label*="送信"]', // Japanese "Send" label (required for locale matching)
  ];
  let disabledMatch: HTMLElement | null = null;
  for (const sel of candidates) {
    const btn = document.querySelector(sel) as HTMLElement | null;
    if (btn && isVisible(btn)) {
      const isDisabled =
        (btn as HTMLButtonElement).disabled || btn.getAttribute('aria-disabled') === 'true';
      if (!isDisabled) return { button: btn, disabled: false };
      disabledMatch = disabledMatch ?? btn;
    }
  }
  // Heuristic: any visible button whose aria-label includes "send"
  const all = document.querySelectorAll('button[aria-label]');
  for (const b of all) {
    const label = (b.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('send') && isVisible(b as HTMLElement)) {
      const isDisabled =
        (b as HTMLButtonElement).disabled || b.getAttribute('aria-disabled') === 'true';
      if (!isDisabled) return { button: b as HTMLElement, disabled: false };
      disabledMatch = disabledMatch ?? (b as HTMLElement);
    }
  }
  return { button: disabledMatch, disabled: !!disabledMatch };
}
```

---

## ファイルアップロード機能

### メニューボタン

#### セレクタ

```css
button[aria-label="Open upload file menu"]
button.upload-card-button.open
```

### アップロードメニュー

#### セレクタ

```css
mat-action-list[aria-label="Upload file options"]
.cdk-overlay-pane  /* メニューのルートコンテナ（pane） */
```

### アップロードボタン（メニュー内）

#### セレクタ

1. **可視ボタン**:

```css
button[data-test-id="local-images-files-uploader-button"]
```

2. **非表示トリガー**:

```css
images-files-uploader button.hidden-local-file-image-selector-button
images-files-uploader [xapfileselectortrigger]
button.hidden-local-file-image-selector-button
[xapfileselectortrigger]
```

### （推定）`images-files-uploader` と隠しトリガーの役割

Geminiのローカルファイル選択は `images-files-uploader`（カスタム要素）配下にまとまっている可能性があり、その内部に以下のいずれかが存在します。

- `button.hidden-local-file-image-selector-button`
- `[xapfileselectortrigger]` 属性を持つ要素（button以外の可能性もある）

これらは「見た目上のメニュー項目」とは別に、**内部の `<input type="file">` を起動するためのトリガー**として機能しているケースが多いです。拡張機能は、

- **可視のアップロード項目**（`data-test-id="local-images-files-uploader-button"`）が取得できる場合はそれをクリック
- 取得できない/構造が変わった場合でも、**隠しトリガーを直接クリック**してファイルピッカー起動を試みる

というフォールバックを持っています。

### コード内での使用例

```78:126:src/inject/features/file-upload.ts
function getMenuButton(): HTMLElement | null {
  return (
    (document.querySelector('button[aria-label="Open upload file menu"]') as HTMLElement | null) ||
    (document.querySelector('button.upload-card-button.open') as HTMLElement | null)
  );
}

function getUploadMenuRoot(): HTMLElement | null {
  const list = document.querySelector('mat-action-list[aria-label="Upload file options"]');
  return (
    (list && (list.closest('.cdk-overlay-pane') as HTMLElement | null)) ||
    (document.querySelector('.cdk-overlay-pane') as HTMLElement | null)
  );
}

function getVisibleUploadBtn(root: HTMLElement): HTMLElement | null {
  return (
    (root.querySelector(
      'button[data-test-id="local-images-files-uploader-button"]'
    ) as HTMLElement | null) ||
    (Array.from(root.querySelectorAll('button,[role=button]')).find(
      (el) =>
        /upload files/i.test((el as HTMLElement).textContent || '') ||
        /upload files/i.test((el as HTMLElement).getAttribute?.('aria-label') || '')
    ) as HTMLElement | undefined) ||
    null
  );
}

function getHiddenTrigger(root: HTMLElement): HTMLElement | null {
  return (
    (root.querySelector(
      'images-files-uploader button.hidden-local-file-image-selector-button'
    ) as HTMLElement | null) ||
    (root.querySelector('images-files-uploader [xapfileselectortrigger]') as HTMLElement | null) ||
    (root.querySelector(
      'button.hidden-local-file-image-selector-button,[xapfileselectortrigger]'
    ) as HTMLElement | null)
  );
}
```

---

## フォーカス管理

### フォーカス状態の判定

入力欄のフォーカス状態は以下の方法で判定されます：

1. **`:focus-within` 疑似クラス**:

```css
.input-gradient:focus-within
```

2. **`.focused` クラス**:
拡張機能が動的に追加するクラスで、フォーカス状態を視覚的に示すために使用されます。

### フォーカスイベント

以下のイベントが監視されます：

- `focusin`: 入力欄内の要素がフォーカスを受け取った時
- `focusout`: 入力欄内の要素がフォーカスを失った時

### コード内での使用例

```84:105:src/inject/features/focus-management.ts
function bind(container: HTMLElement, editor: HTMLElement): void {
  if (current.editor === editor) return;
  if (current.ac) current.ac.abort();

  const ac = new AbortController();
  const { signal } = ac;

  const onFocusIn = (): void => container.classList.add('focused');
  const onFocusOut = (e: FocusEvent): void => {
    if (!container.contains(e.relatedTarget as Node)) {
      container.classList.remove('focused');
    }
  };

  container.addEventListener('focusin', onFocusIn, { signal });
  container.addEventListener('focusout', onFocusOut, { signal });

  // Initial reflection
  container.classList.toggle('focused', container.matches(':focus-within'));

  current = { editor, container, ac };
}
```

### フォーカスの設定（IME配慮）

IME入力（日本語など）の挙動を壊しにくいよう、`focus({ preventScroll: true })` を使用し、必要なら次フレームで再フォーカスします。

```63:75:src/inject/features/focus-management.ts
    // Give focus in "next next frame" and don't touch selection (so IME doesn't switch to ASCII)
    raf2(() => {
      try {
        editor.focus({ preventScroll: true });
      } catch {}
      // Insurance: focus again if stolen by another element
      setTimeout(() => {
        if (!container.matches(':focus-within')) {
          try {
            editor.focus({ preventScroll: true });
          } catch {}
        }
      }, 0);
      container.classList.add('focused');
    });
```

---

## DOM操作の実装例

ここでは「入力欄DOMを扱う上で再利用できる」スニペットをまとめます（拡張機能の実装に沿った形）。

### 入力フィールドの取得（推奨）

```ts
// 1) まず入力欄ルートを取得
const container = document.querySelector('.input-gradient') as HTMLElement | null;

// 2) Quill想定の厳密セレクタ → フォールバックの順で取得
const editor =
  (container?.querySelector(
    '.text-input-field .ql-editor[contenteditable="true"][role="textbox"]'
  ) as HTMLElement | null) ||
  (container?.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement | null) ||
  null;
```

### フォーカスの設定/解除

```ts
editor?.focus({ preventScroll: true });
editor?.blur();
```

### 入力欄内かどうかの判定（キーボード処理のガードに有用）

```ts
function isInInputField(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;

  if ((element as HTMLElement).isContentEditable) return true;
  if (element.closest && element.closest('[contenteditable="true"]')) return true;

  return false;
}
```

### 送信ボタンの取得とクリック

```ts
function isVisible(el: HTMLElement | null): boolean {
  return !!el && el.offsetParent !== null;
}

function getSendButton(): { button: HTMLElement | null; disabled: boolean } {
  const candidates = [
    'button[data-test-id="send-button"]',
    'button[aria-label="Send"]',
    'button[aria-label="Send message"]',
    'button[aria-label*="Send" i]',
    'button[aria-label*="送信"]',
  ];
  let disabledMatch: HTMLElement | null = null;
  for (const sel of candidates) {
    const btn = document.querySelector(sel) as HTMLElement | null;
    if (btn && isVisible(btn)) {
      const isDisabled =
        (btn as HTMLButtonElement).disabled || btn.getAttribute('aria-disabled') === 'true';
      if (!isDisabled) return { button: btn, disabled: false };
      disabledMatch = disabledMatch ?? btn;
    }
  }
  return { button: disabledMatch, disabled: !!disabledMatch };
}

const { button, disabled } = getSendButton();
if (button && !disabled) button.click();
```

### DevToolsでの確認スニペット（手元検証用）

```js
(() => {
  const root = document.querySelector('.input-gradient');
  const editor =
    root?.querySelector('.text-input-field .ql-editor[contenteditable="true"][role="textbox"]') ||
    root?.querySelector('[contenteditable="true"][role="textbox"]');

  const send =
    document.querySelector('button[data-test-id="send-button"]') ||
    document.querySelector('button[aria-label="Send"]') ||
    document.querySelector('button[aria-label="Send message"]') ||
    document.querySelector('button[aria-label*="Send" i]') ||
    document.querySelector('button[aria-label*="送信"]');

  return {
    root,
    editor,
    send,
    editorInfo: editor
      ? {
          tag: editor.tagName,
          role: editor.getAttribute('role'),
          contenteditable: editor.getAttribute('contenteditable'),
          class: editor.className,
        }
      : null,
    sendInfo: send
      ? {
          tag: send.tagName,
          testId: send.getAttribute('data-test-id'),
          ariaLabel: send.getAttribute('aria-label'),
          disabled: send.getAttribute('aria-disabled') || (send.disabled ?? null),
        }
      : null,
  };
})();
```

---

## 付録: 入力欄関連セレクタ一覧

この拡張機能が「入力欄周辺」で使用している主要セレクタを用途別にまとめます（実装の一次情報として参照してください）。

| 用途 | セレクタ | 主な利用箇所 |
| --- | --- | --- |
| 入力欄ルート | `.input-gradient` | `focus-management.ts` / `style.css` |
| 入力欄コンテナ（直下） | `.input-gradient > .input-area-container` | `style.css` |
| 入力フィールド（優先: Quill） | `.text-input-field .ql-editor[contenteditable="true"][role="textbox"]` | `focus-management.ts` |
| 入力フィールド（フォールバック） | `.input-gradient [contenteditable="true"][role="textbox"]` | `model-switch.ts` / `vim-scroll.ts` |
| 送信ボタン（最優先） | `button[data-test-id="send-button"]` | `ctrl-enter-send.ts` |
| 送信ボタン（フォールバック） | `button[aria-label="Send"]` ほか | `ctrl-enter-send.ts` |
| アップロードメニュー起動 | `button[aria-label="Open upload file menu"]` | `file-upload.ts` |
| アップロードメニュー本体 | `mat-action-list[aria-label="Upload file options"]` | `file-upload.ts` |
| アップロード（可視ボタン） | `button[data-test-id="local-images-files-uploader-button"]` | `file-upload.ts` |
| アップロード（隠しトリガー） | `images-files-uploader [xapfileselectortrigger]` ほか | `file-upload.ts` |
| モデル切替メニュー起動 | `[data-test-id="bard-mode-menu-button"] button` | `model-switch.ts` |
| モデル切替メニュー | `.cdk-overlay-pane [role="menu"]` | `model-switch.ts` |
| モデル切替（Fast） | `[data-test-id="bard-mode-option-fast"]` | `model-switch.ts` |
| モデル切替（Thinking） | `[data-test-id="bard-mode-option-thinking"]` | `model-switch.ts` |
| モデル切替（Pro） | `[data-test-id="bard-mode-option-pro"]` | `model-switch.ts` |

---

## 注意事項

### 1. DOM要素の動的生成（リトライが必要）

Geminiの入力欄は動的に生成される可能性があります。そのため、要素を取得する際は以下の対策が必要です：

- **リトライロジック**: 要素が見つかるまで一定間隔で再試行する
- **MutationObserver**: DOMの変更を監視する
- **SPA遷移**: `pushState` / `replaceState` / `popstate` をフックして再バインドする

実装例（リトライ）:

```24:40:src/inject/features/focus-management.ts
function tryBindWithRetry(retries = RETRIES, interval = INTERVAL): void {
  let attempts = 0;
  const timer = setInterval(() => {
    const container = document.querySelector('.input-gradient') as HTMLElement | null;
    const editor =
      (container?.querySelector(
        '.text-input-field .ql-editor[contenteditable="true"][role="textbox"]'
      ) as HTMLElement | null) ||
      (container?.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement | null);

    if ((container && editor) || attempts >= retries) {
      clearInterval(timer);
      if (container && editor) bind(container, editor);
    }
    attempts++;
  }, interval);
}
```

### 2. IME（入力メソッド）への配慮

IME入力中は `keydown` を強く止めると不具合が起きやすいです。拡張機能は `compositionstart` / `compositionend` をキャプチャし、IME入力中は送信処理などをスキップします。

```112:126:src/inject/features/ctrl-enter-send.ts
const onCompStart = (): void => {
  IME.active = true;
};
const onCompEnd = (): void => {
  IME.active = false;
};

/**
 * Initialize Ctrl+Enter send feature
 */
export function initializeCtrlEnterSend(): void {
  // IME listeners are always needed for composition tracking
  document.addEventListener('compositionstart', onCompStart, COMPOSITION_CAPTURE_OPTIONS);
  document.addEventListener('compositionend', onCompEnd, COMPOSITION_CAPTURE_OPTIONS);
}
```

### 3. セレクタの優先順位（壊れにくさ）

入力フィールドのセレクタには優先順位があります。

1. `.text-input-field .ql-editor[contenteditable="true"][role="textbox"]`（具体的・優先）
2. `.input-gradient [contenteditable="true"][role="textbox"]`（フォールバック）

また、送信ボタン/モデル切替などは **`data-test-id` が最優先**で、次に `aria-label` をフォールバックとして使用します。

### 4. まとめ（入力欄DOMの最小契約）

拡張機能が期待する最小限の構造は概ね次のとおりです：

```
.input-gradient
  └── [contenteditable="true"][role="textbox"]   // 入力欄

button[data-test-id="send-button"]              // 送信
button[aria-label="Open upload file menu"]      // アップロードメニュー起動（環境により変動）

.cdk-overlay-pane
  ├── mat-action-list[aria-label="Upload file options"]   // アップロードメニュー
  └── [role="menu"]                                       // モデル切替など
```

