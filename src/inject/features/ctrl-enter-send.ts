/**
 * Require Ctrl+Enter (Win/Linux) or Cmd/Ctrl+Enter (macOS) to send
 * Plain Enter inserts newline and never sends
 */

import { getMessage } from '@/shared/i18n';
import { isMacPlatform } from '@/shared/keyboard';
interface IMEState {
  active: boolean;
}

function isVisible(el: HTMLElement | null): boolean {
  if (window.__gxt_utils?.isVisible) {
    return window.__gxt_utils.isVisible(el);
  }
  return !!el && el.offsetParent !== null;
}

// Track IME composition state more reliably than e.isComposing alone
const IME: IMEState = { active: false };
let missingSendLogged = false;

const COMPOSITION_CAPTURE_OPTIONS: AddEventListenerOptions = { capture: true, passive: false };

function isEditableTarget(t: EventTarget | null): boolean {
  if (!t || !(t instanceof Element)) return false;
  const tag = t.tagName;
  if (tag === 'TEXTAREA' || tag === 'INPUT') return true;
  if (t.closest?.('[contenteditable="true"]')) return true;
  return false;
}

function getSendButton(): { button: HTMLElement | null; disabled: boolean } {
  // Try common selectors first, then fall back to heuristics
  // Note: selector also covers the Japanese "Send" label for locale support
  const candidates = [
    'button[data-test-id="send-button"]',
    'button[aria-label="Send"]',
    'button[aria-label="Send message"]',
    'button[aria-label*="Send" i]',
    'button[aria-label*="送信"]', // Japanese "Send" label (required for locale matching)
  ];
  let disabledMatch: HTMLElement | null = null;
  for (const sel of candidates) {
    const btn = document.querySelector(sel) as HTMLElement | null;
    if (btn && isVisible(btn)) {
      const isDisabled =
        (btn as HTMLButtonElement).disabled || btn.getAttribute('aria-disabled') === 'true';
      if (!isDisabled) return { button: btn, disabled: false };
      disabledMatch = disabledMatch ?? btn;
    }
  }
  // Heuristic: any visible button whose aria-label includes "send"
  const all = document.querySelectorAll('button[aria-label]');
  for (const b of all) {
    const label = (b.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('send') && isVisible(b as HTMLElement)) {
      const isDisabled =
        (b as HTMLButtonElement).disabled || b.getAttribute('aria-disabled') === 'true';
      if (!isDisabled) return { button: b as HTMLElement, disabled: false };
      disabledMatch = disabledMatch ?? (b as HTMLElement);
    }
  }
  return { button: disabledMatch, disabled: !!disabledMatch };
}

export function handleEnterKey(e: KeyboardEvent): boolean {
  // Only affect typing in the prompt
  const t = e.target;
  if (!isEditableTarget(t)) return false;
  // Respect IME composition; keyCode 229 and key === 'Process' are IME-in-progress on some browsers
  if (IME.active || e.isComposing || e.keyCode === 229 || e.key === 'Process') return false;
  if (e.key !== 'Enter') return false;

  const isMac = isMacPlatform();
  const shouldSend = isMac ? e.metaKey || e.ctrlKey : e.ctrlKey && !e.metaKey;

  if (shouldSend) {
    // Platform-appropriate send combo
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    const { button: btn, disabled } = getSendButton();
    if (btn && !disabled) {
      btn.click();
    } else if (disabled) {
      window.__gxt_utils?.showToast?.(getMessage('toast_send_button_disabled'), 'warning');
    } else if (!missingSendLogged) {
      // Only log once per page load to avoid noisy warnings when Gemini hides the button
      console.debug('[Gemini Hotkeys] Send button not found; skipping send');
      missingSendLogged = true;
    }
    return true;
  }

  // Allow Shift+Enter to behave natively (insert newline) and
  // let the page receive the event to avoid IME glitches where
  // the first character becomes ASCII after Shift+Enter.
  if (e.shiftKey && !e.ctrlKey && !e.metaKey) return false;

  // Plain Enter => insert newline only, do NOT send
  // We block page handlers but allow browser default to run.
  e.stopPropagation();
  e.stopImmediatePropagation?.();
  // Intentionally do not call preventDefault so the newline is inserted.
  return true;
}

const onCompStart = (): void => {
  IME.active = true;
};
const onCompEnd = (): void => {
  IME.active = false;
};

/**
 * Initialize Ctrl+Enter send feature
 */
export function initializeCtrlEnterSend(): void {
  // IME listeners are always needed for composition tracking
  document.addEventListener('compositionstart', onCompStart, COMPOSITION_CAPTURE_OPTIONS);
  document.addEventListener('compositionend', onCompEnd, COMPOSITION_CAPTURE_OPTIONS);
}
