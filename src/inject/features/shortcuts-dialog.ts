/**
 * Shortcuts dialog (Cmd/Ctrl + /)
 */

import { getMessage } from '@/shared/i18n';

const POPOVER_ID = 'gxt-shortcuts-popover';
const STYLE_ID = 'gxt-shortcuts-style';
const BACKDROP_ID = 'gxt-shortcuts-backdrop';
const KEYDOWN_CAPTURE_OPTIONS: AddEventListenerOptions = { capture: true, passive: false };
const NON_PASSIVE_CLICK_OPTIONS: AddEventListenerOptions = { passive: false };

export interface ShortcutItem {
  label: string;
  keys?: string[];
  combos?: string[][];
  action?: () => void;
  actionLabel?: string;
}

export interface ShortcutSection {
  section: string;
  items: ShortcutItem[];
}

const el = (
  tag: string,
  attrs: Record<string, string> = {},
  children: (Node | string)[] | Node | string = []
): HTMLElement => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  });
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
};

const k = (text: string): HTMLElement => el('kbd', {}, text);

const keysToDd = (keys: string[]): HTMLElement => {
  const dd = el('dd', { class: 'shortcut' });
  keys.forEach((kk, i) => {
    dd.appendChild(k(kk));
    if (i < keys.length - 1) dd.appendChild(el('span', { class: 'plus' }, ' + '));
  });
  return dd;
};

const combosToDd = (combos: string[][]): HTMLElement => {
  const dd = el('dd', { class: 'shortcut' });
  combos.forEach((combo, idx) => {
    combo.forEach((kk, i) => {
      dd.appendChild(k(kk));
      if (i < combo.length - 1) dd.appendChild(el('span', { class: 'plus' }, ' + '));
    });
    if (idx < combos.length - 1) dd.appendChild(el('span', { class: 'altsep' }, ' / '));
  });
  return dd;
};

const actionToDd = (label: string, action: () => void): HTMLElement => {
  const dd = el('dd', { class: 'shortcut' });
  const a = el('a', { href: '#', style: 'color: inherit; text-decoration: underline;' }, label);
  a.addEventListener(
    'click',
    (e) => {
      e.preventDefault();
      action();
    },
    NON_PASSIVE_CLICK_OPTIONS
  );
  dd.appendChild(a);
  return dd;
};

let lastFocused: Element | null = null;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const css = `
    .popover__backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.35);
      z-index: 2147483646;
    }
    aside.popover {
      position: fixed; inset: 50% auto auto 50%;
      transform: translate(-50%,-50%);
      z-index: 2147483647;
      width: min(90vw, 640px);
      background: #fff; color: #111;
      border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,.25);
      overflow: hidden;
    }
    .popover[hidden], .popover__backdrop[hidden] { display: none !important; }
    .popover__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid #eee;
    }
    .popover__header h2 { margin: 0; font-size: 16px; font-weight: 700; }
    .popover__close {
      appearance: none; background: #f6f6f6; border: 1px solid #e5e5e5;
      border-radius: 8px; padding: 6px; cursor: pointer; line-height: 0;
    }
    .popover__close:hover { background: #efefef; }
    .shortcuts {
      display: grid; grid-template-columns: 1fr auto; gap: 8px 16px;
      padding: 16px;
      max-height: 70vh;
      overflow-y: auto;
    }
    .shortcuts dt { margin: 0; align-self: center; }
    .shortcuts dd { margin: 0; }
    .shortcuts__section {
      grid-column: 1 / -1; margin-top: 8px; padding-top: 12px;
      font-weight: 700; color: #444; border-top: 1px solid #eee;
    }
    .shortcut { justify-self: end; white-space: nowrap; }
    .shortcut kbd {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px; padding: 2px 6px; border-radius: 6px; border: 1px solid #e5e5e5;
      background: #f7f7f7; box-shadow: inset 0 -1px 0 #e0e0e0; display: inline-block;
    }
    .shortcut .plus, .shortcut .sep { opacity: .6; margin: 0 4px; }
    .shortcut kbd + .altsep { margin: 0 6px; opacity: .6; }
    @media (prefers-color-scheme: dark) {
      aside.popover { background: #111; color: #f5f5f5; }
      .popover__header { border-bottom-color: #2a2a2a; }
      .popover__close { background: #1b1b1b; border-color: #2a2a2a; }
      .popover__close:hover { background: #232323; }
      .shortcuts__section { border-top-color: #2a2a2a; color: #cfcfcf; }
      .shortcut kbd { background: #1b1b1b; border-color: #2a2a2a; box-shadow: inset 0 -1px 0 #1a1a1a; }
    }
  `;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

function createPopover(data: ShortcutSection[]): { popover: HTMLElement; backdrop: HTMLElement } {
  const backdrop = el('div', {
    id: BACKDROP_ID,
    class: 'popover__backdrop',
    role: 'presentation',
    hidden: '',
  });

  const popover = el(
    'aside',
    {
      id: POPOVER_ID,
      class: 'popover',
      role: 'dialog',
      'aria-labelledby': 'kb-shortcuts-title',
      hidden: '',
    },
    [
      el('header', { class: 'popover__header' }, [
        el('h2', { id: 'kb-shortcuts-title', text: getMessage('shortcuts_dialog_title') }),
        el(
          'button',
          {
            class: 'popover__close',
            type: 'button',
            'aria-label': getMessage('shortcuts_dialog_close'),
          },
          el('svg', { width: '20', height: '20', viewBox: '0 0 20 20', 'aria-hidden': 'true' }, [
            el('path', {
              d: 'M14.2548 4.75488C14.5282 4.48152 14.9717 4.48152 15.2451 4.75488C15.5184 5.02825 15.5184 5.47175 15.2451 5.74512L10.9902 10L15.2451 14.2549L15.3349 14.3652C15.514 14.6369 15.4841 15.006 15.2451 15.2451C15.006 15.4842 14.6368 15.5141 14.3652 15.335L14.2548 15.2451L9.99995 10.9902L5.74506 15.2451C5.4717 15.5185 5.0282 15.5185 4.75483 15.2451C4.48146 14.9718 4.48146 14.5282 4.75483 14.2549L9.00971 10L4.75483 5.74512L4.66499 5.63477C4.48589 5.3631 4.51575 4.99396 4.75483 4.75488C4.99391 4.51581 5.36305 4.48594 5.63471 4.66504L5.74506 4.75488L9.99995 9.00977L14.2548 4.75488Z',
            }),
          ])
        ),
      ]),
      el('dl', { class: 'shortcuts' }),
    ]
  );

  const dl = popover.querySelector('dl.shortcuts') as HTMLElement;
  data.forEach(({ section, items }) => {
    dl.appendChild(el('dt', { class: 'shortcuts__section', text: section }));
    items.forEach((it) => {
      dl.appendChild(el('dt', { text: it.label }));
      if (it.action && it.actionLabel) {
        dl.appendChild(actionToDd(it.actionLabel, it.action));
      } else if (it.combos) {
        dl.appendChild(combosToDd(it.combos));
      } else if (it.keys) {
        dl.appendChild(keysToDd(it.keys));
      }
    });
  });

  return { popover, backdrop };
}

function open(popover: HTMLElement, backdrop: HTMLElement, closeBtn: HTMLElement | null): void {
  if (!popover.hasAttribute('hidden')) return;
  lastFocused = document.activeElement;
  backdrop.removeAttribute('hidden');
  popover.removeAttribute('hidden');
  popover.setAttribute('aria-hidden', 'false');
  if (closeBtn) {
    closeBtn.focus({ preventScroll: true });
  }
}

function close(popover: HTMLElement, backdrop: HTMLElement): void {
  if (popover.hasAttribute('hidden')) return;
  backdrop.setAttribute('hidden', '');
  popover.setAttribute('hidden', '');
  popover.setAttribute('aria-hidden', 'true');
  if (lastFocused && typeof (lastFocused as HTMLElement).focus === 'function') {
    try {
      (lastFocused as HTMLElement).focus({ preventScroll: true });
    } catch {}
  }
}

export function isShortcutsDialogVisible(): boolean {
  const popover = document.getElementById(POPOVER_ID);
  return !!popover && !popover.hasAttribute('hidden');
}

export function closeShortcutsDialog(): void {
  const popover = document.getElementById(POPOVER_ID);
  const backdrop = document.getElementById(BACKDROP_ID);
  if (popover && backdrop) {
    close(popover, backdrop);
  }
}

/**
 * Initialize shortcuts dialog (no-op, setup happens on demand)
 */
export function initializeShortcutsDialog(): void {
  // Shortcuts dialog is shown on-demand via showShortcutsDialog
  // No initialization required
}

export function showShortcutsDialog(data: ShortcutSection[]): void {
  injectStyles();

  // Remove existing if any (to refresh data)
  const existingPopover = document.getElementById(POPOVER_ID);
  const existingBackdrop = document.getElementById(BACKDROP_ID);
  if (existingPopover) existingPopover.remove();
  if (existingBackdrop) existingBackdrop.remove();

  const { popover, backdrop } = createPopover(data);

  const appendToBody = (): boolean => {
    const { body } = document;
    if (!body) return false;
    if (!body.contains(backdrop)) body.append(backdrop);
    if (!body.contains(popover)) body.append(popover);
    return true;
  };

  if (!appendToBody()) {
    const onDomContentLoaded = (): void => {
      if (appendToBody()) document.removeEventListener('DOMContentLoaded', onDomContentLoaded);
    };
    document.addEventListener('DOMContentLoaded', onDomContentLoaded);
  }

  const closeBtn = popover.querySelector('.popover__close') as HTMLElement | null;

  const onKeyDown = (e: KeyboardEvent): void => {
    if (!popover.hasAttribute('hidden') && e.key === 'Escape') {
      e.preventDefault();
      close(popover, backdrop);
    }
  };

  const onBackdropClick = (e: MouseEvent): void => {
    if (e.target === e.currentTarget) close(popover, backdrop);
  };

  if (!window.__gxt_shortcutsKeybound) {
    window.__gxt_shortcutsKeybound = true;
    window.addEventListener('keydown', onKeyDown, KEYDOWN_CAPTURE_OPTIONS);
  }

  // Re-bind click listeners since we recreated elements
  backdrop.addEventListener('click', onBackdropClick, NON_PASSIVE_CLICK_OPTIONS);
  closeBtn?.addEventListener('click', () => close(popover, backdrop), NON_PASSIVE_CLICK_OPTIONS);

  open(popover, backdrop, closeBtn);
}
