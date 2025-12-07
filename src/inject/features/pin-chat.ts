/**
 * Pin current chat (mod+Shift+P) and Open Temporary Chat (mod+I)
 */

import { getMessage } from '@/shared/i18n';
import { getModLabel, isMacPlatform, isModKey } from '@/shared/keyboard';

import { isFeatureEnabled } from '../state/toggles';

const KEYDOWN_CAPTURE_OPTIONS: AddEventListenerOptions = { capture: true, passive: false };

const T = {
  DEFAULT_WAIT_TIMEOUT_MS: 6000,
  WAIT_SIDENAV_OPEN_CONFIRM_MS: 1000,
  WAIT_REGION_CANDIDATE_MS: 1000,
  WAIT_REGION_FALLBACK_MS: 1200,
  WAIT_SELECTED_MS: 1200,
  WAIT_ACTIONS_BUTTON_MS: 800,
  WAIT_TEMP_CHAT_BUTTON_MS: 1500,
};

/**
 * Get utils, throwing if not available
 */
function getUtils() {
  const utils = window.__gxt_utils;
  if (!utils) {
    throw new Error('[Gemini Hotkeys] __gxt_utils not initialized');
  }
  return utils;
}

async function toggleSideNav({ open = true }: { open?: boolean } = {}): Promise<void> {
  const utils = getUtils();
  const toggleBtn = document.querySelector(
    'button[data-test-id="side-nav-menu-button"]'
  ) as HTMLElement | null;
  if (!toggleBtn) return;
  const isOpen = !!document.querySelector('.conversation-items-container.side-nav-opened');
  if (open && !isOpen) {
    utils.click(toggleBtn);
    await utils
      .waitForElement('.conversation-items-container.side-nav-opened', {
        timeout: T.WAIT_SIDENAV_OPEN_CONFIRM_MS,
      })
      .catch(() => {});
  } else if (!open && isOpen) {
    utils.click(toggleBtn);
  }
}

async function waitForRegionFast(): Promise<HTMLElement> {
  const utils = getUtils();
  const now =
    document.querySelector('#conversations-list-2') ||
    document.querySelector('[role="region"].conversations-container') ||
    document.querySelector('.conversations-container');
  if (now) return now as HTMLElement;
  const candidates = [
    '#conversations-list-2',
    '[role="region"].conversations-container',
    '.conversations-container',
  ];
  for (const sel of candidates) {
    try {
      const el = await utils.waitForElement(sel, {
        timeout: T.WAIT_REGION_CANDIDATE_MS,
      });
      if (el) return el;
    } catch {}
  }
  return await utils.waitForElement('.conversations-container', {
    timeout: T.WAIT_REGION_FALLBACK_MS,
  });
}

async function waitForSelectedFast(region: HTMLElement): Promise<HTMLElement | null> {
  const utils = getUtils();
  const found =
    region.querySelector('[data-test-id="conversation"].selected') ||
    region.querySelector('.conversation.selected');
  if (found) return found as HTMLElement;
  try {
    return await utils.waitForElement(
      '[data-test-id="conversation"].selected, .conversation.selected',
      { root: region as HTMLElement, timeout: T.WAIT_SELECTED_MS }
    );
  } catch {
    return null;
  }
}

async function ensureMenuButtonForSelected(
  region: HTMLElement,
  selectedConversation: HTMLElement | null
): Promise<HTMLElement> {
  const utils = getUtils();
  if (!selectedConversation) throw new Error('No chat is currently selected');
  try {
    selectedConversation.scrollIntoView({ block: 'nearest' });
  } catch {}
  try {
    selectedConversation.focus({ preventScroll: true });
  } catch {}
  selectedConversation.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  const parent =
    selectedConversation.closest('.conversation-items-container') ||
    selectedConversation.parentElement;
  const next = selectedConversation.nextElementSibling;
  if (next?.classList?.contains('conversation-actions-container')) {
    const btn = next.querySelector('button[data-test-id="actions-menu-button"]');
    if (btn) return btn as HTMLElement;
  }
  const pre = parent?.querySelector(
    '.conversation-actions-container.selected button[data-test-id="actions-menu-button"]'
  );
  if (pre) return pre as HTMLElement;
  try {
    const waited = await utils.waitForElement(
      '.conversation-actions-container.selected button[data-test-id="actions-menu-button"], .conversation-actions-container button[data-test-id="actions-menu-button"]',
      { root: (parent as HTMLElement) || region, timeout: T.WAIT_ACTIONS_BUTTON_MS }
    );
    if (waited) return waited;
  } catch {}
  throw new Error('Actions menu button not found');
}

async function pinCurrentChatOnce(): Promise<void> {
  const utils = getUtils();
  console.log('[Gemini Hotkeys] Pin starting');
  await toggleSideNav({ open: true });
  const region = await waitForRegionFast();
  const selectedConversation = await waitForSelectedFast(region);
  if (!selectedConversation) return;
  const menuButton = await ensureMenuButtonForSelected(region, selectedConversation);
  utils.click(menuButton);
  const pinBtn = await utils.waitForElement('button[data-test-id="pin-button"]', {
    timeout: 1500,
  });
  utils.click(pinBtn);
  console.log('[Gemini Hotkeys] Completed (Pin clicked)');
}

async function openTemporaryChatOnce(): Promise<void> {
  const utils = getUtils();
  console.log('[Gemini Hotkeys] Temporary Chat starting');
  await toggleSideNav({ open: true });
  const tempBtn = await utils.waitForElement(
    'button[data-test-id="temp-chat-button"][aria-label="Temporary chat"]',
    { timeout: T.WAIT_TEMP_CHAT_BUTTON_MS }
  );
  utils.click(tempBtn);
  await toggleSideNav({ open: false });
  console.log('[Gemini Hotkeys] Completed (Temporary Chat opened and sidebar closed)');
}

function keyHandler(e: KeyboardEvent): void {
  if (!isFeatureEnabled('otherShortcuts')) return;
  // Allow in inputs/contenteditable; skip only during IME composition
  if (e.isComposing) return;
  const key = e.key?.toLowerCase();
  const isPinHotkey = isModKey(e) && e.shiftKey && !e.altKey && key === 'p';
  if (isPinHotkey) {
    handlePinChatShortcut(e);
    return;
  }
  if (isModKey(e) && !e.shiftKey && !e.altKey && key === 'i') {
    handleTemporaryChatShortcut(e);
    return;
  }
}

export function initializePinChat(): void {
  const isMac = isMacPlatform();
  const modLabel = getModLabel({ isMac, useSymbol: true });
  window.gxtHotkeys = { pinOnce: pinCurrentChatOnce, tempOnce: openTemporaryChatOnce };
  if (!window.__gxt_hotkeysBound) {
    window.addEventListener('keydown', keyHandler, KEYDOWN_CAPTURE_OPTIONS);
    window.__gxt_hotkeysBound = true;
    console.log(
      `[Gemini Hotkeys] Hotkeys (${modLabel}⇧P / ${modLabel}I) registered.`,
      window.gxtHotkeys
    );
  } else {
    console.log('[Gemini Hotkeys] Hotkeys already registered.', window.gxtHotkeys);
  }
}

export function handlePinChatShortcut(e: KeyboardEvent): void {
  if (!isFeatureEnabled('otherShortcuts')) return;
  if (e.isComposing) return;
  e.preventDefault();
  e.stopPropagation();
  pinCurrentChatOnce().catch((err) => {
    console.error('[Gemini Hotkeys] Error (pin):', err);
    window.__gxt_utils?.showToast?.(getMessage('toast_pin_failed'), 'error');
  });
}

export function handleTemporaryChatShortcut(e: KeyboardEvent): void {
  if (!isFeatureEnabled('otherShortcuts')) return;
  if (e.isComposing) return;
  e.preventDefault();
  e.stopPropagation();
  openTemporaryChatOnce().catch((err) => {
    console.error('[Gemini Hotkeys] Error (temp):', err);
    window.__gxt_utils?.showToast?.(getMessage('toast_temp_chat_failed'), 'error');
  });
}
