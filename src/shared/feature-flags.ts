export type FeatureCategory = 'vimScroll' | 'wideScreen' | 'safeSend' | 'otherShortcuts';

export type FeatureToggles = Record<FeatureCategory, boolean>;

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  vimScroll: true,
  wideScreen: true,
  safeSend: true,
  otherShortcuts: true,
};
