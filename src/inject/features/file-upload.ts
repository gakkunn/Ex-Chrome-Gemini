/**
 * File upload hotkey (mod+U)
 */

import { getMessage } from '@/shared/i18n';
import { getModLabel, isMacPlatform, isModKey } from '@/shared/keyboard';

import { isFeatureEnabled } from '../state/toggles';

const KEYDOWN_CAPTURE_OPTIONS: AddEventListenerOptions = { capture: true, passive: false };

const log = (...a: unknown[]): void => console.log('[GeminiUploadHotkey]', ...a);
const USE_HIDDEN_FALLBACK = false;
const COOLDOWN_MS = 1200;
const BUSY_TIMEOUT_MS = 2000;

interface UploadState {
  busy: boolean;
  cooldownUntil: number;
  busyTimer: ReturnType<typeof setTimeout> | null;
}

const state: UploadState = { busy: false, cooldownUntil: 0, busyTimer: null };

function firePointerClick(el: HTMLElement | null): void {
  if (!el) return;
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

function waitFor(
  testFn: string | (() => HTMLElement | null),
  { timeout = 2500, poll = 50 }: { timeout?: number; poll?: number } = {}
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    let timerId: ReturnType<typeof setTimeout> | null = null;
    (function tick(): void {
      try {
        const el =
          typeof testFn === 'function'
            ? testFn()
            : (document.querySelector(testFn) as HTMLElement | null);
        if (el) {
          if (timerId) clearTimeout(timerId);
          return resolve(el);
        }
      } catch {}
      const elapsed = performance.now() - t0;
      if (elapsed > timeout) return reject(new Error('Timeout'));
      timerId = setTimeout(tick, poll);
    })();
  });
}

function getMenuButton(): HTMLElement | null {
  return (
    (document.querySelector('button[aria-label="Open upload file menu"]') as HTMLElement | null) ||
    (document.querySelector('button.upload-card-button.open') as HTMLElement | null)
  );
}

function getUploadMenuRoot(): HTMLElement | null {
  const list = document.querySelector('mat-action-list[aria-label="Upload file options"]');
  return (
    (list && (list.closest('.cdk-overlay-pane') as HTMLElement | null)) ||
    (document.querySelector('.cdk-overlay-pane') as HTMLElement | null)
  );
}

function getVisibleUploadBtn(root: HTMLElement): HTMLElement | null {
  return (
    (root.querySelector(
      'button[data-test-id="local-images-files-uploader-button"]'
    ) as HTMLElement | null) ||
    (Array.from(root.querySelectorAll('button,[role=button]')).find(
      (el) =>
        /upload files/i.test((el as HTMLElement).textContent || '') ||
        /upload files/i.test((el as HTMLElement).getAttribute?.('aria-label') || '')
    ) as HTMLElement | undefined) ||
    null
  );
}

function getHiddenTrigger(root: HTMLElement): HTMLElement | null {
  return (
    (root.querySelector(
      'images-files-uploader button.hidden-local-file-image-selector-button'
    ) as HTMLElement | null) ||
    (root.querySelector('images-files-uploader [xapfileselectortrigger]') as HTMLElement | null) ||
    (root.querySelector(
      'button.hidden-local-file-image-selector-button,[xapfileselectortrigger]'
    ) as HTMLElement | null)
  );
}

async function openUploadMenu(): Promise<HTMLElement | null> {
  const btn = getMenuButton();
  if (!btn) throw new Error('Upload menu button not found.');
  firePointerClick(btn);
  await waitFor(
    () =>
      document.querySelector(
        'mat-action-list[aria-label="Upload file options"]'
      ) as HTMLElement | null
  ).catch(() => {});
  return getUploadMenuRoot();
}

async function doUpload(): Promise<void> {
  state.busy = true;
  if (state.busyTimer) clearTimeout(state.busyTimer);
  state.busyTimer = setTimeout(() => {
    state.busy = false;
  }, BUSY_TIMEOUT_MS);
  const root = await openUploadMenu();
  if (!root) throw new Error('Upload menu did not render.');
  const visibleBtn = getVisibleUploadBtn(root);
  const hiddenBtn = getHiddenTrigger(root);
  if (visibleBtn) {
    firePointerClick(visibleBtn);
    if (USE_HIDDEN_FALLBACK && hiddenBtn) {
      // setTimeout(() => firePointerClick(hiddenBtn), 150);
    }
    return;
  }
  if (hiddenBtn) {
    firePointerClick(hiddenBtn);
    return;
  }
  throw new Error('Upload files button (visible/hidden) not found.');
}

function onFileChange(e: Event): void {
  const t = e.target as HTMLInputElement | null;
  if (t && t.tagName === 'INPUT' && t.type === 'file') {
    if (state.busyTimer) clearTimeout(state.busyTimer);
    state.busy = false;
    state.cooldownUntil = Date.now() + COOLDOWN_MS;
    log('file change:', (t.files && t.files.length) || 0, 'file(s)');
  }
}

async function hotkeyHandler(e: KeyboardEvent): Promise<void> {
  if (!isFeatureEnabled('otherShortcuts')) return;
  const k = e.key?.toLowerCase?.();
  const isPrimary = isModKey(e) && !e.altKey && !e.shiftKey && k === 'u';
  if (!isPrimary) return;
  if (e.repeat) return;
  const tag = (e.target as HTMLElement | null)?.tagName || '';
  if (/^(INPUT|TEXTAREA)$/.test(tag)) return;
  if (state.busy || Date.now() < state.cooldownUntil) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  try {
    await doUpload();
    log('Upload triggered');
  } catch (err) {
    console.error('[GeminiUploadHotkey] Failed:', err);
    window.__gxt_utils?.showToast?.(getMessage('toast_upload_failed'), 'error');
    if (state.busyTimer) clearTimeout(state.busyTimer);
    state.busy = false;
  }
}

export async function handleUploadShortcut(e: KeyboardEvent): Promise<void> {
  if (!isFeatureEnabled('otherShortcuts')) return;
  if (e.isComposing) return;
  if (e.repeat) return;
  const tag = (e.target as HTMLElement | null)?.tagName || '';
  if (/^(INPUT|TEXTAREA)$/.test(tag)) return;
  if (state.busy || Date.now() < state.cooldownUntil) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  try {
    await doUpload();
    log('Upload triggered (custom shortcut)');
  } catch (err) {
    console.error('[GeminiUploadHotkey] Failed (custom shortcut):', err);
    window.__gxt_utils?.showToast?.(getMessage('toast_upload_failed'), 'error');
    if (state.busyTimer) clearTimeout(state.busyTimer);
    state.busy = false;
  }
}
export function initializeFileUpload(): void {
  window.__gxtUploadHotkeyOff?.();
  document.addEventListener('keydown', hotkeyHandler, KEYDOWN_CAPTURE_OPTIONS);
  document.addEventListener('change', onFileChange, true);
  const isMac = isMacPlatform();
  const modLabel = getModLabel({ isMac, useSymbol: true });
  window.__gxtUploadHotkeyOff = (): void => {
    document.removeEventListener('keydown', hotkeyHandler, KEYDOWN_CAPTURE_OPTIONS);
    document.removeEventListener('change', onFileChange, true);
    if (state.busyTimer) clearTimeout(state.busyTimer);
    log('Hotkey unregistered');
  };
  window.__gxtDoUpload = (): Promise<void> => doUpload();
  log(`Hotkey enabled: ${modLabel}U. Debounce active. Disable: __gxtUploadHotkeyOff()`);
}
