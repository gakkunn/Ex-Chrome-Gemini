/**
 * Shared lightweight utilities (non-invasive, reused by features)
 */

export function initializeUtils(): void {
  if (window.__gxt_utils) return;

  const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

  const isVisible = (el: HTMLElement | null | undefined): boolean =>
    !!el &&
    el.ownerDocument.contains(el) &&
    (el.offsetParent !== null || el.getClientRects().length > 0);

  const click = (el: HTMLElement | null): void => {
    if (!el) throw new Error('Click target not found');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  };

  const waitForElement = (
    selector: string,
    {
      root = document,
      timeout = 6000,
      mustBeVisible = false,
    }: {
      root?: Document | HTMLElement;
      timeout?: number;
      mustBeVisible?: boolean;
    } = {}
  ): Promise<HTMLElement> =>
    new Promise((resolve, reject) => {
      const found = root.querySelector(selector) as HTMLElement | null;
      if (found && (!mustBeVisible || isVisible(found))) return resolve(found);
      let timerId: ReturnType<typeof setTimeout> | null = null;
      const obs = new MutationObserver(() => {
        const el = root.querySelector(selector) as HTMLElement | null;
        if (el && (!mustBeVisible || isVisible(el))) {
          if (timerId) clearTimeout(timerId);
          obs.disconnect();
          resolve(el);
        }
      });
      obs.observe(root as Node, { childList: true, subtree: true });
      timerId = setTimeout(() => {
        obs.disconnect();
        reject(new Error(`Timeout: ${selector} not found`));
      }, timeout);
      Promise.resolve().then(() => {
        const el = root.querySelector(selector) as HTMLElement | null;
        if (el && (!mustBeVisible || isVisible(el))) {
          if (timerId) clearTimeout(timerId);
          obs.disconnect();
          resolve(el);
        }
      });
    });

  const waitForRemoval = (
    el: HTMLElement | null,
    { timeout = 1500 }: { timeout?: number } = {}
  ): Promise<void> =>
    new Promise((resolve) => {
      if (!el || !document.contains(el)) return resolve();
      let timerId: ReturnType<typeof setTimeout> | null = null;
      const done = (): void => {
        if (timerId) clearTimeout(timerId);
        resolve();
      };
      const obs = new MutationObserver(() => {
        if (!document.contains(el)) {
          obs.disconnect();
          done();
        }
      });
      obs.observe(document, { childList: true, subtree: true });
      timerId = setTimeout(() => {
        obs.disconnect();
        done();
      }, timeout);
    });

  const showToast = (
    message: string,
    type: 'error' | 'warning' | 'success' = 'error',
    duration = 5000
  ): void => {
    const toast = document.createElement('div');
    toast.className = `gxt-toast gxt-toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add('gxt-toast-show');
    });
    setTimeout(() => {
      toast.classList.remove('gxt-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  window.__gxt_utils = { sleep, isVisible, click, waitForElement, waitForRemoval, showToast };
}
