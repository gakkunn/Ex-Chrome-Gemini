/**
 * Main entry point for Gemini Shortcut Effective Extension
 * Initializes all features in the correct order
 */

import './viewport-spoof';
import './i18n-bootstrap';

import { DEFAULT_FEATURE_TOGGLES } from '@/shared/feature-flags';
import { BRIDGE_MESSAGE } from '@/shared/messaging';
import { mergeSettings } from '@/shared/settings';
import { DEFAULT_SHORTCUTS } from '@/shared/shortcuts';
import { loadSettings } from '@/shared/storage';

import {
  initializeFocusManagement,
  initializeSidebar,
  initializeNewChatCloseSidebar,
  initializeChatDelete,
  initializeFileUpload,
  initializePinChat,
  initializePreserveScrollOnSend,
} from './features';
import { ShortcutsManager } from './shortcuts/manager';
import { setFeatureToggles } from './state/toggles';
import { initializeUtils } from './utils/common';

import type { ExtensionSettings } from '@/shared/settings';

/**
 * Initialize all extension features
 */
async function initializeExtension(): Promise<void> {
  console.log('[Gemini Shortcut Extension] Starting initialization...');

  // Initialize utilities first (required by other features)
  initializeUtils();

  let currentSettings: ExtensionSettings = {
    featureToggles: { ...DEFAULT_FEATURE_TOGGLES },
    shortcuts: { ...DEFAULT_SHORTCUTS },
  };

  try {
    console.log('[Gemini Shortcut Extension] Loading settings...');
    currentSettings = await loadSettings();
    console.log('[Gemini Shortcut Extension] Settings loaded:', currentSettings);
  } catch (e) {
    console.error(
      '[Gemini Shortcut Extension] Failed to load settings, falling back to defaults',
      e
    );
  }

  setFeatureToggles(currentSettings.featureToggles);

  // Initialize features that have their own setup (not managed by ShortcutsManager for keydowns)
  initializeFocusManagement(); // Handles history patching and focus styling
  initializeSidebar();
  initializeNewChatCloseSidebar();
  initializeChatDelete();
  initializeFileUpload();
  initializePinChat();
  initializePreserveScrollOnSend();

  // Initialize ShortcutsManager
  const shortcutsManager = new ShortcutsManager(currentSettings);

  // Listen for settings changes to update manager (via bridge)
  window.addEventListener(
    'message',
    (event) => {
      if (event.source !== window) return;
      if (event.data?.type === BRIDGE_MESSAGE.SETTINGS_UPDATE) {
        const newSettings = event.data.payload;
        console.log('[Gemini Shortcut Extension] Received settings update:', newSettings);
        if (newSettings) {
          currentSettings = mergeSettings(currentSettings, newSettings);
          console.log('[Gemini Shortcut Extension] Merged settings:', currentSettings);
          setFeatureToggles(currentSettings.featureToggles);
          shortcutsManager.updateSettings(currentSettings);
          console.log('[Gemini Shortcut Extension] Settings applied successfully');
        }
      }
    },
    { passive: false }
  );

  console.log('[Gemini Shortcut Extension] All features initialized successfully');
}

// Run initialization
initializeExtension();
