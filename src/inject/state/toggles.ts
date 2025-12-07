import {
  DEFAULT_FEATURE_TOGGLES,
  type FeatureCategory,
  type FeatureToggles,
} from '@/shared/feature-flags';

let currentToggles: FeatureToggles = { ...DEFAULT_FEATURE_TOGGLES };

function applyWideScreenFlag(enabled: boolean): void {
  const root = document.documentElement;
  if (enabled) {
    root.setAttribute('data-gxt-wide', 'true');
  } else {
    root.removeAttribute('data-gxt-wide');
  }
}

export function setFeatureToggles(next: FeatureToggles): void {
  currentToggles = { ...DEFAULT_FEATURE_TOGGLES, ...next };
  applyWideScreenFlag(currentToggles.wideScreen);
}

export function isFeatureEnabled(category: FeatureCategory): boolean {
  return !!currentToggles[category];
}

export function getFeatureToggles(): FeatureToggles {
  return { ...currentToggles };
}
