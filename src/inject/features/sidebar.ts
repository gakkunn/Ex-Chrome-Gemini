/**
 * Sidebar toggle (Shift+mod+S)
 */

import { getModLabel, isMacPlatform, isModKey } from '@/shared/keyboard';

import { isFeatureEnabled } from '../state/toggles';

const KEYDOWN_CAPTURE_OPTIONS: AddEventListenerOptions = { capture: true, passive: false };

export function initializeSidebar(): void {
  const isMac = isMacPlatform();
  const modLabel = getModLabel({ isMac, useSymbol: true });
  const handler = (e: KeyboardEvent): void => {
    // Allow firing even when focus is in inputs/contenteditable; only skip during IME composition
    if (e.isComposing) return;
    if (!isFeatureEnabled('otherShortcuts')) return;
    const key = e.key?.toLowerCase?.();
    if (isModKey(e) && e.shiftKey && key === 's') {
      e.preventDefault();
      e.stopPropagation();
      const button = document.querySelector(
        'button[data-test-id="side-nav-menu-button"]'
      ) as HTMLElement | null;
      button?.click();
    }
  };

  if (!window.__gxt_bindShiftCmdS) {
    window.addEventListener('keydown', handler, KEYDOWN_CAPTURE_OPTIONS);
    window.__gxt_bindShiftCmdS = true;
    console.log(`[Gemini Hotkeys] ⇧${modLabel}S Toggle sidebar bound`);
  }
}
