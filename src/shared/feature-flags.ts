export type FeatureCategory =
  | 'preserveScrollOnSend'
  | 'vimScroll'
  | 'keepDesktopUI'
  | 'wideScreen'
  | 'safeSend'
  | 'otherShortcuts';

export type FeatureToggles = Record<FeatureCategory, boolean>;

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  preserveScrollOnSend: false,
  vimScroll: true,
  keepDesktopUI: true,
  wideScreen: true,
  safeSend: true,
  otherShortcuts: true,
};
