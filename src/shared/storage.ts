import { BRIDGE_MESSAGE, addBridgeListener, postBridgeMessage } from './messaging';
import { mergeSettings } from './settings';

import type { ExtensionSettings } from './settings';

export const STORAGE_KEY = 'geminiUnifiedSettings';

export async function loadSettings(): Promise<ExtensionSettings> {
  const hasChrome = typeof chrome !== 'undefined' && chrome.storage?.sync;
  console.log('[Gemini Shortcut Extension Storage] loadSettings called, hasChrome:', hasChrome);

  if (hasChrome) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        const saved = result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined;
        console.log('[Gemini Shortcut Extension Storage] Loaded from chrome.storage:', saved);
        resolve(mergeSettings(saved));
      });
    });
  }

  console.log('[Gemini Shortcut Extension Storage] Using bridge to load settings...');
  return new Promise((resolve) => {
    const unsubscribe = addBridgeListener(BRIDGE_MESSAGE.SETTINGS_UPDATE, (payload) => {
      console.log('[Gemini Shortcut Extension Storage] Received settings via bridge:', payload);
      unsubscribe();
      resolve(mergeSettings(payload || undefined));
    });
    postBridgeMessage(BRIDGE_MESSAGE.REQUEST_SETTINGS, undefined);
  });
}

export async function saveSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const current = (result[STORAGE_KEY] as Partial<ExtensionSettings>) || {};
        const next = mergeSettings(current, partial);

        chrome.storage.sync.set({ [STORAGE_KEY]: next }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    });
  }

  return new Promise((resolve) => {
    postBridgeMessage(BRIDGE_MESSAGE.SAVE_SETTINGS, partial);
    resolve();
  });
}
