/**
 * Focus management for input field with Shift+Space toggle
 */

const RETRIES = 10;
const INTERVAL = 500;

interface CurrentState {
  editor: HTMLElement | null;
  container: HTMLElement | null;
  ac: AbortController | null;
}

const _push = history.pushState;
const _replace = history.replaceState;

let current: CurrentState = { editor: null, container: null, ac: null };

// Double requestAnimationFrame (ensure delay until next rendering cycle)
const raf2 = (cb: () => void): void => {
  requestAnimationFrame(() => requestAnimationFrame(cb));
};

function tryBindWithRetry(retries = RETRIES, interval = INTERVAL): void {
  let attempts = 0;
  const timer = setInterval(() => {
    const container = document.querySelector('.input-gradient') as HTMLElement | null;
    const editor =
      (container?.querySelector(
        '.text-input-field .ql-editor[contenteditable="true"][role="textbox"]'
      ) as HTMLElement | null) ||
      (container?.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement | null);

    if ((container && editor) || attempts >= retries) {
      clearInterval(timer);
      if (container && editor) bind(container, editor);
    }
    attempts++;
  }, interval);
}

export function toggleFocus(): void {
  const container = document.querySelector('.input-gradient') as HTMLElement | null;
  const editor =
    (container?.querySelector(
      '.text-input-field .ql-editor[contenteditable="true"][role="textbox"]'
    ) as HTMLElement | null) ||
    (container?.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement | null);

  if (!container || !editor) return;

  const hasFocus = container.matches(':focus-within');

  if (hasFocus) {
    // Blur in next frame
    raf2(() => {
      try {
        editor.blur();
      } catch {}
      container.classList.remove('focused');
    });
  } else {
    // Give focus in "next next frame" and don't touch selection (so IME doesn't switch to ASCII)
    raf2(() => {
      try {
        editor.focus({ preventScroll: true });
      } catch {}
      // Insurance: focus again if stolen by another element
      setTimeout(() => {
        if (!container.matches(':focus-within')) {
          try {
            editor.focus({ preventScroll: true });
          } catch {}
        }
      }, 0);
      container.classList.add('focused');
    });
  }
}

// Initial binding helper if needed, but ShortcutsManager handles the trigger.
// We might still need the focusin/focusout listeners for styling.

function bind(container: HTMLElement, editor: HTMLElement): void {
  if (current.editor === editor) return;
  if (current.ac) current.ac.abort();

  const ac = new AbortController();
  const { signal } = ac;

  const onFocusIn = (): void => container.classList.add('focused');
  const onFocusOut = (e: FocusEvent): void => {
    if (!container.contains(e.relatedTarget as Node)) {
      container.classList.remove('focused');
    }
  };

  container.addEventListener('focusin', onFocusIn, { signal, passive: false });
  container.addEventListener('focusout', onFocusOut, { signal, passive: false });

  // Initial reflection
  container.classList.toggle('focused', container.matches(':focus-within'));

  current = { editor, container, ac };
}

export function initializeFocusManagement(): void {
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    tryBindWithRetry();
    return _push.apply(this, args);
  };
  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    tryBindWithRetry();
    return _replace.apply(this, args);
  };
  window.addEventListener('popstate', () => tryBindWithRetry(), { passive: false });

  // Initial binding
  tryBindWithRetry();
}
