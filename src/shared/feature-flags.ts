export type FeatureCategory =
  | 'vimScroll'
  | 'keepDesktopUI'
  | 'wideScreen'
  | 'safeSend'
  | 'otherShortcuts';

export type FeatureToggles = Record<FeatureCategory, boolean>;

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  vimScroll: true,
  keepDesktopUI: true,
  wideScreen: true,
  safeSend: true,
  otherShortcuts: true,
};
