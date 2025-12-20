/**
 * Model switching: Fast/Thinking/Pro Mode and Toggle Model
 * (Cmd/Ctrl+Shift+0 / Cmd/Ctrl+Shift+8 / Cmd/Ctrl+Shift+9 / Cmd/Ctrl+Shift+Down)
 */

const SELECTORS = {
  MENU_TRIGGER: '[data-test-id="bard-mode-menu-button"] button',
  MENU_CONTAINER: '.cdk-overlay-pane [role="menu"]',
  OPTION_FAST: '[data-test-id="bard-mode-option-fast"]',
  OPTION_THINKING: '[data-test-id="bard-mode-option-thinking"]',
  OPTION_PRO: '[data-test-id="bard-mode-option-pro"]',
  INPUT_FIELD: '.input-gradient [contenteditable="true"][role="textbox"]',
};

/**
 * Simulate strong click (mouse event sequence)
 */
function simulateClick(element: HTMLElement | null): void {
  if (!element) {
    console.error('[Model Switch] Element not found for clicking.');
    return;
  }
  const mouseEventInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
  };
  element.dispatchEvent(new MouseEvent('mousedown', mouseEventInit));
  element.dispatchEvent(new MouseEvent('mouseup', mouseEventInit));
  element.dispatchEvent(new MouseEvent('click', mouseEventInit));
}

/**
 * Wait for element to appear
 */
function waitForElement(selector: string, timeout = 2000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) return resolve(el);

    const observer = new MutationObserver((mutations, obs) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

/**
 * Wait for element to be removed from DOM
 */
function waitForRemoval(element: HTMLElement | null, timeout = 1500): Promise<void> {
  return new Promise((resolve) => {
    if (!element || !document.contains(element)) return resolve();
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const done = (): void => {
      if (timerId) clearTimeout(timerId);
      resolve();
    };
    const obs = new MutationObserver(() => {
      if (!document.contains(element)) {
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
}

/**
 * Main model switching logic
 */
export async function handleModelSwitch(targetSelector: string | null): Promise<void> {
  try {
    const menuTrigger = document.querySelector(SELECTORS.MENU_TRIGGER) as HTMLElement | null;
    if (!menuTrigger) {
      console.error('[Model Switch] Menu trigger button not found.');
      return;
    }

    const isMenuOpen = !!document.querySelector(SELECTORS.MENU_CONTAINER);

    // Step 1: Only click DOM1 if menu is closed
    if (!isMenuOpen) {
      console.log('[Model Switch] Menu is closed. Opening menu...');
      simulateClick(menuTrigger);
    } else {
      console.log('[Model Switch] Menu is already open.');
    }

    // If no target specified (just show list), end here
    if (!targetSelector) return;

    try {
      // Wait for menu animation/DOM generation
      const targetOption = await waitForElement(targetSelector, 2000);
      // Wait for UI rendering completion
      await new Promise((r) => setTimeout(r, 100));

      console.log(`[Model Switch] Selecting model: ${targetSelector}`);
      simulateClick(targetOption);

      // Wait for menu to close
      const menuContainer = document.querySelector(SELECTORS.MENU_CONTAINER) as HTMLElement | null;
      if (menuContainer) {
        await waitForRemoval(menuContainer, 1500);
      }

      // Focus input field after model change
      await new Promise((r) => setTimeout(r, 200));
      const inputField = document.querySelector(SELECTORS.INPUT_FIELD) as HTMLElement | null;
      if (inputField) {
        try {
          inputField.focus({ preventScroll: true });
          console.log('[Model Switch] Focused back to input field');
        } catch (err) {
          console.warn('[Model Switch] Failed to focus input field:', err);
        }
      }
    } catch (error) {
      console.error('[Model Switch] Error selecting model:', error);
    }
  } catch (err) {
    console.error('[Model Switch] Critical error:', err);
  }
}

export const MODEL_SELECTORS = SELECTORS;

/**
 * Initialize model switch (no-op, functionality is called via handleModelSwitch)
 */
export function initializeModelSwitch(): void {
  // Model switch is triggered via handleModelSwitch
  // No initialization required
}
