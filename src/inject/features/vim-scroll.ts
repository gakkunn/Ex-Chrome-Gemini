/**
 * Vim-style scrolling (j/k keys)
 */

// Constants
const INPUT_SELECTOR = '.input-gradient [contenteditable="true"][role="textbox"]';
const SCROLL_CONTAINER_SELECTOR = '.chat-history[data-test-id="chat-history-container"]';
const STEP = 60; // Normal scroll step (px)
const STEP_REPEAT = 15; // Step size when holding key (px)
const DURATION_FAST = 100; // Animation duration for j/k (ms)
const DURATION_SMOOTH = 200; // Animation duration for Cmd+j/k, Shift+j/k (ms)
const SCROLLING_SPEED = 20; // Continuous scroll speed (px per frame at 60fps)

// State for continuous scrolling
let scrollingDirection: 'up' | 'down' | null = null;
let scrollingAnimationId: number | null = null;
let scrollingContainer: HTMLElement | null = null;
let scrollingKey: string | null = null;

export type ScrollType = 'top' | 'bottom' | 'up' | 'down' | 'halfUp' | 'halfDown';

// Helper functions

function getScrollContainer(): HTMLElement {
  const container = document.querySelector(SCROLL_CONTAINER_SELECTOR) as HTMLElement | null;
  if (container) return container;

  // Fallback: find scrollable ancestor
  const huge =
    (document.querySelector('div[data-test-id="chat-history-container"]') as HTMLElement | null) ||
    (document.querySelector('div.chat-history') as HTMLElement | null);

  if (huge) {
    let cur: HTMLElement | null = huge;
    while (cur && cur !== document.body) {
      const style = getComputedStyle(cur);
      const overflowY = style.overflowY;
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        cur.scrollHeight > cur.clientHeight + 8
      ) {
        return cur;
      }
      cur = cur.parentElement;
    }
  }

  // Final fallback
  return (document.scrollingElement as HTMLElement) || document.documentElement || document.body;
}

function isInInputField(element: Element | null): boolean {
  if (!element) return false;

  // Check if it's a standard input element
  const tagName = element.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // Check if element is contenteditable or inside contenteditable
  if ((element as HTMLElement).isContentEditable) return true;
  if (element.closest && element.closest('[contenteditable="true"]')) return true;

  return false;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Scroll animation functions

function animateScroll(container: HTMLElement, targetTop: number, duration: number): void {
  const start = container.scrollTop;
  const change = targetTop - start;
  const startTime = performance.now();

  function animate(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeInOutQuad(progress);

    container.scrollTop = start + change * easeProgress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function startContinuousScroll(container: HTMLElement, direction: 'up' | 'down'): void {
  stopContinuousScroll();
  scrollingDirection = direction;
  scrollingContainer = container;

  function scroll(): void {
    if (scrollingDirection === direction && scrollingContainer) {
      const delta = direction === 'up' ? -SCROLLING_SPEED : SCROLLING_SPEED;
      scrollingContainer.scrollTop += delta;
      scrollingAnimationId = requestAnimationFrame(scroll);
    }
  }

  scrollingAnimationId = requestAnimationFrame(scroll);
}

export function stopContinuousScroll(): void {
  if (scrollingAnimationId !== null) {
    cancelAnimationFrame(scrollingAnimationId);
    scrollingAnimationId = null;
  }
  scrollingDirection = null;
  scrollingContainer = null;
}

export function getScrollingKey(): string | null {
  return scrollingKey;
}

export function setScrollingKey(key: string | null): void {
  scrollingKey = key;
}

// Main Vim scroll handler

/**
 * Initialize Vim scroll (no-op, functionality is called via handleVimScroll)
 */
export function initializeVimScroll(): void {
  // Vim scroll is triggered via handleVimScroll
  // No initialization required
}

export function handleVimScroll(e: KeyboardEvent, type: ScrollType): boolean {
  // Check if user is in an input field
  const activeElement = document.activeElement;
  if (isInInputField(activeElement)) {
    return false;
  }

  // Prevent default behavior
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();

  // Get scroll container
  const container = getScrollContainer();
  if (!container) {
    console.warn('[Vim Scroll] Scroll container not found');
    return false;
  }

  // Calculate target scroll position
  let targetTop = container.scrollTop;

  switch (type) {
    case 'top':
      targetTop = 0;
      break;
    case 'bottom':
      targetTop = container.scrollHeight - container.clientHeight;
      break;
    case 'up':
      targetTop = container.scrollTop - (e.repeat ? STEP_REPEAT : STEP);
      break;
    case 'down':
      targetTop = container.scrollTop + (e.repeat ? STEP_REPEAT : STEP);
      break;
    case 'halfUp':
      targetTop = container.scrollTop - window.innerHeight / 2;
      break;
    case 'halfDown':
      targetTop = container.scrollTop + window.innerHeight / 2;
      break;
  }

  // Clamp target to valid range
  targetTop = Math.max(0, Math.min(targetTop, container.scrollHeight - container.clientHeight));

  // Choose animation duration
  const duration = type === 'up' || type === 'down' ? DURATION_FAST : DURATION_SMOOTH;

  // Handle continuous scrolling for j/k on hold
  if (type === 'up' || type === 'down') {
    if (e.repeat) {
      // Key is being held - start continuous scroll if not already scrolling
      if (scrollingDirection !== (type === 'up' ? 'up' : 'down')) {
        startContinuousScroll(container, type === 'up' ? 'up' : 'down');
        scrollingKey = e.key;
      }
    } else {
      // First press - do smooth animation
      animateScroll(container, targetTop, duration);
      scrollingKey = e.key;

      // After animation, if key is still pressed, start continuous scroll
      setTimeout(() => {
        if (scrollingKey === e.key && scrollingDirection === null) {
          startContinuousScroll(container, type);
        }
      }, duration);
    }
  } else {
    // For Shift+j/k and Cmd+j/k, just do smooth animation
    if (e.repeat) {
      container.scrollTop = targetTop;
    } else {
      animateScroll(container, targetTop, duration);
    }
  }
  return true;
}
