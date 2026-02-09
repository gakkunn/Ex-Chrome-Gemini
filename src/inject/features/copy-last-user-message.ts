/**
 * Copy the last user message by triggering Gemini's built-in "Copy prompt" button.
 */

import { getMessage } from '@/shared/i18n';

import { isFeatureEnabled } from '../state/toggles';

const CHAT_HISTORY_SELECTOR = '.chat-history[data-test-id="chat-history-container"]';
const USER_QUERY_BUTTON_SELECTOR = 'user-query button';
const COPY_PROMPT_ICON_SELECTOR =
  'mat-icon[fonticon="content_copy"], mat-icon[data-mat-icon-name="content_copy"]';
const COPY_PROMPT_BUTTON_FALLBACK_SELECTOR = 'user-query button[aria-label="Copy prompt"]';

function showCopyErrorToast(): void {
  window.__gxt_utils?.showToast?.(getMessage('toast_copy_last_user_message_missing'), 'error');
}

function getLastCopyPromptButton(): HTMLElement | null {
  const chatHistory =
    (document.querySelector(CHAT_HISTORY_SELECTOR) as HTMLElement | null) || document.body;

  const iconMatchedButtons = Array.from(
    chatHistory.querySelectorAll<HTMLElement>(USER_QUERY_BUTTON_SELECTOR)
  ).filter((button) => !!button.querySelector(COPY_PROMPT_ICON_SELECTOR));
  if (iconMatchedButtons.length > 0) {
    return iconMatchedButtons[iconMatchedButtons.length - 1] || null;
  }

  const fallbackButtons = Array.from(
    chatHistory.querySelectorAll<HTMLElement>(COPY_PROMPT_BUTTON_FALLBACK_SELECTOR)
  );
  return fallbackButtons[fallbackButtons.length - 1] || null;
}

function firePointerClick(el: HTMLElement): void {
  const common = { bubbles: true, cancelable: true, composed: true };
  el.focus?.();
  el.dispatchEvent(
    new PointerEvent('pointerdown', {
      ...common,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 1,
    })
  );
  el.dispatchEvent(new MouseEvent('mousedown', common));
  el.dispatchEvent(
    new PointerEvent('pointerup', {
      ...common,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 0,
    })
  );
  el.dispatchEvent(new MouseEvent('mouseup', common));
  el.dispatchEvent(new MouseEvent('click', common));
}

export function handleCopyLastUserMessageShortcut(e: KeyboardEvent): void {
  if (!isFeatureEnabled('otherShortcuts')) return;
  if (e.isComposing || e.repeat) return;

  e.preventDefault();
  e.stopPropagation();

  try {
    const copyPromptButton = getLastCopyPromptButton();
    if (!copyPromptButton) {
      showCopyErrorToast();
      return;
    }

    firePointerClick(copyPromptButton);
  } catch (err) {
    console.error('[Gemini Hotkeys] Error (copy last user message):', err);
    showCopyErrorToast();
  }
}
