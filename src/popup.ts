import type { ExtensionSettings } from '@/shared/settings';
import type { FeatureCategory } from '@/shared/feature-flags';
import type { KeyBinding, ShortcutId, GeminiDefaultShortcut } from '@/shared/shortcuts';
import {
  SHORTCUT_DEFINITIONS,
  DEFAULT_SHORTCUTS,
  GEMINI_DEFAULT_SHORTCUTS,
} from '@/shared/shortcuts';
import { DEFAULT_FEATURE_TOGGLES } from '@/shared/feature-flags';
import { loadSettings, saveSettings } from '@/shared/storage';
import {
  getAltLabel,
  getKeyLabel,
  getModLabel,
  isMacPlatform,
  isModKey,
  normalizeBindingForPlatform,
  validateBinding,
} from '@/shared/keyboard';
import { getMessage } from '@/shared/i18n';

type ShortcutDefinitionWithCategory = (typeof SHORTCUT_DEFINITIONS)[number];

const isMac = isMacPlatform();

const featureLabels: Record<FeatureCategory, string> = {
  vimScroll: 'Vim-like Scroll',
  wideScreen: 'Wide Screen (Clean UI + Focus)',
  safeSend: `Send with ${getModLabel({ isMac, useSymbol: false })} + Enter`,
  otherShortcuts: 'Other Shortcuts',
};

const featureOrder: FeatureCategory[] = ['vimScroll', 'wideScreen', 'safeSend', 'otherShortcuts'];

let state: ExtensionSettings | null = null;

const togglesContainer = document.getElementById('feature-toggles');
const shortcutsContainer = document.getElementById('shortcuts-list');
const resetButton = document.getElementById('reset-button');
const NON_PASSIVE_KEYDOWN_OPTIONS: AddEventListenerOptions = { capture: true, passive: false };

function formatBinding(binding: KeyBinding): string {
  const normalized = normalizeBindingForPlatform(binding, isMac);
  const parts: string[] = [];
  if (normalized.mod) {
    parts.push(getModLabel({ isMac, useSymbol: true }));
  } else {
    if (normalized.meta) parts.push(getModLabel({ isMac: true, useSymbol: true }));
    if (normalized.ctrl) parts.push('Ctrl');
  }
  if (normalized.alt) parts.push(getAltLabel({ isMac, useSymbol: true }));
  if (normalized.shift) parts.push(isMac ? '⇧' : 'Shift');
  parts.push(getKeyLabel({ key: binding.key, code: binding.code }, { isMac }));
  return parts.join(' + ');
}

function formatBindings(bindings: KeyBinding[]): string {
  if (!bindings.length) return '';
  return bindings.map((b) => formatBinding(b)).join(' / ');
}

function eventToBinding(e: KeyboardEvent): KeyBinding | null {
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return null;
  const key = e.key === 'Spacebar' ? ' ' : e.key;
  return {
    key,
    code: e.code,
    mod: isModKey(e),
    meta: e.metaKey,
    ctrl: e.ctrlKey,
    shift: e.shiftKey,
    alt: e.altKey,
  };
}

function getBindingsFor(def: ShortcutDefinitionWithCategory): KeyBinding[] {
  if (!state) return def.defaultBindings;
  const value = state.shortcuts[def.id];
  if (Array.isArray(value) && value.length) return value;
  return def.defaultBindings;
}

function bindingsMatch(a: KeyBinding, b: KeyBinding): boolean {
  const normalizedA = normalizeBindingForPlatform(a, isMac);
  const normalizedB = normalizeBindingForPlatform(b, isMac);
  const modifiersMatch =
    normalizedA.mod === normalizedB.mod &&
    normalizedA.meta === normalizedB.meta &&
    normalizedA.ctrl === normalizedB.ctrl &&
    normalizedA.shift === normalizedB.shift &&
    normalizedA.alt === normalizedB.alt;
  const keyMatch = a.key.toLowerCase() === b.key.toLowerCase();
  const codeMatch = a.code && b.code ? a.code === b.code : false;

  return modifiersMatch && (keyMatch || codeMatch);
}

function findConflictingShortcut(
  binding: KeyBinding,
  currentId: ShortcutId
): ShortcutDefinitionWithCategory | null {
  const currentState = state;
  if (!currentState) return null;

  return (
    SHORTCUT_DEFINITIONS.find((def) => {
      if (def.id === currentId) return false;
      if (!currentState.featureToggles[def.category]) return false;
      return getBindingsFor(def).some((existing) => bindingsMatch(existing, binding));
    }) || null
  );
}

function findGeminiDefaultConflict(binding: KeyBinding): GeminiDefaultShortcut | null {
  return (
    GEMINI_DEFAULT_SHORTCUTS.find((defaultShortcut) => bindingsMatch(defaultShortcut, binding)) ||
    null
  );
}

function renderFeatureToggles() {
  if (!state || !togglesContainer) return;
  togglesContainer.innerHTML = '';

  featureOrder.forEach((category) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!state!.featureToggles[category];
    input.addEventListener('change', async () => {
      if (!state) return;
      state.featureToggles[category] = input.checked;
      await saveSettings({ featureToggles: { ...state.featureToggles } });
      renderShortcuts();
    });

    const text = document.createElement('span');
    text.textContent = featureLabels[category];

    wrapper.appendChild(input);
    wrapper.appendChild(text);
    togglesContainer.appendChild(wrapper);
  });
}

function renderShortcuts() {
  if (!state || !shortcutsContainer) return;
  shortcutsContainer.innerHTML = '';

  const visibleDefinitions = SHORTCUT_DEFINITIONS.filter(
    (def) => state!.featureToggles[def.category] && def.id !== 'toggleShortcuts'
  );

  const messageArea = document.createElement('div');
  messageArea.className = 'shortcut-message';
  shortcutsContainer.appendChild(messageArea);

  const clearMessage = () => {
    messageArea.textContent = '';
    messageArea.removeAttribute('data-type');
    shortcutsContainer
      .querySelectorAll<HTMLInputElement>('.shortcut-input-error, .shortcut-input-warning')
      .forEach((el) => {
        el.classList.remove('shortcut-input-error');
        el.classList.remove('shortcut-input-warning');
      });
  };

  const showError = (text: string) => {
    messageArea.textContent = text;
    messageArea.dataset.type = 'error';
  };

  const showWarning = (text: string) => {
    messageArea.textContent = text;
    messageArea.dataset.type = 'warning';
  };

  if (visibleDefinitions.length === 0) {
    return;
  }

  visibleDefinitions.forEach((def) => {
    const row = document.createElement('div');
    row.className = 'shortcut-row';

    const label = document.createElement('div');
    label.className = 'shortcut-label';
    label.textContent = def.label;

    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.className = 'shortcut-input';
    input.value = formatBindings(getBindingsFor(def));
    input.placeholder = 'Press keys';
    input.addEventListener(
      'keydown',
      async (event) => {
        event.preventDefault();
        const binding = eventToBinding(event);
        if (!binding) return;
        if (!state) return;

        clearMessage();

        const validation = validateBinding(binding);
        if (!validation.valid) {
          const messageKey =
            validation.reason === 'requires_modifier'
              ? 'error_shortcut_requires_modifier'
              : 'error_shortcut_forbidden_key';
          showError(getMessage(messageKey, [formatBinding(binding)]));
          input.classList.add('shortcut-input-error');
          return;
        }

        // 1. Check for duplicate shortcut among user-defined shortcuts (error)
        const conflict = findConflictingShortcut(binding, def.id);
        if (conflict) {
          showError(
            `"${formatBinding(binding)}" is already assigned to "${conflict.label}". Please select a different key.`
          );
          input.classList.add('shortcut-input-error');
          return; // Don't save on error
        }

        // 2. Check for conflict with Gemini default shortcuts (warning)
        const geminiConflict = findGeminiDefaultConflict(binding);
        if (geminiConflict) {
          showWarning(
            `"${formatBinding(binding)}" conflicts with Gemini's default "${geminiConflict.label}" shortcut. The default may not work as expected.`
          );
          input.classList.add('shortcut-input-warning');
          // Continue saving even on warning
        }

        // 3. Save processing
        state.shortcuts[def.id] = [binding];
        input.value = formatBindings([binding]);
        await saveSettings({ shortcuts: { [def.id]: [binding] } });
      },
      NON_PASSIVE_KEYDOWN_OPTIONS
    );

    row.appendChild(label);
    row.appendChild(input);
    shortcutsContainer.appendChild(row);
  });
}

async function init() {
  state = await loadSettings();
  renderFeatureToggles();
  renderShortcuts();

  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      state = {
        featureToggles: { ...DEFAULT_FEATURE_TOGGLES },
        shortcuts: { ...DEFAULT_SHORTCUTS },
      };
      await saveSettings({
        featureToggles: { ...DEFAULT_FEATURE_TOGGLES },
        shortcuts: { ...DEFAULT_SHORTCUTS },
      });
      renderFeatureToggles();
      renderShortcuts();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
