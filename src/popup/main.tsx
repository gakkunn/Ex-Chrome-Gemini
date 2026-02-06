import { render } from 'preact';
import type { JSX } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { DEFAULT_FEATURE_TOGGLES, type FeatureCategory } from '@/shared/feature-flags';
import {
  DEFAULT_SHORTCUTS,
  GEMINI_DEFAULT_SHORTCUTS,
  SHORTCUT_DEFINITIONS,
  type GeminiDefaultShortcut,
  type KeyBinding,
  type ShortcutDefinition,
  type ShortcutId,
} from '@/shared/shortcuts';
import { getMessage, type I18nKey } from '@/shared/i18n';
import {
  getAltLabel,
  getKeyLabel,
  getModLabel,
  isMacPlatform,
  isModKey,
  normalizeBindingForPlatform,
  validateBinding,
} from '@/shared/keyboard';
import type { ExtensionSettings } from '@/shared/settings';
import { loadSettings, saveSettings } from '@/shared/storage';
import './style.css';

const GITHUB_URL = 'https://github.com/gakkunn/Ex-Chrome-Gemini';
const SUPPORT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf8hOHRBnTAKJni5cuEanlfeBabM4xkFCP9Tp_YVuBTXCeOeg/viewform';
const COFFEE_URL = 'https://www.buymeacoffee.com/gakkunn';
const REVIEW_URL =
  'https://chromewebstore.google.com/detail/gemini-shortcut-effective/ignpkjaahmegdgnbmnpakehoekaligmm/reviews?hl=en&authuser=0';
const ICON_GITHUB_SRC = '/img/github.svg';
const ICON_SUPPORT_SRC = '/img/support.svg';
const ICON_COFFEE_SRC = '/img/coffee.svg';
const ICON_REVIEW_SRC = '/img/review.svg';

const featureLabelKeys: Record<FeatureCategory, I18nKey> = {
  vimScroll: 'popup_toggle_label_vim_scroll',
  keepDesktopUI: 'popup_toggle_label_keep_desktop_ui',
  wideScreen: 'popup_toggle_label_wide_screen',
  safeSend: 'popup_toggle_label_safe_send',
  otherShortcuts: 'popup_toggle_label_other_shortcuts',
};

const orderedCategories: FeatureCategory[] = [
  'keepDesktopUI',
  'vimScroll',
  'wideScreen',
  'safeSend',
  'otherShortcuts',
];

type ShortcutState = 'idle' | 'error' | 'warning' | 'success';

type StatusMessage = {
  type: 'error' | 'warning' | 'success';
  text: string;
} | null;

function formatBinding(binding: KeyBinding): string {
  const isMac = isMacPlatform();
  const normalized = normalizeBindingForPlatform(binding, isMac);
  const parts: string[] = [];
  if (normalized.mod) {
    parts.push(getModLabel({ isMac, useSymbol: true }));
  } else {
    if (normalized.meta) parts.push(getModLabel({ isMac: true, useSymbol: true }));
    if (normalized.ctrl) parts.push(getMessage('keyboard_label_ctrl'));
  }
  if (normalized.alt) parts.push(getAltLabel({ isMac, useSymbol: true }));
  if (normalized.shift) parts.push(isMac ? '⇧' : getMessage('keyboard_label_shift'));
  const keyLabel = getKeyLabel({ key: binding.key, code: binding.code }, { isMac });
  parts.push(keyLabel === 'Space' ? getMessage('keyboard_label_space') : keyLabel);
  return parts.join(' + ');
}

function getFeatureLabel(category: FeatureCategory): string {
  return getMessage(featureLabelKeys[category]);
}

function eventToBinding(event: KeyboardEvent): KeyBinding | null {
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return null;
  const key = event.key === 'Spacebar' ? ' ' : event.key;
  return {
    key,
    code: event.code,
    mod: isModKey(event),
    meta: event.metaKey,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}

function bindingsMatch(a: KeyBinding, b: KeyBinding): boolean {
  const isMac = isMacPlatform();
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

function getBindingsFor(definition: ShortcutDefinition, settings: ExtensionSettings): KeyBinding[] {
  const value = settings.shortcuts[definition.id];
  if (Array.isArray(value) && value.length) return value;
  return definition.defaultBindings;
}

function findConflictingShortcut(
  binding: KeyBinding,
  currentId: ShortcutId,
  settings: ExtensionSettings
): ShortcutDefinition | null {
  return (
    SHORTCUT_DEFINITIONS.find((definition) => {
      if (definition.id === currentId) return false;
      if (!settings.featureToggles[definition.category]) return false;
      return getBindingsFor(definition, settings).some((existing) =>
        bindingsMatch(existing, binding)
      );
    }) || null
  );
}

function findGeminiDefaultConflict(binding: KeyBinding): GeminiDefaultShortcut | null {
  return GEMINI_DEFAULT_SHORTCUTS.find((shortcut) => bindingsMatch(shortcut, binding)) || null;
}

interface ShortcutRowProps {
  definition: ShortcutDefinition;
  bindings: KeyBinding[];
  disabled: boolean;
  onSave: (binding: KeyBinding) => Promise<ShortcutState>;
}

const renderBindingKeycaps = (bindings: KeyBinding[]) => {
  const elements: JSX.Element[] = [];
  bindings.forEach((binding, bindingIndex) => {
    const tokens = formatBinding(binding).split(' + ');
    elements.push(
      <div class="shortcut-keycap-group" key={`${binding.code || binding.key}-${bindingIndex}`}>
        {tokens.map((token, tokenIndex) => (
          <span class="shortcut-keycap-wrapper" key={`${token}-${tokenIndex}`}>
            <kbd class="chatgpt-unified-keycap">
              <span class="chatgpt-unified-keycap-label">{token}</span>
            </kbd>
            {!isMacPlatform() && tokenIndex < tokens.length - 1 && (
              <span class="chatgpt-unified-keycap-sep">+</span>
            )}
          </span>
        ))}
      </div>
    );

    if (bindingIndex < bindings.length - 1) {
      elements.push(
        <span
          class="shortcut-binding-sep"
          key={`sep-${binding.code || binding.key}-${bindingIndex}`}
        >
          /
        </span>
      );
    }
  });
  return elements;
};

const ShortcutRow = ({ definition, bindings, disabled, onSave }: ShortcutRowProps) => {
  const [state, setState] = useState<ShortcutState>('idle');

  useEffect(() => {
    setState('idle');
  }, [bindings]);

  const handleKeyDown = async (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const binding = eventToBinding(event as unknown as KeyboardEvent);
    if (!binding) return;
    const result = await onSave(binding);
    setState(result);
  };

  return (
    <div class="shortcut-row">
      <div class="shortcut-label">
        <p class="shortcut-label-text">
          {definition.label}
          {definition.id === 'shareConversation' && <span class="toggle-badge">new</span>}
        </p>
      </div>
      <div
        class={[
          'shortcut-input',
          state === 'error' ? 'shortcut-input-error' : '',
          state === 'warning' ? 'shortcut-input-warning' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="textbox"
        tabIndex={disabled ? -1 : 0}
        aria-label={definition.label}
        onClick={(event) => event.currentTarget.focus()}
        onKeyDown={disabled ? undefined : handleKeyDown}
      >
        <div class="shortcut-keycaps">
          {bindings.length ? (
            renderBindingKeycaps(bindings)
          ) : (
            <span class="shortcut-placeholder">{getMessage('popup_shortcut_placeholder')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const PopupApp = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const keepDesktopTooltip = getMessage('popup_toggle_keep_desktop_ui_tooltip');

  useEffect(() => {
    loadSettings()
      .then((loaded) => {
        setSettings(loaded);
      })
      .catch(() => {
        setStatus({
          type: 'error',
          text: getMessage('popup_load_error'),
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = useCallback(
    async (category: FeatureCategory, checked: boolean) => {
      if (!settings) return;
      const next: ExtensionSettings = {
        ...settings,
        featureToggles: {
          ...settings.featureToggles,
          [category]: checked,
        },
      };
      setSettings(next);
      try {
        await saveSettings({ featureToggles: next.featureToggles });
        setStatus({
          type: 'success',
          text: getMessage(
            checked ? 'popup_toggle_enable_success' : 'popup_toggle_disable_success',
            [getFeatureLabel(category)]
          ),
        });
      } catch (error) {
        console.error(error);
        setStatus({
          type: 'error',
          text: getMessage('popup_toggle_save_error'),
        });
      }
    },
    [settings]
  );

  const handleShortcutSave = useCallback(
    (definition: ShortcutDefinition) =>
      async (binding: KeyBinding): Promise<ShortcutState> => {
        if (!settings) return 'error';

        const validation = validateBinding(binding);
        if (!validation.valid) {
          const messageKey =
            validation.reason === 'requires_modifier'
              ? 'error_shortcut_requires_modifier'
              : 'error_shortcut_forbidden_key';
          setStatus({
            type: 'error',
            text: getMessage(messageKey, [formatBinding(binding)]),
          });
          return 'error';
        }

        const conflict = findConflictingShortcut(binding, definition.id, settings);
        if (conflict) {
          setStatus({
            type: 'error',
            text: getMessage('popup_shortcut_conflict_user', [
              formatBinding(binding),
              conflict.label,
            ]),
          });
          return 'error';
        }

        const geminiConflict = findGeminiDefaultConflict(binding);
        const next: ExtensionSettings = {
          ...settings,
          shortcuts: {
            ...settings.shortcuts,
            [definition.id]: [binding],
          },
        };

        setSettings(next);

        try {
          await saveSettings({ shortcuts: { [definition.id]: [binding] } });
          if (geminiConflict) {
            setStatus({
              type: 'warning',
              text: getMessage('popup_shortcut_conflict_gemini', [
                formatBinding(binding),
                geminiConflict.label,
              ]),
            });
            return 'warning';
          }

          setStatus({
            type: 'success',
            text: getMessage('popup_shortcut_success', [definition.label]),
          });
          return 'success';
        } catch (error) {
          console.error(error);
          setStatus({
            type: 'error',
            text: getMessage('popup_shortcut_error'),
          });
          return 'error';
        }
      },
    [settings]
  );

  const handleReset = useCallback(async () => {
    setIsResetting(true);
    const next: ExtensionSettings = {
      featureToggles: { ...DEFAULT_FEATURE_TOGGLES },
      shortcuts: { ...DEFAULT_SHORTCUTS },
    };

    setSettings(next);

    try {
      await saveSettings(next);
      setStatus({
        type: 'success',
        text: getMessage('popup_reset_success'),
      });
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        text: getMessage('popup_reset_error'),
      });
    } finally {
      setIsResetting(false);
    }
  }, []);

  const visibleDefinitions = useMemo(() => {
    if (!settings) return [];
    return SHORTCUT_DEFINITIONS.filter(
      (definition) =>
        definition.id !== 'toggleShortcuts' && settings.featureToggles[definition.category]
    );
  }, [settings]);

  return (
    <div class="popup-wrapper">
      <header class="header-row">
        <div>
          <h1>{getMessage('ext_short_name')}</h1>
        </div>
        <button class="reset-button" type="button" onClick={handleReset} disabled={isResetting}>
          {isResetting ? getMessage('popup_resetting') : getMessage('popup_reset_button')}
        </button>
      </header>

      <footer class="popup-footer">
        <p class="footer-message">{getMessage('popup_footer_review_prompt')}</p>
        <section class="links">
          <div>
            <a
              class="footer-button github-button"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Contribute"
            >
              <span>
                <img class="icon" src={ICON_GITHUB_SRC} alt="Contribute" />
              </span>
            </a>
          </div>
          <div>
            <a
              class="footer-button question-button"
              href={SUPPORT_FORM_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Support"
            >
              <span>
                <img class="icon" src={ICON_SUPPORT_SRC} alt="Report a problem" />
              </span>
            </a>
          </div>
          <div>
            <a
              class="footer-button review-button"
              href={REVIEW_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Review"
            >
              <span>
                <img class="icon" src={ICON_REVIEW_SRC} alt="Review" />
              </span>
            </a>
          </div>
          <div>
            <a
              class="footer-button coffee-button"
              href={COFFEE_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Buy me a coffee"
            >
              <span>
                <img class="icon" src={ICON_COFFEE_SRC} alt="Buy me a coffee" />
              </span>
            </a>
          </div>
        </section>
      </footer>

      {isLoading && <p class="helper-text">{getMessage('popup_loading')}</p>}

      {!isLoading && !settings && (
        <p class="helper-text">{getMessage('popup_settings_unavailable')}</p>
      )}

      {!isLoading && settings && (
        <>
          <section class="card">
            <h2>{getMessage('popup_section_feature_toggles')}</h2>
            <div class="toggle-list">
              {orderedCategories.map((category) => (
                <label class="toggle" key={category}>
                  <input
                    type="checkbox"
                    checked={!!settings.featureToggles[category]}
                    onChange={(event) => handleToggle(category, event.currentTarget.checked)}
                  />
                  <span
                    class={[
                      'toggle-label',
                      category === 'keepDesktopUI' ? 'toggle-label-with-tooltip' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-tooltip={category === 'keepDesktopUI' ? keepDesktopTooltip : undefined}
                  >
                    {getFeatureLabel(category)}
                    {category === 'keepDesktopUI' && <span class="toggle-badge">new</span>}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section class="card">
            <h2>{getMessage('popup_section_shortcuts')}</h2>
            <div
              class="shortcut-message"
              data-status={status?.type ?? ''}
              aria-live="polite"
              role="status"
            >
              {status?.text ?? ''}
            </div>

            {visibleDefinitions.length === 0 && (
              <p class="helper-text">{getMessage('popup_shortcut_empty_state')}</p>
            )}

            {visibleDefinitions.map((definition) => (
              <ShortcutRow
                key={definition.id}
                definition={definition}
                bindings={getBindingsFor(definition, settings)}
                disabled={false}
                onSave={handleShortcutSave(definition)}
              />
            ))}
          </section>
        </>
      )}

    </div>
  );
};

// Set document title and lang dynamically (HTML doesn't support __MSG_*__ placeholders)
document.title = getMessage('ext_name');
document.documentElement.lang = getMessage('html_lang');

const container = document.getElementById('app');
if (container) {
  render(<PopupApp />, container);
}
