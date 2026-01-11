/**
 * Delete chat functionality (Shift+mod+Backspace)
 */

import { getMessage } from '@/shared/i18n';
import { getModLabel, isMacPlatform, isModKey } from '@/shared/keyboard';

import { isFeatureEnabled } from '../state/toggles';

const KEYDOWN_CAPTURE_OPTIONS: AddEventListenerOptions = { capture: true, passive: false };
const NON_PASSIVE_CLICK_OPTIONS: AddEventListenerOptions = { passive: false };

/**
 * Get utils, throwing if not available
 */
function getUtils() {
  const utils = window.__gxt_utils;
  if (!utils) {
    throw new Error('[Gemini Delete] __gxt_utils not initialized');
  }
  return utils;
}

const T = {
  DEFAULT_WAIT_TIMEOUT_MS: 6000,
  WAIT_SIDENAV_OPEN_CONFIRM_MS: 1000,
  SLEEP_AFTER_SIDENAV_CLOSE_MS: 120,
  WAIT_REGION_CANDIDATE_MS: 1000,
  WAIT_REGION_FALLBACK_MS: 1200,
  WAIT_SELECTED_MS: 1200,
  WAIT_ACTIONS_BUTTON_MS: 800,
  SLEEP_RETRY_ACTIONS_MS: 120,
  WAIT_DELETE_BUTTON_MS: 1500,
  WAIT_DIALOG_MS: 2500,
  WAIT_DIALOG_REMOVAL_MS: 1500,
  SLEEP_NO_DIALOG_FALLBACK_MS: 200,
};

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
    await utils.sleep(T.SLEEP_AFTER_SIDENAV_CLOSE_MS);
  }
}

function getSelectedChatTitle(): string {
  const region =
    document.querySelector('#conversations-list-2') ||
    document.querySelector('[role="region"].conversations-container') ||
    document.querySelector('.conversations-container');
  const selected =
    region?.querySelector('[data-test-id="conversation"].selected') ||
    region?.querySelector('.conversation.selected');
  const titleEl = selected?.querySelector('.conversation-title');
  const bySidebar = titleEl?.textContent?.trim();
  if (bySidebar) return bySidebar.replace(/\s+/g, ' ').trim();
  const mainHeader =
    document.querySelector('[data-test-id="chat-header-title"]') ||
    document.querySelector('h1.chat-title') ||
    document.querySelector('[role="main"] h1');
  const byMain = mainHeader?.textContent?.trim();
  return byMain || 'the currently selected chat';
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
  await utils.sleep(T.SLEEP_RETRY_ACTIONS_MS);
  const nextRetry = selectedConversation.nextElementSibling;
  if (nextRetry?.classList?.contains('conversation-actions-container')) {
    const btn2 = nextRetry.querySelector('button[data-test-id="actions-menu-button"]');
    if (btn2) return btn2 as HTMLElement;
  }
  throw new Error('Actions menu button not found');
}

function createConfirmDialog({
  title = getMessage('chat_delete_dialog_title'),
  message = '',
}: { title?: string; message?: string } = {}): Promise<boolean> {
  const overlay = document.createElement('div');
  overlay.setAttribute('data-gemini-delete-overlay', 'true');
  overlay.tabIndex = -1;
  overlay.style.cssText = `position: fixed; inset: 0; z-index: 2147483647; background: rgba(0,0,0,.4); display: grid; place-items: center; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;`;
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.style.cssText = `background: #fff; color: #111; width: min(520px, 90vw); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.2); overflow: hidden;`;
  const header = document.createElement('header');
  header.style.cssText = `padding: 16px 20px; border-bottom: 1px solid #eee;`;
  const h2 = document.createElement('h2');
  h2.style.margin = '0';
  h2.style.fontSize = '20px';
  h2.style.fontWeight = '700';
  h2.textContent = title;
  header.appendChild(h2);
  const body = document.createElement('div');
  body.style.cssText = `padding: 16px 20px; line-height: 1.6;`;
  const p = document.createElement('p');
  p.style.margin = '0';
  p.textContent = message || getMessage('chat_delete_dialog_body_generic');
  body.appendChild(p);
  const actions = document.createElement('div');
  actions.style.cssText = `padding: 12px 16px; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid #eee;`;
  const btnDelete = document.createElement('button');
  btnDelete.textContent = getMessage('chat_delete_dialog_confirm');
  btnDelete.style.cssText = `appearance: none; border: 0; padding: 10px 14px; border-radius: 8px; background: #d93025; color: #fff; font-weight: 600; cursor: pointer;`;
  const btnCancel = document.createElement('button');
  btnCancel.textContent = getMessage('chat_delete_dialog_cancel');
  btnCancel.style.cssText = `appearance: none; border: 1px solid #ddd; padding: 10px 14px; border-radius: 8px; background: #fff; color: #333; font-weight: 600; cursor: pointer;`;
  actions.append(btnDelete, btnCancel);
  dialog.append(header, body, actions);
  overlay.append(dialog);
  return new Promise((resolve) => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
        resolve(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        cleanup();
        resolve(true);
      }
    }
    function cleanup(): void {
      overlay.remove();
      window.removeEventListener('keydown', onKey, KEYDOWN_CAPTURE_OPTIONS);
    }
    btnCancel.addEventListener(
      'click',
      () => {
        cleanup();
        resolve(false);
      },
      NON_PASSIVE_CLICK_OPTIONS
    );
    btnDelete.addEventListener(
      'click',
      () => {
        cleanup();
        resolve(true);
      },
      NON_PASSIVE_CLICK_OPTIONS
    );
    overlay.addEventListener(
      'click',
      (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      },
      NON_PASSIVE_CLICK_OPTIONS
    );
    window.addEventListener('keydown', onKey, KEYDOWN_CAPTURE_OPTIONS);
    document.body.appendChild(overlay);
    btnDelete.focus();
  });
}

async function deleteCurrentChatSequence(): Promise<void> {
  const utils = getUtils();
  console.log('[Gemini Delete] Starting');
  await toggleSideNav({ open: true });
  const region = await waitForRegionFast();
  const selectedConversation = await waitForSelectedFast(region);
  if (!selectedConversation) return;
  const menuButton = await ensureMenuButtonForSelected(region, selectedConversation);
  utils.click(menuButton);
  const deleteBtn = await utils.waitForElement('button[data-test-id="delete-button"]', {
    timeout: T.WAIT_DELETE_BUTTON_MS,
  });
  utils.click(deleteBtn);
  const dialog = await utils
    .waitForElement('mat-dialog-container', { timeout: T.WAIT_DIALOG_MS })
    .catch(() => null);
  const confirmBtn = await utils.waitForElement(
    'mat-dialog-container [data-test-id="confirm-button"]',
    { timeout: T.WAIT_DIALOG_MS, mustBeVisible: false }
  );
  utils.click(confirmBtn);
  if (dialog) {
    await utils.waitForRemoval(dialog, { timeout: T.WAIT_DIALOG_REMOVAL_MS });
  } else {
    await utils.sleep(T.SLEEP_NO_DIALOG_FALLBACK_MS);
  }
  await toggleSideNav({ open: false });
  console.log('[Gemini Delete] Completed');
}

function keyHandler(e: KeyboardEvent): void {
  if (!isFeatureEnabled('otherShortcuts')) return;
  const isDeleteKey = e.key === 'Backspace' || e.key === 'Delete';
  if (isModKey(e) && e.shiftKey && isDeleteKey) {
    handleDeleteChatShortcut(e);
  }
}

async function showDialog(): Promise<void> {
  const chatTitle = getSelectedChatTitle();
  const ok = await createConfirmDialog({
    message: getMessage('chat_delete_dialog_body_named', [chatTitle]),
  });
  if (!ok) return;
  try {
    await deleteCurrentChatSequence();
  } catch (err) {
    console.error('[Gemini Delete] Failed:', err);
    window.__gxt_utils?.showToast?.(getMessage('toast_delete_failed'), 'error');
  }
}

export function initializeChatDelete(): void {
  const api = { showDialog, runOnce: deleteCurrentChatSequence };
  const isMac = isMacPlatform();
  const modLabel = getModLabel({ isMac, useSymbol: true });
  window.gxtDeleteChat = api;
  if (!window.__gxt_deleteHotkeyBound) {
    window.addEventListener('keydown', keyHandler, KEYDOWN_CAPTURE_OPTIONS);
    window.__gxt_deleteHotkeyBound = true;
    console.log(`[Gemini Delete] Hotkey (⇧${modLabel}⌫) registered.`, api);
  } else {
    console.log('[Gemini Delete] Hotkey already registered.', api);
  }
}

export function handleDeleteChatShortcut(e: KeyboardEvent): void {
  if (!isFeatureEnabled('otherShortcuts')) return;
  e.preventDefault();
  e.stopPropagation();
  showDialog().catch((err) => {
    console.error('[Gemini Delete] Error:', err);
    window.__gxt_utils?.showToast?.(getMessage('toast_delete_failed'), 'error');
  });
}
