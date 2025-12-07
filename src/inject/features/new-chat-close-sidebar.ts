/**
 * Close sidebar after new chat (Shift+mod+O)
 */

import { getModLabel, isMacPlatform, isModKey } from '@/shared/keyboard';

import { isFeatureEnabled } from '../state/toggles';

const isOpen = (): boolean =>
  !!document.querySelector('.conversation-items-container.side-nav-opened');

const closeSideNavIfOpen = (): void => {
  const btn = document.querySelector(
    'button[data-test-id="side-nav-menu-button"]'
  ) as HTMLElement | null;
  if (btn && isOpen()) btn.click();
};

const onKeyDown = (e: KeyboardEvent): void => {
  if (!isFeatureEnabled('otherShortcuts')) return;
  const t = e.target as HTMLElement | null;
  const tag = t?.tagName || '';
  if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
  if (t?.closest?.('[contenteditable="true"]')) return;
  if (e.isComposing) return;
  const key = e.key?.toLowerCase();
  if (isModKey(e) && e.shiftKey && key === 'o') {
    [120, 300, 800, 1600].forEach((ms) => setTimeout(closeSideNavIfOpen, ms));
  }
};

export function initializeNewChatCloseSidebar(): void {
  const isMac = isMacPlatform();
  const modLabel = getModLabel({ isMac, useSymbol: true });
  if (!window.__gxt_closeSidebarAfterNewChat) {
    window.addEventListener('keydown', onKeyDown, true);
    window.__gxt_closeSidebarAfterNewChat = true;
    console.log(`[Gemini Hotkeys] ⇧${modLabel}O new chat hook to close sidebar bound`);
  }
  window.gxtNewChatFix = { closeNow: closeSideNavIfOpen };
}
