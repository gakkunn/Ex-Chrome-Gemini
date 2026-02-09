/**
 * Preserve reading position by blocking Gemini's programmatic auto-scroll
 * when the user is not near the bottom of the conversation.
 */

import { isFeatureEnabled } from '../state/toggles';

const SMART_LOCK_THRESHOLD_PX = 120;
const REFRESH_DEBOUNCE_MS = 300;
const MIN_SCROLLABLE_DELTA_PX = 50;
const MIN_VISIBLE_RATIO = 0.35;

const SCROLL_CONTAINER_SELECTORS = [
  '.chat-history[data-test-id="chat-history-container"]',
  'div[data-test-id="chat-history-container"]',
  'div.chat-history',
] as const;

type PatchedMethod = (...args: unknown[]) => void;

interface ScrollLockState {
  container: HTMLElement | null;
  locked: boolean;
  observer: MutationObserver | null;
  refreshTimer: ReturnType<typeof setTimeout> | null;
  containerScrollHandler: (() => void) | null;
}

const originalMethods = {
  windowScrollTo: window.scrollTo as PatchedMethod,
  windowScrollBy: window.scrollBy as PatchedMethod,
  elementScrollIntoView: Element.prototype.scrollIntoView as PatchedMethod,
  elementScrollTo: Element.prototype.scrollTo as PatchedMethod,
  elementScrollBy: Element.prototype.scrollBy as PatchedMethod,
  focus: HTMLElement.prototype.focus as PatchedMethod,
};

const state: ScrollLockState = {
  container: null,
  locked: false,
  observer: null,
  refreshTimer: null,
  containerScrollHandler: null,
};

let initialized = false;

function isPreserveScrollEnabled(): boolean {
  return isFeatureEnabled('preserveScrollOnSend');
}

function getDocumentScroller(): HTMLElement {
  return (document.scrollingElement as HTMLElement) || document.documentElement || document.body;
}

function isScrollableElement(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element === document.documentElement || element === document.body) return false;
  const style = getComputedStyle(element);
  if (!['auto', 'scroll'].includes(style.overflowY)) return false;
  return element.scrollHeight > element.clientHeight + MIN_SCROLLABLE_DELTA_PX;
}

function findScrollableAncestor(start: Element | null): HTMLElement | null {
  let current: Element | null = start;
  while (current && current !== document.body) {
    if (isScrollableElement(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getVisibleHeight(rect: DOMRect): number {
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  return Math.max(0, bottom - top);
}

function findMainScrollContainer(): HTMLElement {
  for (const selector of SCROLL_CONTAINER_SELECTORS) {
    const element = document.querySelector(selector);
    const candidate = findScrollableAncestor(element);
    if (candidate) return candidate;
  }

  const all = document.querySelectorAll<HTMLElement>('body *');
  let best: HTMLElement | null = null;
  let bestScore = 0;

  all.forEach((element) => {
    if (!isScrollableElement(element)) return;

    const rect = element.getBoundingClientRect();
    const visibleHeight = getVisibleHeight(rect);
    if (visibleHeight < window.innerHeight * MIN_VISIBLE_RATIO) return;

    const scrollableRange = element.scrollHeight - element.clientHeight;
    const score = scrollableRange * visibleHeight;
    if (score > bestScore) {
      bestScore = score;
      best = element;
    }
  });

  return best || getDocumentScroller();
}

function getDistanceToBottom(element: HTMLElement): number {
  return element.scrollHeight - (element.scrollTop + element.clientHeight);
}

function updateLockedState(): void {
  if (!state.container || !isPreserveScrollEnabled()) {
    state.locked = false;
    return;
  }

  state.locked = getDistanceToBottom(state.container) > SMART_LOCK_THRESHOLD_PX;
}

function detachContainerListener(): void {
  if (!state.container || !state.containerScrollHandler) return;
  state.container.removeEventListener('scroll', state.containerScrollHandler);
  state.containerScrollHandler = null;
}

function refreshContainer(): void {
  const nextContainer = findMainScrollContainer();
  if (nextContainer === state.container) {
    updateLockedState();
    return;
  }

  detachContainerListener();
  state.container = nextContainer;
  state.containerScrollHandler = () => updateLockedState();
  state.container.addEventListener('scroll', state.containerScrollHandler, { passive: true });
  updateLockedState();
}

function scheduleRefresh(): void {
  if (state.refreshTimer) {
    clearTimeout(state.refreshTimer);
  }
  state.refreshTimer = setTimeout(() => {
    state.refreshTimer = null;
    refreshContainer();
  }, REFRESH_DEBOUNCE_MS);
}

function isWithinContainer(target: Element | null): boolean {
  if (!state.container || !target) return false;
  return target === state.container || state.container.contains(target);
}

function shouldBlock(target: Window | Element | null): boolean {
  if (!isPreserveScrollEnabled()) return false;
  if (!state.container || !state.container.isConnected) {
    refreshContainer();
  }
  updateLockedState();
  if (!state.locked) return false;

  const docScroller = getDocumentScroller();
  if (target === window) {
    return (
      state.container === docScroller ||
      state.container === document.documentElement ||
      state.container === document.body
    );
  }

  if (!(target instanceof Element)) return false;
  return isWithinContainer(target);
}

function getFocusOptions(value: unknown): FocusOptions | null {
  if (!value || typeof value !== 'object') return null;
  return value as FocusOptions;
}

function patchScrollMethods(): void {
  window.scrollTo = (function patchedWindowScrollTo(...args: unknown[]): void {
    if (shouldBlock(window)) return;
    originalMethods.windowScrollTo.apply(window, args);
  }) as typeof window.scrollTo;

  window.scrollBy = (function patchedWindowScrollBy(...args: unknown[]): void {
    if (shouldBlock(window)) return;
    originalMethods.windowScrollBy.apply(window, args);
  }) as typeof window.scrollBy;

  Element.prototype.scrollIntoView = (function patchedScrollIntoView(
    this: Element,
    ...args: unknown[]
  ): void {
    if (shouldBlock(this)) return;
    originalMethods.elementScrollIntoView.apply(this, args);
  }) as typeof Element.prototype.scrollIntoView;

  Element.prototype.scrollTo = (function patchedElementScrollTo(
    this: Element,
    ...args: unknown[]
  ): void {
    if (shouldBlock(this)) return;
    originalMethods.elementScrollTo.apply(this, args);
  }) as typeof Element.prototype.scrollTo;

  Element.prototype.scrollBy = (function patchedElementScrollBy(
    this: Element,
    ...args: unknown[]
  ): void {
    if (shouldBlock(this)) return;
    originalMethods.elementScrollBy.apply(this, args);
  }) as typeof Element.prototype.scrollBy;

  HTMLElement.prototype.focus = (function patchedFocus(
    this: HTMLElement,
    ...args: unknown[]
  ): void {
    if (!shouldBlock(this)) {
      originalMethods.focus.apply(this, args);
      return;
    }

    const options = getFocusOptions(args[0]);
    try {
      originalMethods.focus.call(this, { ...(options || {}), preventScroll: true });
    } catch {
      originalMethods.focus.call(this);
    }
  }) as typeof HTMLElement.prototype.focus;
}

function installObserver(): void {
  state.observer = new MutationObserver(() => {
    scheduleRefresh();
  });

  if (document.documentElement) {
    state.observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.addEventListener('resize', scheduleRefresh, { passive: true });
  window.addEventListener('orientationchange', scheduleRefresh, { passive: true });
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh();
      }
    },
    { passive: true }
  );
}

export function initializePreserveScrollOnSend(): void {
  if (initialized) return;
  initialized = true;

  patchScrollMethods();
  installObserver();
  refreshContainer();
}
