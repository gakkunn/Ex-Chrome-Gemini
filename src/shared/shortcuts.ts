import type { FeatureCategory } from './feature-flags';
import { getMessage, type I18nKey } from './i18n';
import { isWindowsPlatform } from './keyboard';

export type ShortcutId =
  | 'scrollTop'
  | 'scrollBottom'
  | 'scrollUp'
  | 'scrollDown'
  | 'scrollHalfUp'
  | 'scrollHalfDown'
  | 'toggleFocus'
  | 'toggleModel'
  | 'modeInstant'
  | 'modeThinking'
  | 'modePro'
  | 'temporaryChat'
  | 'toggleShortcuts'
  | 'deleteChat'
  | 'uploadFiles'
  | 'pinChat';

export type KeyBinding = {
  key: string;
  code?: string;
  mod?: boolean;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

interface ShortcutDefinitionConfig {
  id: ShortcutId;
  labelKey: I18nKey;
  category: FeatureCategory;
  defaultBindings: KeyBinding[];
}

export interface ShortcutDefinition extends ShortcutDefinitionConfig {
  readonly label: string;
}

interface GeminiDefaultShortcutConfig extends KeyBinding {
  labelKey: I18nKey;
}

export interface GeminiDefaultShortcut extends GeminiDefaultShortcutConfig {
  readonly label: string;
}

export type ShortcutSettings = Partial<Record<ShortcutId, KeyBinding[]>>;

const shortcutDefinition = (config: ShortcutDefinitionConfig): ShortcutDefinition => ({
  ...config,
  get label() {
    return getMessage(config.labelKey);
  },
});

const DEFAULT_MODE_INSTANT_BINDINGS: KeyBinding[] = [
  { key: '0', code: 'Digit0', mod: true, shift: true },
];
const WINDOWS_MODE_INSTANT_BINDINGS: KeyBinding[] = [
  { key: '7', code: 'Digit7', mod: true, shift: true },
];

const getModeInstantDefaultBindings = (): KeyBinding[] =>
  isWindowsPlatform() ? WINDOWS_MODE_INSTANT_BINDINGS : DEFAULT_MODE_INSTANT_BINDINGS;

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  shortcutDefinition({
    id: 'scrollTop',
    labelKey: 'shortcut_label_scroll_top',
    category: 'vimScroll',
    defaultBindings: [{ key: 'k', code: 'KeyK', mod: true }],
  }),
  shortcutDefinition({
    id: 'scrollBottom',
    labelKey: 'shortcut_label_scroll_bottom',
    category: 'vimScroll',
    defaultBindings: [{ key: 'j', code: 'KeyJ', mod: true }],
  }),
  shortcutDefinition({
    id: 'scrollUp',
    labelKey: 'shortcut_label_scroll_up',
    category: 'vimScroll',
    defaultBindings: [{ key: 'k', code: 'KeyK' }],
  }),
  shortcutDefinition({
    id: 'scrollDown',
    labelKey: 'shortcut_label_scroll_down',
    category: 'vimScroll',
    defaultBindings: [{ key: 'j', code: 'KeyJ' }],
  }),
  shortcutDefinition({
    id: 'scrollHalfUp',
    labelKey: 'shortcut_label_scroll_half_up',
    category: 'vimScroll',
    defaultBindings: [{ key: 'K', code: 'KeyK', shift: true }],
  }),
  shortcutDefinition({
    id: 'scrollHalfDown',
    labelKey: 'shortcut_label_scroll_half_down',
    category: 'vimScroll',
    defaultBindings: [{ key: 'J', code: 'KeyJ', shift: true }],
  }),
  shortcutDefinition({
    id: 'toggleFocus',
    labelKey: 'shortcut_label_toggle_focus',
    category: 'wideScreen',
    defaultBindings: [{ key: ' ', code: 'Space', shift: true }],
  }),
  shortcutDefinition({
    id: 'toggleModel',
    labelKey: 'shortcut_label_toggle_model',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'ArrowDown', code: 'ArrowDown', mod: true, shift: true }],
  }),
  shortcutDefinition({
    id: 'modeInstant',
    labelKey: 'shortcut_label_mode_instant',
    category: 'otherShortcuts',
    defaultBindings: getModeInstantDefaultBindings(),
  }),
  shortcutDefinition({
    id: 'modeThinking',
    labelKey: 'shortcut_label_mode_thinking',
    category: 'otherShortcuts',
    defaultBindings: [{ key: '8', code: 'Digit8', mod: true, shift: true }],
  }),
  shortcutDefinition({
    id: 'modePro',
    labelKey: 'shortcut_label_mode_pro',
    category: 'otherShortcuts',
    defaultBindings: [{ key: '9', code: 'Digit9', mod: true, shift: true }],
  }),
  shortcutDefinition({
    id: 'temporaryChat',
    labelKey: 'shortcut_label_temporary_chat',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'i', code: 'KeyI', mod: true }],
  }),
  shortcutDefinition({
    id: 'toggleShortcuts',
    labelKey: 'shortcut_label_toggle_shortcuts',
    category: 'otherShortcuts',
    defaultBindings: [{ key: '/', code: 'Slash', mod: true }],
  }),
  shortcutDefinition({
    id: 'deleteChat',
    labelKey: 'shortcut_label_delete_chat',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'Backspace', shift: true, mod: true }],
  }),
  shortcutDefinition({
    id: 'uploadFiles',
    labelKey: 'shortcut_label_upload_files',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'u', code: 'KeyU', mod: true }],
  }),
  shortcutDefinition({
    id: 'pinChat',
    labelKey: 'shortcut_label_pin_chat',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'p', code: 'KeyP', mod: true, shift: true }],
  }),
];

const geminiShortcut = (config: GeminiDefaultShortcutConfig): GeminiDefaultShortcut => ({
  ...config,
  get label() {
    return getMessage(config.labelKey);
  },
});

export const GEMINI_DEFAULT_SHORTCUTS: GeminiDefaultShortcut[] = [
  geminiShortcut({
    key: 'O',
    code: 'KeyO',
    mod: true,
    shift: true,
    labelKey: 'gemini_default_shortcut_new_chat',
  }),
  geminiShortcut({
    key: 'K',
    code: 'KeyK',
    mod: true,
    shift: true,
    labelKey: 'gemini_default_shortcut_search',
  }),
  geminiShortcut({
    key: 'S',
    code: 'KeyS',
    mod: true,
    shift: true,
    labelKey: 'gemini_default_shortcut_toggle_sidebar',
  }),
];

export const DEFAULT_SHORTCUTS: ShortcutSettings = SHORTCUT_DEFINITIONS.reduce((acc, def) => {
  acc[def.id] = def.defaultBindings;
  return acc;
}, {} as ShortcutSettings);
