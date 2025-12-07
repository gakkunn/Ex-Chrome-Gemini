import { BRIDGE_MESSAGE } from '@/shared/messaging';
import { I18N_KEYS } from '@/shared/i18n';
import { STORAGE_KEY } from '@/shared/storage';
import './style.css';

const I18N_DATA_ELEMENT_ID = '__gxt_i18n_payload';

function injectI18nMessages(): void {
  if (!chrome.i18n?.getMessage) return;
  const messages: Record<string, string> = {};
  I18N_KEYS.forEach((key) => {
    messages[key] = chrome.i18n.getMessage(key) || '';
  });

  let dataElement = document.getElementById(I18N_DATA_ELEMENT_ID) as HTMLScriptElement | null;
  if (!dataElement) {
    dataElement = document.createElement('script');
    dataElement.id = I18N_DATA_ELEMENT_ID;
    dataElement.type = 'application/json';
    dataElement.setAttribute('data-source', 'gxt-i18n');
    dataElement.style.display = 'none';
    (document.documentElement || document.head || document.body)?.appendChild(dataElement);
  }

  dataElement.textContent = JSON.stringify(messages);
}

injectI18nMessages();

const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/inject/index.js');
script.type = 'module';
(document.head || document.documentElement).appendChild(script);

// --- Message Bridge (ISOLATED World <-> MAIN World) ---

console.log('[Gemini Shortcut Extension Content] Content script loaded');

window.addEventListener('message', async (event) => {
  if (event.source !== window) return;

  const { type, payload } = event.data;

  if (type === BRIDGE_MESSAGE.REQUEST_SETTINGS) {
    console.log('[Gemini Shortcut Extension Content] Received REQUEST_SETTINGS');
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const settings = result[STORAGE_KEY] || {};
      console.log('[Gemini Shortcut Extension Content] Sending SETTINGS_UPDATE:', settings);
      window.postMessage({ type: BRIDGE_MESSAGE.SETTINGS_UPDATE, payload: settings }, '*');
    });
  } else if (type === BRIDGE_MESSAGE.SAVE_SETTINGS) {
    console.log('[Gemini Shortcut Extension Content] Received SAVE_SETTINGS:', payload);
    if (payload) {
      chrome.storage.sync.set({ [STORAGE_KEY]: payload });
    }
  } else if (type === BRIDGE_MESSAGE.OPEN_SETTINGS) {
    chrome.runtime.sendMessage({ action: 'openSettings' });
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  console.log('[Gemini Shortcut Extension Content] Storage changed:', area, changes);
  if (area === 'sync' && changes[STORAGE_KEY]) {
    const newSettings = changes[STORAGE_KEY].newValue || {};
    console.log('[Gemini Shortcut Extension Content] Broadcasting settings update:', newSettings);
    window.postMessage({ type: BRIDGE_MESSAGE.SETTINGS_UPDATE, payload: newSettings }, '*');
  }
});
