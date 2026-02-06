type MediaListener = EventListenerOrEventListenerObject;
type LegacyMediaListener = (this: MediaQueryList, ev: MediaQueryListEvent) => unknown;

const MIN_DESKTOP_WIDTH = 960;
const ignoreError = (error: unknown): void => {
  void error;
};

const getDescriptor = (target: object, prop: string): PropertyDescriptor | undefined => {
  let current: object | null = target;
  while (current) {
    const desc = Object.getOwnPropertyDescriptor(current, prop);
    if (desc) return desc;
    current = Object.getPrototypeOf(current);
  }
  return undefined;
};

const innerWidthGetter = getDescriptor(window, 'innerWidth')?.get;
const elementClientWidthGetter =
  getDescriptor(HTMLElement.prototype, 'clientWidth')?.get ??
  getDescriptor(Element.prototype, 'clientWidth')?.get;

const getClientWidth = (el: Element | null): number => {
  if (!el || !elementClientWidthGetter) return 0;
  try {
    return Number(elementClientWidthGetter.call(el)) || 0;
  } catch {
    return 0;
  }
};

const getActualWidth = (): number => {
  let width = 0;
  try {
    if (innerWidthGetter) {
      width = Number(innerWidthGetter.call(window)) || 0;
    }
  } catch (error) {
    ignoreError(error);
  }
  const docWidth = getClientWidth(document.documentElement);
  return Math.max(width, docWidth);
};

const state =
  window.__gxtViewportSpoof ??
  ({
    enabled: true,
    minWidth: MIN_DESKTOP_WIDTH,
    patched: false,
  } as { enabled: boolean; minWidth: number; patched: boolean; notify?: () => void });

window.__gxtViewportSpoof = state;

if (!state.patched) {
  state.patched = true;
  const mediaQueryNotifiers = new Set<() => void>();
  const notifyAll = (): void => {
    mediaQueryNotifiers.forEach((notify) => notify());
    try {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('orientationchange'));
    } catch (error) {
      ignoreError(error);
    }
    try {
      window.visualViewport?.dispatchEvent(new Event('resize'));
    } catch (error) {
      ignoreError(error);
    }
  };

  state.notify = notifyAll;

  const getSpoofedWidth = (): number => {
    const actual = getActualWidth();
    if (!state.enabled) return actual;
    return actual < state.minWidth ? state.minWidth : actual;
  };

  const defineNumberGetter = (target: object, prop: string, getter: () => number): void => {
    try {
      const desc = Object.getOwnPropertyDescriptor(target, prop);
      if (desc && desc.configurable === false) return;
      Object.defineProperty(target, prop, { get: getter, configurable: true });
    } catch (error) {
      ignoreError(error);
    }
  };

  // Force a minimum width so Gemini keeps desktop DOM even in narrow windows.
  defineNumberGetter(window, 'innerWidth', getSpoofedWidth);
  defineNumberGetter(window, 'outerWidth', getSpoofedWidth);
  if (window.visualViewport) {
    defineNumberGetter(window.visualViewport, 'width', getSpoofedWidth);
  }
  if (window.screen) {
    defineNumberGetter(window.screen, 'width', getSpoofedWidth);
    defineNumberGetter(window.screen, 'availWidth', getSpoofedWidth);
  }
  const patchDocumentWidths = (): void => {
    if (document.documentElement) {
      defineNumberGetter(document.documentElement, 'clientWidth', getSpoofedWidth);
    }
    if (document.body) {
      defineNumberGetter(document.body, 'clientWidth', getSpoofedWidth);
    }
  };
  patchDocumentWidths();
  document.addEventListener('DOMContentLoaded', patchDocumentWidths, { once: true });

  const originalMatchMedia = window.matchMedia?.bind(window);
  if (originalMatchMedia) {
    const widthQueryTest = /(?:min|max)-width\s*:\s*[0-9.]+px|\bwidth\s*:\s*[0-9.]+px/i;

    const parseWidthConstraints = (query: string) => {
      const normalized = query.toLowerCase();
      let min: number | null = null;
      let max: number | null = null;
      const exact: number[] = [];

      for (const match of normalized.matchAll(/min-width\s*:\s*([0-9.]+)px/g)) {
        const value = Number.parseFloat(match[1]);
        if (!Number.isNaN(value)) {
          min = min === null ? value : Math.max(min, value);
        }
      }

      for (const match of normalized.matchAll(/max-width\s*:\s*([0-9.]+)px/g)) {
        const value = Number.parseFloat(match[1]);
        if (!Number.isNaN(value)) {
          max = max === null ? value : Math.min(max, value);
        }
      }

      for (const match of normalized.matchAll(/(^|[^-])width\s*:\s*([0-9.]+)px/g)) {
        const value = Number.parseFloat(match[2]);
        if (!Number.isNaN(value)) {
          exact.push(value);
        }
      }

      return { min, max, exact };
    };

    const matchesWidthQuery = (query: string): boolean => {
      const { min, max, exact } = parseWidthConstraints(query);
      const width = Math.round(getSpoofedWidth());
      let matches = true;

      if (min !== null && width < min) matches = false;
      if (max !== null && width > max) matches = false;
      if (exact.length > 0) {
        matches = matches && exact.every((value) => Math.round(value) === width);
      }

      return matches;
    };

    const buildEvent = (matches: boolean, media: string): MediaQueryListEvent => {
      try {
        return new MediaQueryListEvent('change', { matches, media });
      } catch (error) {
        ignoreError(error);
        const fallback = new Event('change') as MediaQueryListEvent;
        Object.defineProperty(fallback, 'matches', {
          configurable: true,
          enumerable: true,
          value: matches,
        });
        Object.defineProperty(fallback, 'media', {
          configurable: true,
          enumerable: true,
          value: media,
        });
        return fallback;
      }
    };

    const invokeListener = (
      listener: MediaListener,
      event: MediaQueryListEvent,
      target: MediaQueryList
    ): void => {
      if (typeof listener === 'function') {
        listener.call(target, event);
      } else if (listener && typeof listener.handleEvent === 'function') {
        listener.handleEvent(event);
      }
    };

    const invokeLegacyListener = (
      listener: LegacyMediaListener,
      event: MediaQueryListEvent,
      target: MediaQueryList
    ): void => {
      listener.call(target, event);
    };

    const patchedMatchMedia = (query: string): MediaQueryList => {
      const real = originalMatchMedia(query);
      if (!widthQueryTest.test(query)) return real;

      let lastMatches = matchesWidthQuery(query);
      const listeners = new Set<MediaListener>();
      const legacyListeners = new Set<LegacyMediaListener>();
      let onchange: LegacyMediaListener | null = null;
      let listenerTarget: MediaQueryList = real;

      const notify = (): void => {
        const nextMatches = matchesWidthQuery(query);
        if (nextMatches === lastMatches) return;
        lastMatches = nextMatches;
        const patchedEvent = buildEvent(nextMatches, real.media);
        if (onchange) invokeLegacyListener(onchange, patchedEvent, listenerTarget);
        listeners.forEach((listener) => invokeListener(listener, patchedEvent, listenerTarget));
        legacyListeners.forEach((listener) =>
          invokeLegacyListener(listener, patchedEvent, listenerTarget)
        );
      };

      const handleRealChange = (): void => notify();

      if (typeof real.addEventListener === 'function') {
        real.addEventListener('change', handleRealChange);
      } else if (typeof real.addListener === 'function') {
        real.addListener(handleRealChange);
      }

      const wrapper = {
        get media() {
          return real.media;
        },
        get matches() {
          lastMatches = matchesWidthQuery(query);
          return lastMatches;
        },
        addListener(listener: LegacyMediaListener | null) {
          if (listener) legacyListeners.add(listener);
        },
        removeListener(listener: LegacyMediaListener | null) {
          if (listener) legacyListeners.delete(listener);
        },
        addEventListener(type: string, listener: MediaListener | null) {
          if (type === 'change' && listener) listeners.add(listener);
        },
        removeEventListener(type: string, listener: MediaListener | null) {
          if (type === 'change' && listener) listeners.delete(listener);
        },
        dispatchEvent(event: Event) {
          if (event.type === 'change') notify();
          return true;
        },
        get onchange() {
          return onchange;
        },
        set onchange(value: LegacyMediaListener | null) {
          onchange = value;
        },
      } as MediaQueryList;
      listenerTarget = wrapper;

      mediaQueryNotifiers.add(notify);
      return wrapper;
    };

    try {
      window.matchMedia = patchedMatchMedia;
    } catch (error) {
      ignoreError(error);
    }
  }
}
