# Popup footer レビュー導線 変更設計書（再現手順）

このドキュメントは、Popup footer に「レビュー誘導メッセージ（i18n）」と「Review ボタン（SVGアイコン）」を追加し、あわせて各ロケールの文言と fallback を整備する変更を、**後から同じ状態を再現できる** ようにファイル単位で「パッチ相当」の精度で記述したものです。

## 目的

- Popup footer から Chrome Web Store のレビュー画面へ誘導する導線を追加する
- 誘導メッセージを i18n 対応し、すべての言語で表示できるようにする（ロケール未対応時は fallback を使用）

## 仕様（期待する見た目/挙動）

- Footer のリンク群の上に、`getMessage('popup_footer_review_prompt')` のメッセージを表示する
- Footer のボタンは以下を持つ（既存 + Review 追加）
  - Contribute（GitHub）
  - Support（フォーム）
  - Review（Chrome Web Store reviews）
  - Buy me a coffee
- Review ボタンは `REVIEW_URL`（固定URL）へ `target="_blank"` で遷移する
- Review ボタンのアイコンは `public/img/review.svg` を利用し、参照パスは `/img/review.svg`
- `.footer-message` は中央寄せ・小さめ文字で表示し、下に余白（`margin-bottom: 15px`）を持つ

## 変更対象ファイル

- `public/img/review.svg`（新規）
- `src/popup/App.tsx`
- `src/popup/popup.css`
- `src/shared/i18n.ts`
- `/_locales/de/messages.json`
- `/_locales/en/messages.json`
- `/_locales/es/messages.json`
- `/_locales/fr/messages.json`
- `/_locales/ja/messages.json`
- `/_locales/ko/messages.json`
- `/_locales/pt_BR/messages.json`
- `/_locales/pt_PT/messages.json`
- `/_locales/zh_CN/messages.json`
- `/_locales/zh_TW/messages.json`

---

## 実装: Popup footer に Review 導線を追加

### 1) `public/img/review.svg` を新規追加

ファイルを新規作成し、内容を **完全一致** で以下にします。

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="#e2e8f0"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
</svg>
```

### 2) `src/popup/App.tsx` を変更（Review URL / アイコン / footer構造）

以下の差分を適用します（**そのまま貼れる unified diff**）。

```diff
diff --git a/src/popup/App.tsx b/src/popup/App.tsx
index 93a531f..f3584ca 100644
--- a/src/popup/App.tsx
+++ b/src/popup/App.tsx
@@ -32,10 +32,13 @@ const GITHUB_URL = 'https://github.com/gakkunn/Ex-Chrome-ChatGPT';
 const SUPPORT_FORM_URL =
   'https://docs.google.com/forms/d/e/1FAIpQLScm_N4J2Sv-WE0Y-fdU-gwUl4OfWM81v1NaGjZ16PSZbrVm_w/viewform';
 const COFFEE_URL = 'https://buymeacoffee.com/gakkunn';
+const REVIEW_URL =
+  'https://chromewebstore.google.com/detail/chatgpt-shortcut-effectiv/aoemceeicbdlapmljecabaegdjnifllg/reviews?hl=en&authuser=0';
 
 const ICON_GITHUB_SRC = '/img/github.svg';
 const ICON_SUPPORT_SRC = '/img/support.svg';
 const ICON_COFFEE_SRC = '/img/coffee.svg';
+const ICON_REVIEW_SRC = '/img/review.svg';
 
 const FEATURE_LABEL_KEYS: Record<FeatureCategory, MessageKey> = {
   vimScroll: 'popup_feature_label_vim_scroll',
@@ -382,6 +385,64 @@ export function App() {
         </button>
       </header>
 
+      <footer class="popup-footer">
+        <p class="footer-message">{getMessage('popup_footer_review_prompt')}</p>
+        <section class="links">
+          <div>
+            <a
+              class="footer-button github-button"
+              href={GITHUB_URL}
+              target="_blank"
+              rel="noreferrer noopener"
+              aria-label="Contribute"
+            >
+              <span>
+                <img class="icon" src={ICON_GITHUB_SRC} alt="Contribute" />
+              </span>
+            </a>
+          </div>
+          <div>
+            <a
+              class="footer-button question-button"
+              href={SUPPORT_FORM_URL}
+              target="_blank"
+              rel="noreferrer noopener"
+              aria-label="Support"
+            >
+              <span>
+                <img class="icon" src={ICON_SUPPORT_SRC} alt="Report a problem" />
+              </span>
+            </a>
+          </div>
+          <div>
+            <a
+              class="footer-button review-button"
+              href={REVIEW_URL}
+              target="_blank"
+              rel="noreferrer noopener"
+              aria-label="Review"
+            >
+              <span>
+                <img class="icon" src={ICON_REVIEW_SRC} alt="Review" />
+              </span>
+            </a>
+          </div>
+          <div>
+            <a
+              class="footer-button coffee-button"
+              href={COFFEE_URL}
+              target="_blank"
+              rel="noreferrer noopener"
+              aria-label="Buy me a coffee"
+            >
+              <span>
+                <img class="icon" src={ICON_COFFEE_SRC} alt="Buy me a coffee" />
+              </span>
+            </a>
+          </div>
+        </section>
+      </footer>
+ 
       {loading && <p class="helper-text">{getMessage('popup_loading')}</p>}
 
       {!loading && settings && (
@@ -458,49 +519,6 @@ export function App() {
         </>
       )}
 
-      <footer class="popup-footer">
-        <section class="links">
-          <div>
-            <a
-              class="footer-button github-button"
-              href={GITHUB_URL}
-              target="_blank"
-              rel="noreferrer noopener"
-              aria-label="Contribute"
-            >
-              <span>
-                <img class="icon" src={ICON_GITHUB_SRC} alt="Contribute" />
-              </span>
-            </a>
-          </div>
-          <div>
-            <a
-              class="footer-button question-button"
-              href={SUPPORT_FORM_URL}
-              target="_blank"
-              rel="noreferrer noopener"
-              aria-label="Support"
-            >
-              <span>
-                <img class="icon" src={ICON_SUPPORT_SRC} alt="Report a problem" />
-              </span>
-            </a>
-          </div>
-          <div>
-            <a
-              class="footer-button coffee-button"
-              href={COFFEE_URL}
-              target="_blank"
-              rel="noreferrer noopener"
-              aria-label="Buy me a coffee"
-            >
-              <span>
-                <img class="icon" src={ICON_COFFEE_SRC} alt="Buy me a coffee" />
-              </span>
-            </a>
-          </div>
-        </section>
-      </footer>
     </div>
   );
 }
```

### 3) `src/popup/popup.css` を変更（`.footer-message` と Review ラベル）

以下の差分を適用します。

```diff
diff --git a/src/popup/popup.css b/src/popup/popup.css
index b8006b1..964e4c2 100644
--- a/src/popup/popup.css
+++ b/src/popup/popup.css
@@ -268,6 +268,13 @@ h1 {
   align-items: center;
 }
 
+.footer-message {
+  margin: 0 0 6px;
+  text-align: center;
+  font-size: 12px;
+  color: #94a3b8;
+}
+
 .popup-footer hr {
   margin: var(--hr-margin-y, 1rem) 0;
   width: var(--hr-width, 80%);
@@ -347,6 +354,10 @@ h1 {
   content: 'Support';
 }
 
+.review-button::after {
+  content: 'Review';
+}
+
 .coffee-button::after {
   content: 'Buy me a coffee';
 }
```

---

## 実装: 文言の i18n 対応（fallback + 全ロケール）と余白調整

### 1) `src/shared/i18n.ts` に fallback 文字列を追加

以下の差分を適用します（**文字列は完全一致**）。

```diff
diff --git a/src/shared/i18n.ts b/src/shared/i18n.ts
index 6394bc9..14cbec1 100644
--- a/src/shared/i18n.ts
+++ b/src/shared/i18n.ts
@@ -9,6 +9,7 @@ const FALLBACK_MESSAGES = {
   popup_section_features: 'Features',
   popup_section_shortcuts: 'Shortcuts',
   popup_loading: 'Loading settings...',
+  popup_footer_review_prompt: 'Even a short comment would truly make me happy',
   popup_feature_label_vim_scroll: 'Vim-like Scroll',
   popup_feature_label_wide_screen: 'Wide Screen (Clean UI + Focus)',
   popup_feature_label_safe_send: 'Send with Cmd/Ctrl + Enter',
```

### 2) `src/popup/popup.css` の `.footer-message` の margin を調整（`6px` → `15px`）

上記で追加した `.footer-message` の `margin` を以下の通り置換します。

```diff
diff --git a/src/popup/popup.css b/src/popup/popup.css
index 964e4c2..a34cb78 100644
--- a/src/popup/popup.css
+++ b/src/popup/popup.css
@@ -269,7 +269,7 @@ h1 {
 }
 
 .footer-message {
-  margin: 0 0 6px;
+  margin: 0 0 15px;
   text-align: center;
   font-size: 12px;
   color: #94a3b8;
```

### 3) 各ロケールの `messages.json` に `popup_footer_review_prompt` を追加

以下はロケールファイルへのキー追加を、そのまま unified diff として列挙します。

> 注意: 英語（`_locales/en/messages.json`）のみ `description` があり、他言語は `message` のみです。

#### `_locales/de/messages.json`

```diff
diff --git a/_locales/de/messages.json b/_locales/de/messages.json
index 0635e76..5a731ff 100644
--- a/_locales/de/messages.json
+++ b/_locales/de/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "Funktionen" },
   "popup_section_shortcuts": { "message": "Kurzbefehle" },
   "popup_loading": { "message": "Einstellungen werden geladen..." },
+  "popup_footer_review_prompt": {
+    "message": "Schon ein kurzer Kommentar würde mich von Herzen freuen."
+  },
   "popup_feature_label_vim_scroll": { "message": "Scrollen wie in Vim" },
   "popup_feature_label_wide_screen": { "message": "Breitbild (Clean UI + Fokus)" },
   "popup_feature_label_safe_send": { "message": "Mit Cmd/Ctrl + Eingabetaste senden" },
```

#### `_locales/en/messages.json`

```diff
diff --git a/_locales/en/messages.json b/_locales/en/messages.json
index d68d33e..17bc84f 100644
--- a/_locales/en/messages.json
+++ b/_locales/en/messages.json
@@ -35,6 +35,10 @@
     "message": "Loading settings...",
     "description": "Helper text shown while storage sync is pending."
   },
+  "popup_footer_review_prompt": {
+    "message": "Even a short comment would truly make me happy",
+    "description": "Message shown above the footer links encouraging reviews."
+  },
   "popup_feature_label_vim_scroll": {
     "message": "Vim-like Scroll",
     "description": "Toggle label for the vim scroll feature."
```

#### `_locales/es/messages.json`

```diff
diff --git a/_locales/es/messages.json b/_locales/es/messages.json
index 9c2ba4e..3e33715 100644
--- a/_locales/es/messages.json
+++ b/_locales/es/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "Funciones" },
   "popup_section_shortcuts": { "message": "Atajos" },
   "popup_loading": { "message": "Cargando ajustes..." },
+  "popup_footer_review_prompt": {
+    "message": "Incluso un comentario breve me alegraría de corazón."
+  },
   "popup_feature_label_vim_scroll": { "message": "Desplazamiento estilo Vim" },
   "popup_feature_label_wide_screen": { "message": "Pantalla ancha (UI limpia + enfoque)" },
   "popup_feature_label_safe_send": { "message": "Enviar con Cmd/Ctrl + Enter" },
```

#### `_locales/fr/messages.json`

```diff
diff --git a/_locales/fr/messages.json b/_locales/fr/messages.json
index 043cd87..eb276dc 100644
--- a/_locales/fr/messages.json
+++ b/_locales/fr/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "Fonctionnalités" },
   "popup_section_shortcuts": { "message": "Raccourcis" },
   "popup_loading": { "message": "Chargement des paramètres..." },
+  "popup_footer_review_prompt": {
+    "message": "Même un bref commentaire me ferait chaud au cœur."
+  },
   "popup_feature_label_vim_scroll": { "message": "Défilement façon Vim" },
   "popup_feature_label_wide_screen": { "message": "Grand écran (UI épurée + focus)" },
   "popup_feature_label_safe_send": { "message": "Envoyer avec Cmd/Ctrl + Entrée" },
```

#### `_locales/ja/messages.json`

```diff
diff --git a/_locales/ja/messages.json b/_locales/ja/messages.json
index 0cc15de..535e229 100644
--- a/_locales/ja/messages.json
+++ b/_locales/ja/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "機能" },
   "popup_section_shortcuts": { "message": "ショートカット" },
   "popup_loading": { "message": "設定を読み込んでいます..." },
+  "popup_footer_review_prompt": {
+    "message": "短いコメントでもくれると心の底から喜びます。"
+  },
   "popup_feature_label_vim_scroll": { "message": "Vim 風スクロール" },
   "popup_feature_label_wide_screen": { "message": "ワイド画面（クリーン UI + フォーカス）" },
   "popup_feature_label_safe_send": { "message": "Cmd/Ctrl + Enter で送信" },
```

#### `_locales/ko/messages.json`

```diff
diff --git a/_locales/ko/messages.json b/_locales/ko/messages.json
index f75b66d..be0697c 100644
--- a/_locales/ko/messages.json
+++ b/_locales/ko/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "기능" },
   "popup_section_shortcuts": { "message": "단축키" },
   "popup_loading": { "message": "설정을 불러오는 중..." },
+  "popup_footer_review_prompt": {
+    "message": "짧은 코멘트만 남겨도 마음 깊이 기쁩니다."
+  },
   "popup_feature_label_vim_scroll": { "message": "Vim 스타일 스크롤" },
   "popup_feature_label_wide_screen": { "message": "와이드 화면(클린 UI + 포커스)" },
   "popup_feature_label_safe_send": { "message": "Cmd/Ctrl + Enter 로 보내기" },
```

#### `_locales/pt_BR/messages.json`

```diff
diff --git a/_locales/pt_BR/messages.json b/_locales/pt_BR/messages.json
index 790cfcc..3f96e20 100644
--- a/_locales/pt_BR/messages.json
+++ b/_locales/pt_BR/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "Recursos" },
   "popup_section_shortcuts": { "message": "Atalhos" },
   "popup_loading": { "message": "Carregando configurações..." },
+  "popup_footer_review_prompt": {
+    "message": "Mesmo um comentário curto me alegraria de coração."
+  },
   "popup_feature_label_vim_scroll": { "message": "Rolagem estilo Vim" },
   "popup_feature_label_wide_screen": { "message": "Tela ampla (UI limpa + foco)" },
   "popup_feature_label_safe_send": { "message": "Enviar com Cmd/Ctrl + Enter" },
```

#### `_locales/pt_PT/messages.json`

```diff
diff --git a/_locales/pt_PT/messages.json b/_locales/pt_PT/messages.json
index b283ac2..056fc5a 100644
--- a/_locales/pt_PT/messages.json
+++ b/_locales/pt_PT/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "Funcionalidades" },
   "popup_section_shortcuts": { "message": "Atalhos" },
   "popup_loading": { "message": "A carregar definições..." },
+  "popup_footer_review_prompt": {
+    "message": "Mesmo um comentário curto me alegraria do fundo do coração."
+  },
   "popup_feature_label_vim_scroll": { "message": "Deslocação estilo Vim" },
   "popup_feature_label_wide_screen": { "message": "Ecrã largo (IU limpa + foco)" },
   "popup_feature_label_safe_send": { "message": "Enviar com Cmd/Ctrl + Enter" },
```

#### `_locales/zh_CN/messages.json`

```diff
diff --git a/_locales/zh_CN/messages.json b/_locales/zh_CN/messages.json
index bfc5107..1bde383 100644
--- a/_locales/zh_CN/messages.json
+++ b/_locales/zh_CN/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "功能" },
   "popup_section_shortcuts": { "message": "快捷键" },
   "popup_loading": { "message": "正在加载设置..." },
+  "popup_footer_review_prompt": {
+    "message": "哪怕只留一句简短的评论也会让我由衷地开心。"
+  },
   "popup_feature_label_vim_scroll": { "message": "Vim 风格滚动" },
   "popup_feature_label_wide_screen": { "message": "宽屏（干净界面 + 聚焦）" },
   "popup_feature_label_safe_send": { "message": "使用 Cmd/Ctrl + Enter 发送" },
```

#### `_locales/zh_TW/messages.json`

```diff
diff --git a/_locales/zh_TW/messages.json b/_locales/zh_TW/messages.json
index 2bfdf2d..1df58b0 100644
--- a/_locales/zh_TW/messages.json
+++ b/_locales/zh_TW/messages.json
@@ -10,6 +10,9 @@
   "popup_section_features": { "message": "功能" },
   "popup_section_shortcuts": { "message": "快捷鍵" },
   "popup_loading": { "message": "正在載入設定..." },
+  "popup_footer_review_prompt": {
+    "message": "哪怕只留下一句簡短的評論也會讓我由衷地開心。"
+  },
   "popup_feature_label_vim_scroll": { "message": "Vim 風格捲動" },
   "popup_feature_label_wide_screen": { "message": "寬螢幕（乾淨介面 + 聚焦）" },
   "popup_feature_label_safe_send": { "message": "使用 Cmd/Ctrl + Enter 傳送" },
```

---

## 最低限の動作確認（ローカル）

以下は「変更が入ったこと」を確認するための最小手順です。

1. ビルド:

```bash
npm run build
```

2. 拡張機能を Chrome に読み込み（ビルド成果物が期待通り生成されている前提）し、Popup を開く
3. Footer に以下があることを確認
   - `getMessage('popup_footer_review_prompt')` の文言（言語に応じて変化）
   - Review アイコンボタン（`/img/review.svg`）があり、クリックで `REVIEW_URL` に遷移する

