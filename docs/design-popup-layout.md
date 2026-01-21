# Popup UI レイアウト設計（配置要件）

このドキュメントは、Popup UI の**要素配置（順序）**に関する設計要件を定義します。  
特に「レビュー誘導（footerブロック）」の配置が実装者によってブレないように明文化します。

## 対象

- Popup UI（`src/popup/App.tsx`）の `return` 内のレイアウト（DOM順）

## 配置要件（必須）

- **タイトル（`<h1>`）の直下にレビュー導線（footerブロック）を配置する**
  - `src/popup/App.tsx` の `<header class="header-row">`（タイトル行）の**直後**に、`<footer class="popup-footer">` を置く
  - `loading` 表示（`popup_loading`）や、設定カード（Features / Shortcuts）より **上** に footer が来る
- **レビュー導線（footerブロック）の範囲**
  - `getMessage('popup_footer_review_prompt')` を表示するメッセージ行（`.footer-message`）
  - その下のリンク群（`.links`）全体（Review を含むボタン群）

## スタイル要件（CSS）

対象: `src/popup/popup.css`

- **レビュー誘導メッセージ（`.footer-message`）**
  - 中央寄せ + 小さめ文字
  - **下余白は `15px`**（リンク群との間隔確保）
- **Review ボタンのツールチップラベル**
  - `.review-button::after` の `content` は `'Review'`

実装上のアンカーは以下です（値は完全一致）。

```263:363:src/popup/popup.css
.popup-footer {
  margin-top: var(--footer-margin-top, 0.5rem);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-message {
  margin: 0 0 15px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

// ... links / tooltip base styles ...

.review-button::after {
  content: 'Review';
}
```

## 誤実装防止（禁止事項）

- footerブロックを **ページ最下部**（設定カードの下）に配置しない  
  - 要件は「タイトル直下」であり、スクロールしないと見えない場所に置くのはNG
- レビュー誘導メッセージ（`.footer-message`）だけをタイトル直下に置いて、リンク群だけを下へ残す、のように **footerブロックを分割しない**

## コード上のアンカー（要素順序の根拠）

以下のように、`header → footer → loading → settings` の順になっていることが要件です。

```372:452:src/popup/App.tsx
  return (
    <div class="popup-wrapper">
      <header class="header-row">
        <div>
          <h1>{getMessage('app_name_short')}</h1>
        </div>
        <button
          class="reset-button"
          type="button"
          onClick={handleReset}
          disabled={resetting || loading}
        >
          {getMessage('popup_button_reset')}
        </button>
      </header>

      <footer class="popup-footer">
        <p class="footer-message">{getMessage('popup_footer_review_prompt')}</p>
        <section class="links">
          <div>
            <a class="footer-button github-button" href={GITHUB_URL} target="_blank" rel="noreferrer noopener" aria-label="Contribute">
              <span>
                <img class="icon" src={ICON_GITHUB_SRC} alt="Contribute" />
              </span>
            </a>
          </div>
          <div>
            <a class="footer-button question-button" href={SUPPORT_FORM_URL} target="_blank" rel="noreferrer noopener" aria-label="Support">
              <span>
                <img class="icon" src={ICON_SUPPORT_SRC} alt="Report a problem" />
              </span>
            </a>
          </div>
          <div>
            <a class="footer-button review-button" href={REVIEW_URL} target="_blank" rel="noreferrer noopener" aria-label="Review">
              <span>
                <img class="icon" src={ICON_REVIEW_SRC} alt="Review" />
              </span>
            </a>
          </div>
          <div>
            <a class="footer-button coffee-button" href={COFFEE_URL} target="_blank" rel="noreferrer noopener" aria-label="Buy me a coffee">
              <span>
                <img class="icon" src={ICON_COFFEE_SRC} alt="Buy me a coffee" />
              </span>
            </a>
          </div>
        </section>
      </footer>

      {loading && <p class="helper-text">{getMessage('popup_loading')}</p>}

      {!loading && settings && (
        <>
          <section class="card">
            <h2>{getMessage('popup_section_features')}</h2>
```

## 関連（実装手順書）

- `docs/repro-review-footer.md`

