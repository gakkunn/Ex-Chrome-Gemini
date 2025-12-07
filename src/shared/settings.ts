import { DEFAULT_FEATURE_TOGGLES } from './feature-flags';
import { DEFAULT_SHORTCUTS } from './shortcuts';

import type { FeatureToggles } from './feature-flags';
import type { KeyBinding, ShortcutSettings } from './shortcuts';

export interface ExtensionSettings {
  featureToggles: FeatureToggles;
  shortcuts: ShortcutSettings;
}

export interface PartialExtensionSettings {
  featureToggles?: Partial<FeatureToggles>;
  shortcuts?: Partial<ShortcutSettings>;
}

const matchesKey = (binding: KeyBinding, key: string): boolean =>
  binding.key?.toLowerCase() === key.toLowerCase() || binding.code === `Key${key.toUpperCase()}`;

function isLegacyPinChat(bindings: KeyBinding[] | undefined): boolean {
  if (!Array.isArray(bindings) || bindings.length !== 2) return false;
  const metaVariant = bindings.find(
    (binding) =>
      matchesKey(binding, 'p') &&
      binding.shift === true &&
      binding.meta === true &&
      !binding.mod &&
      !binding.ctrl &&
      !binding.alt
  );
  const altVariant = bindings.find(
    (binding) =>
      matchesKey(binding, 'p') &&
      binding.shift === true &&
      binding.alt === true &&
      !binding.mod &&
      !binding.ctrl &&
      !binding.meta
  );
  return !!metaVariant && !!altVariant;
}

function cleanUploadBindings(bindings: KeyBinding[] | undefined): KeyBinding[] | undefined {
  if (!Array.isArray(bindings)) return undefined;
  const filtered = bindings.filter(
    (binding) =>
      !(matchesKey(binding, 'u') && binding.shift === true && binding.mod === true) &&
      !(matchesKey(binding, 'u') && binding.shift === true && binding.meta === true)
  );
  if (filtered.length === bindings.length) return filtered;
  return filtered.length > 0 ? filtered : DEFAULT_SHORTCUTS.uploadFiles;
}

export function mergeSettings(
  saved: PartialExtensionSettings | undefined,
  partial: PartialExtensionSettings = {}
): ExtensionSettings {
  const featureToggles: FeatureToggles = {
    ...DEFAULT_FEATURE_TOGGLES,
    ...(saved?.featureToggles || {}),
    ...(partial.featureToggles || {}),
  };

  const shortcuts: ShortcutSettings = {
    ...DEFAULT_SHORTCUTS,
    ...(saved?.shortcuts || {}),
    ...(partial.shortcuts || {}),
  };

  if (
    saved?.shortcuts?.pinChat &&
    isLegacyPinChat(saved.shortcuts.pinChat) &&
    !partial.shortcuts?.pinChat
  ) {
    shortcuts.pinChat = DEFAULT_SHORTCUTS.pinChat;
  }

  if (saved?.shortcuts?.uploadFiles && !partial.shortcuts?.uploadFiles) {
    const cleaned = cleanUploadBindings(saved.shortcuts.uploadFiles);
    if (cleaned) {
      shortcuts.uploadFiles = cleaned;
    }
  }

  return { featureToggles, shortcuts };
}
