const I18N_DATA_ELEMENT_ID = '__gxt_i18n_payload';

(() => {
  if (typeof window === 'undefined') return;
  if (window.__gxt_i18n) return;
  const dataElement = document.getElementById(I18N_DATA_ELEMENT_ID);
  if (!dataElement?.textContent) return;
  try {
    window.__gxt_i18n = JSON.parse(dataElement.textContent);
  } catch (error) {
    console.warn('[Gemini Shortcut Extension] Failed to parse i18n payload', error);
  }
})();
