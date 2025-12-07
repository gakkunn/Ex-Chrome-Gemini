import { BRIDGE_MESSAGE, postBridgeMessage } from '@/shared/messaging';
import { GEMINI_DEFAULT_SHORTCUTS, SHORTCUT_DEFINITIONS } from '@/shared/shortcuts';
import { getMessage } from '@/shared/i18n';
import {
  getAltLabel,
  getKeyLabel,
  getModLabel,
  isMacPlatform,
  normalizeBindingForPlatform,
} from '@/shared/keyboard';

import { handleEnterKey } from '../features/ctrl-enter-send';
import { handleDeleteChatShortcut } from '../features/chat-delete';
import { handleUploadShortcut } from '../features/file-upload';
import { toggleFocus } from '../features/focus-management';
import { handleModelSwitch, MODEL_SELECTORS } from '../features/model-switch';
import {
  closeShortcutsDialog,
  isShortcutsDialogVisible,
  showShortcutsDialog,
} from '../features/shortcuts-dialog';
import { handlePinChatShortcut, handleTemporaryChatShortcut } from '../features/pin-chat';
import {
  getScrollingKey,
  handleVimScroll,
  setScrollingKey,
  stopContinuousScroll,
} from '../features/vim-scroll';

import type { ShortcutSection } from '../features/shortcuts-dialog';
import type { FeatureCategory } from '@/shared/feature-flags';
import type { ExtensionSettings } from '@/shared/settings';
import type { KeyBinding, ShortcutId } from '@/shared/shortcuts';

const KEYDOWN_CAPTURE_OPTIONS: AddEventListenerOptions = {
  capture: true,
  passive: false,
};

export class ShortcutsManager {
  private settings: ExtensionSettings;
  private defaultShortcutMap: Map<ShortcutId, KeyBinding[]>;

  constructor(settings: ExtensionSettings) {
    this.settings = settings;
    this.defaultShortcutMap = new Map(
      SHORTCUT_DEFINITIONS.map((def) => [def.id, def.defaultBindings])
    );
    this.bindKeys();
  }

  public updateSettings(settings: ExtensionSettings) {
    this.settings = settings;
    if (!this.isEnabled('vimScroll')) {
      stopContinuousScroll();
    }
    if (isShortcutsDialogVisible()) {
      this.showShortcutsPanel();
    }
  }

  private isEnabled(category: FeatureCategory): boolean {
    return !!this.settings.featureToggles[category];
  }

  private getBindings(id: ShortcutId): KeyBinding[] {
    const hasCustomValue = Object.prototype.hasOwnProperty.call(this.settings.shortcuts, id);
    if (hasCustomValue) {
      const value = this.settings.shortcuts[id];
      if (Array.isArray(value)) {
        return value;
      }
    }
    return this.defaultShortcutMap.get(id) || [];
  }

  private matchesShortcut(id: ShortcutId, e: KeyboardEvent): boolean {
    const bindings = this.getBindings(id);
    return bindings.some((binding) => this.matchesBinding(binding, e));
  }

  private bindingsEqual(a: KeyBinding, b: KeyBinding): boolean {
    const isMac = isMacPlatform();
    const na = normalizeBindingForPlatform(a, isMac);
    const nb = normalizeBindingForPlatform(b, isMac);
    const modifiersMatch =
      na.mod === nb.mod &&
      na.meta === nb.meta &&
      na.ctrl === nb.ctrl &&
      na.shift === nb.shift &&
      na.alt === nb.alt;
    const keyMatch = a.key.toLowerCase() === b.key.toLowerCase();
    const codeMatch = a.code && b.code ? a.code === b.code : false;
    return modifiersMatch && (keyMatch || codeMatch);
  }

  private hasCustomBinding(id: ShortcutId): boolean {
    const current = this.settings.shortcuts[id];
    const defaults = this.defaultShortcutMap.get(id) || [];
    if (!current || !Array.isArray(current) || current.length === 0) return false;
    if (current.length !== defaults.length) return true;
    return current.some((binding, idx) => {
      const def = defaults[idx];
      if (!def) return true;
      return !this.bindingsEqual(binding, def);
    });
  }

  private matchesBinding(binding: KeyBinding, e: KeyboardEvent): boolean {
    const isMac = isMacPlatform();
    const normalized = normalizeBindingForPlatform(binding, isMac);
    const modPressed = isMac ? e.metaKey : e.ctrlKey;

    if (modPressed !== normalized.mod) return false;
    if (e.metaKey !== normalized.meta) return false;
    if (e.ctrlKey !== normalized.ctrl) return false;
    if (e.shiftKey !== normalized.shift) return false;
    if (e.altKey !== normalized.alt) return false;

    const keyMatch = e.key === binding.key || e.key.toLowerCase() === binding.key.toLowerCase();
    const codeMatch = binding.code ? e.code === binding.code : false;

    return keyMatch || codeMatch;
  }

  private bindKeys() {
    document.addEventListener('keyup', (e) => {
      if (e.key === getScrollingKey()) {
        stopContinuousScroll();
        setScrollingKey(null);
      }
    });

    document.addEventListener('keydown', (e) => this.handleKeydown(e), KEYDOWN_CAPTURE_OPTIONS);
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.isEnabled('safeSend') && handleEnterKey(e)) {
      return;
    }

    if (this.isEnabled('vimScroll')) {
      if (this.matchesShortcut('scrollTop', e) && handleVimScroll(e, 'top')) return;
      if (this.matchesShortcut('scrollBottom', e) && handleVimScroll(e, 'bottom')) return;
      if (this.matchesShortcut('scrollHalfUp', e) && handleVimScroll(e, 'halfUp')) return;
      if (this.matchesShortcut('scrollHalfDown', e) && handleVimScroll(e, 'halfDown')) return;
      if (this.matchesShortcut('scrollUp', e) && handleVimScroll(e, 'up')) return;
      if (this.matchesShortcut('scrollDown', e) && handleVimScroll(e, 'down')) return;
    }

    if (this.isEnabled('wideScreen') && this.matchesShortcut('toggleFocus', e)) {
      e.preventDefault();
      toggleFocus();
      return;
    }

    if (this.matchesShortcut('toggleShortcuts', e)) {
      e.preventDefault();
      e.stopPropagation();
      if (isShortcutsDialogVisible()) {
        closeShortcutsDialog();
      } else {
        this.showShortcutsPanel();
      }
      return;
    }

    if (!this.isEnabled('otherShortcuts')) return;

    if (this.hasCustomBinding('uploadFiles') && this.matchesShortcut('uploadFiles', e)) {
      handleUploadShortcut(e);
      return;
    }

    if (this.hasCustomBinding('pinChat') && this.matchesShortcut('pinChat', e)) {
      handlePinChatShortcut(e);
      return;
    }

    if (this.hasCustomBinding('temporaryChat') && this.matchesShortcut('temporaryChat', e)) {
      handleTemporaryChatShortcut(e);
      return;
    }

    if (this.hasCustomBinding('deleteChat') && this.matchesShortcut('deleteChat', e)) {
      handleDeleteChatShortcut(e);
      return;
    }

    if (this.matchesShortcut('toggleModel', e)) {
      e.preventDefault();
      handleModelSwitch(null);
      return;
    }

    if (this.matchesShortcut('modeInstant', e)) {
      e.preventDefault();
      handleModelSwitch(MODEL_SELECTORS.OPTION_FAST);
      return;
    }

    if (this.matchesShortcut('modeThinking', e)) {
      e.preventDefault();
      handleModelSwitch(MODEL_SELECTORS.OPTION_THINKING);
      return;
    }
  }

  private bindingToTokens(binding: KeyBinding): string[] {
    const isMac = isMacPlatform();
    const normalized = normalizeBindingForPlatform(binding, isMac);
    const tokens: string[] = [];
    if (normalized.mod) {
      tokens.push(getModLabel({ useSymbol: true, isMac }));
    } else {
      if (normalized.meta) tokens.push(getModLabel({ useSymbol: true, isMac: true }));
      if (normalized.ctrl) tokens.push('Ctrl');
    }
    if (normalized.alt) tokens.push(getAltLabel({ useSymbol: true, isMac }));
    if (normalized.shift) tokens.push(isMac ? '⇧' : 'Shift');
    tokens.push(getKeyLabel({ key: binding.key, code: binding.code }, { isMac }));
    return tokens;
  }

  private getDisplayBindings(def: {
    id: ShortcutId;
    defaultBindings: KeyBinding[];
    category: FeatureCategory;
  }): string[][] {
    const enabled = def.id === 'toggleShortcuts' ? true : this.isEnabled(def.category);
    if (!enabled) return [];

    let bindings = this.settings.shortcuts[def.id];
    if (!bindings || !Array.isArray(bindings)) {
      bindings = def.defaultBindings;
    }

    return bindings.map((b) => this.bindingToTokens(b));
  }

  private showShortcutsPanel() {
    const sectionTitles = {
      geminiDefaults: getMessage('shortcuts_section_gemini_defaults'),
      settings: getMessage('shortcuts_section_settings'),
      vim: getMessage('shortcuts_section_vim_scroll'),
      wide: getMessage('shortcuts_section_wide_screen'),
      model: getMessage('shortcuts_section_model_switching'),
      other: getMessage('shortcuts_section_other'),
    };

    const sections: ShortcutSection[] = [
      {
        section: sectionTitles.geminiDefaults,
        items: GEMINI_DEFAULT_SHORTCUTS.map((shortcut) => ({
          label: shortcut.label,
          combos: [this.bindingToTokens(shortcut)],
        })),
      },
      {
        section: sectionTitles.settings,
        items: [
          {
            label: getMessage('shortcuts_item_open_settings'),
            actionLabel: getMessage('shortcuts_action_open_settings_link'),
            action: () => {
              postBridgeMessage(BRIDGE_MESSAGE.OPEN_SETTINGS, undefined);
            },
          },
        ],
      },
    ];

    const ensureSection = (sectionName: string): ShortcutSection => {
      let section = sections.find((s) => s.section === sectionName);
      if (!section) {
        section = { section: sectionName, items: [] };
        sections.push(section);
      }
      return section;
    };

    const addDefinition = (sectionName: string, id: ShortcutId) => {
      const def = SHORTCUT_DEFINITIONS.find((d) => d.id === id);
      if (!def) return;
      const combos = this.getDisplayBindings(def);
      if (combos.length === 0) return;
      const section = ensureSection(sectionName);
      section.items.push({ label: def.label, combos });
    };

    if (this.isEnabled('vimScroll')) {
      addDefinition(sectionTitles.vim, 'scrollUp');
      addDefinition(sectionTitles.vim, 'scrollDown');
      addDefinition(sectionTitles.vim, 'scrollTop');
      addDefinition(sectionTitles.vim, 'scrollBottom');
      addDefinition(sectionTitles.vim, 'scrollHalfUp');
      addDefinition(sectionTitles.vim, 'scrollHalfDown');
    }

    if (this.isEnabled('wideScreen')) {
      addDefinition(sectionTitles.wide, 'toggleFocus');
    }

    if (this.isEnabled('otherShortcuts')) {
      addDefinition(sectionTitles.model, 'toggleModel');
      addDefinition(sectionTitles.model, 'modeInstant');
      addDefinition(sectionTitles.model, 'modeThinking');
      addDefinition(sectionTitles.other, 'temporaryChat');
      addDefinition(sectionTitles.other, 'deleteChat');
      addDefinition(sectionTitles.other, 'uploadFiles');
      addDefinition(sectionTitles.other, 'pinChat');
    }

    addDefinition(sectionTitles.geminiDefaults, 'toggleShortcuts');

    showShortcutsDialog(sections);
  }
}
