import type { KeyBinding } from './shortcuts';

export type ModSource = 'mod' | 'meta' | 'ctrl' | 'none';

export interface NormalizedBinding {
  mod: boolean;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  modSource: ModSource;
}

export type BindingValidationReason = 'requires_modifier' | 'disallowed_key';

export type BindingValidationResult =
  | { valid: true }
  | { valid: false; reason: BindingValidationReason; key: string };

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.platform !== 'string') {
    return false;
  }
  return navigator.platform.toLowerCase().includes('mac');
}

export function isWindowsPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const platform = typeof navigator.platform === 'string' ? navigator.platform.toLowerCase() : '';
  if (platform.includes('win')) return true;
  const userAgent =
    typeof navigator.userAgent === 'string' ? navigator.userAgent.toLowerCase() : '';
  return userAgent.includes('windows');
}

export function isModKey(
  e: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey'> | { metaKey?: boolean; ctrlKey?: boolean }
): boolean {
  return isMacPlatform() ? !!e.metaKey : !!e.ctrlKey;
}

export function getModLabel(options?: { useSymbol?: boolean; isMac?: boolean }): string {
  const isMac = options?.isMac ?? isMacPlatform();
  const useSymbol = options?.useSymbol ?? true;
  if (isMac) return useSymbol ? '⌘' : 'Cmd';
  return 'Ctrl';
}

export function getAltLabel(options?: { useSymbol?: boolean; isMac?: boolean }): string {
  const isMac = options?.isMac ?? isMacPlatform();
  const useSymbol = options?.useSymbol ?? true;
  if (isMac) return useSymbol ? '⌥' : 'Option';
  return 'Alt';
}

function codeToPhysicalKey(code?: string): string | null {
  if (!code) return null;
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);

  const codeMap: Record<string, string> = {
    Space: 'Space',
    Enter: 'Enter',
    Backspace: 'Backspace',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  };

  return codeMap[code] || null;
}

export function getKeyLabel(
  binding: Pick<KeyBinding, 'key' | 'code'>,
  options?: { isMac?: boolean }
): string {
  const isMac = options?.isMac ?? isMacPlatform();

  const special: Record<string, string> = {
    ' ': 'Space',
    Space: 'Space',
    Enter: 'Enter',
    Backspace: isMac ? '⌫' : 'Backspace',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  };

  if (special[binding.key]) return special[binding.key];
  if (binding.code && special[binding.code]) return special[binding.code];

  const physical = codeToPhysicalKey(binding.code);
  if (physical) return physical;

  return binding.key;
}

export function normalizeBindingForPlatform(
  binding: KeyBinding,
  isMac = isMacPlatform()
): NormalizedBinding {
  const metaProvided = typeof binding.meta === 'boolean';
  const ctrlProvided = typeof binding.ctrl === 'boolean';
  const modProvided = typeof binding.mod === 'boolean';

  const usesMetaAsMod = !modProvided && metaProvided && !ctrlProvided;
  const usesCtrlAsMod = !modProvided && ctrlProvided && !metaProvided;

  const mod =
    (modProvided ? !!binding.mod : undefined) ??
    (usesMetaAsMod ? !!binding.meta : undefined) ??
    (usesCtrlAsMod ? !!binding.ctrl : undefined) ??
    false;

  const meta =
    usesMetaAsMod && !modProvided
      ? isMac && mod
      : metaProvided
        ? !!binding.meta
        : isMac
          ? mod
          : false;

  const ctrl =
    usesCtrlAsMod && !modProvided
      ? !isMac && mod
      : ctrlProvided
        ? !!binding.ctrl
        : !isMac
          ? mod
          : false;

  const alt = !!binding.alt;
  const shift = !!binding.shift;

  let modSource: ModSource = 'none';
  if (modProvided) modSource = 'mod';
  else if (usesMetaAsMod) modSource = 'meta';
  else if (usesCtrlAsMod) modSource = 'ctrl';

  return { mod, meta, ctrl, alt, shift, modSource };
}

const MODIFIER_REQUIRED_KEYS = new Set(['escape', 'esc', 'backspace', 'delete']);
const MODIFIER_REQUIRED_CODES = new Set(['escape', 'backspace', 'delete']);

const FORBIDDEN_KEYS = new Set([
  'enter',
  'return',
  'tab',
  // IME / input-mode switching keys
  'eisu',
  'alphanumeric',
  'kanamode',
  'zenkaku',
  'hankaku',
  'hankakuzenkaku',
  'henkan',
  'convert',
  'muhenkan',
  'nonconvert',
  'kana',
  'kanji',
  'katakana',
  'hiragana',
  'romaji',
  'lang1',
  'lang2',
  'lang3',
  'lang4',
  'lang5',
  // Lock keys
  'capslock',
  'numlock',
  'scrolllock',
]);

const FORBIDDEN_CODES = new Set([
  'enter',
  'numpadenter',
  'tab',
  // IME / input-mode switching codes
  'eisu',
  'alphanumeric',
  'kanamode',
  'convert',
  'nonconvert',
  'lang1',
  'lang2',
  'lang3',
  'lang4',
  'lang5',
  'hankakuzenkaku',
  // Lock codes
  'capslock',
  'numlock',
  'scrolllock',
]);

const WINDOWS_KEY_NAMES = new Set(['meta', 'os', 'win', 'super']);
const WINDOWS_KEY_CODES = new Set(['metaleft', 'metaright', 'osleft', 'osright']);

const normalizeKeyName = (key?: string): string => (key ? key.toLowerCase() : '');

const isWindowsKeyBinding = (
  binding: KeyBinding,
  normalized: NormalizedBinding,
  isMac: boolean
): boolean => {
  if (isMac) return false;
  const keyLower = normalizeKeyName(binding.key);
  const codeLower = binding.code?.toLowerCase() ?? '';
  if (WINDOWS_KEY_NAMES.has(keyLower)) return true;
  if (WINDOWS_KEY_CODES.has(codeLower) || codeLower.startsWith('meta')) return true;
  return normalized.meta;
};

const requiresModifierOnlyKey = (binding: KeyBinding, normalized: NormalizedBinding): boolean => {
  const keyLower = normalizeKeyName(binding.key);
  const codeLower = binding.code?.toLowerCase() ?? '';
  const unmodified =
    !normalized.mod && !normalized.meta && !normalized.ctrl && !normalized.shift && !normalized.alt;
  const keyMatch = MODIFIER_REQUIRED_KEYS.has(keyLower);
  const codeMatch = MODIFIER_REQUIRED_CODES.has(codeLower);
  return unmodified && (keyMatch || codeMatch);
};

const isForbiddenBinding = (
  binding: KeyBinding,
  normalized: NormalizedBinding,
  isMac: boolean
): boolean => {
  const keyLower = normalizeKeyName(binding.key);
  const codeLower = binding.code?.toLowerCase() ?? '';
  if (FORBIDDEN_KEYS.has(keyLower) || FORBIDDEN_CODES.has(codeLower)) return true;
  return isWindowsKeyBinding(binding, normalized, isMac);
};

export function validateBinding(
  binding: KeyBinding,
  options?: { isMac?: boolean }
): BindingValidationResult {
  const isMac = options?.isMac ?? isMacPlatform();
  const normalized = normalizeBindingForPlatform(binding, isMac);

  if (isForbiddenBinding(binding, normalized, isMac)) {
    return { valid: false, reason: 'disallowed_key', key: binding.key };
  }

  if (requiresModifierOnlyKey(binding, normalized)) {
    return { valid: false, reason: 'requires_modifier', key: binding.key };
  }

  return { valid: true };
}
