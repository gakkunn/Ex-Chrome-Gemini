export const I18N_KEYS = [
  'ext_name',
  'ext_short_name',
  'ext_description',
  'html_lang',
  'popup_section_feature_toggles',
  'popup_section_shortcuts',
  'popup_loading',
  'popup_load_error',
  'popup_settings_unavailable',
  'popup_toggle_label_vim_scroll',
  'popup_toggle_label_wide_screen',
  'popup_toggle_label_safe_send',
  'popup_toggle_label_other_shortcuts',
  'popup_toggle_enable_success',
  'popup_toggle_disable_success',
  'popup_toggle_save_error',
  'popup_reset_button',
  'popup_resetting',
  'popup_reset_success',
  'popup_reset_error',
  'popup_shortcut_placeholder',
  'popup_shortcut_conflict_user',
  'popup_shortcut_conflict_gemini',
  'error_shortcut_requires_modifier',
  'error_shortcut_forbidden_key',
  'popup_shortcut_success',
  'popup_shortcut_error',
  'popup_shortcut_empty_state',
  'keyboard_label_ctrl',
  'keyboard_label_cmd',
  'keyboard_label_alt',
  'keyboard_label_shift',
  'keyboard_label_space',
  'shortcuts_section_gemini_defaults',
  'shortcuts_section_settings',
  'shortcuts_section_vim_scroll',
  'shortcuts_section_wide_screen',
  'shortcuts_section_model_switching',
  'shortcuts_section_other',
  'shortcuts_item_open_settings',
  'shortcuts_action_open_settings_link',
  'shortcuts_dialog_title',
  'shortcuts_dialog_close',
  'shortcut_label_scroll_top',
  'shortcut_label_scroll_bottom',
  'shortcut_label_scroll_up',
  'shortcut_label_scroll_down',
  'shortcut_label_scroll_half_up',
  'shortcut_label_scroll_half_down',
  'shortcut_label_toggle_focus',
  'shortcut_label_toggle_model',
  'shortcut_label_mode_instant',
  'shortcut_label_mode_thinking',
  'shortcut_label_mode_pro',
  'shortcut_label_temporary_chat',
  'shortcut_label_toggle_shortcuts',
  'shortcut_label_delete_chat',
  'shortcut_label_upload_files',
  'shortcut_label_pin_chat',
  'gemini_default_shortcut_new_chat',
  'gemini_default_shortcut_search',
  'gemini_default_shortcut_toggle_sidebar',
  'toast_no_chat_selected',
  'toast_pin_failed',
  'toast_temp_chat_failed',
  'toast_delete_failed',
  'toast_send_button_missing',
  'toast_send_button_disabled',
  'toast_upload_failed',
  'toast_gem_create_failed',
  'chat_delete_dialog_title',
  'chat_delete_dialog_body_generic',
  'chat_delete_dialog_body_named',
  'chat_delete_dialog_confirm',
  'chat_delete_dialog_cancel',
] as const;

export type I18nKey = (typeof I18N_KEYS)[number];

const FALLBACK_MESSAGES: Record<I18nKey, string> = {
  ext_name: 'Gemini Shortcut Effective Extension',
  ext_short_name: 'Gemini Shortcut Extension',
  ext_description:
    'Safer send, vim-like scroll, model toggles, temporary chats, and clean UI for Gemini.',
  html_lang: 'en',
  popup_section_feature_toggles: 'Feature Toggles',
  popup_section_shortcuts: 'Shortcuts',
  popup_loading: 'Loading…',
  popup_load_error: 'Failed to load settings. Please reload the extension.',
  popup_settings_unavailable: 'Unable to load settings.',
  popup_toggle_label_vim_scroll: 'Vim-like Scroll',
  popup_toggle_label_wide_screen: 'Wide Screen (Clean UI + Focus)',
  popup_toggle_label_safe_send: 'Send with Cmd/Ctrl + Enter',
  popup_toggle_label_other_shortcuts: 'Other Shortcuts',
  popup_toggle_enable_success: '"$1" has been enabled.',
  popup_toggle_disable_success: '"$1" has been disabled.',
  popup_toggle_save_error: 'Failed to save the toggle. Please try again.',
  popup_reset_button: 'Reset',
  popup_resetting: 'Resetting…',
  popup_reset_success: 'All settings have been restored to defaults.',
  popup_reset_error: 'Failed to reset settings. Please try again.',
  popup_shortcut_placeholder: 'Press keys',
  popup_shortcut_conflict_user: '"$1" is already assigned to "$2". Please choose a different key.',
  popup_shortcut_conflict_gemini:
    '"$1" conflicts with Gemini\'s default "$2" shortcut. The default may not work as expected.',
  error_shortcut_requires_modifier: '"$1" must be combined with a modifier key.',
  error_shortcut_forbidden_key: '"$1" cannot be used as a shortcut.',
  popup_shortcut_success: 'Shortcut for "$1" has been updated.',
  popup_shortcut_error: 'Failed to save the shortcut. Please try again.',
  popup_shortcut_empty_state: 'No shortcuts are enabled. Turn on a toggle to manage shortcuts.',
  keyboard_label_ctrl: 'Ctrl',
  keyboard_label_cmd: 'Cmd',
  keyboard_label_alt: 'Alt',
  keyboard_label_shift: 'Shift',
  keyboard_label_space: 'Space',
  shortcuts_section_gemini_defaults: 'Gemini Defaults',
  shortcuts_section_settings: 'Settings',
  shortcuts_section_vim_scroll: 'Vim Scroll',
  shortcuts_section_wide_screen: 'Wide Screen',
  shortcuts_section_model_switching: 'Model Switching',
  shortcuts_section_other: 'Other',
  shortcuts_item_open_settings: 'Open Settings',
  shortcuts_action_open_settings_link: 'Open',
  shortcuts_dialog_title: 'Keyboard shortcuts',
  shortcuts_dialog_close: 'Close',
  shortcut_label_scroll_top: 'Scroll to Top',
  shortcut_label_scroll_bottom: 'Scroll to Bottom',
  shortcut_label_scroll_up: 'Scroll Up',
  shortcut_label_scroll_down: 'Scroll Down',
  shortcut_label_scroll_half_up: 'Scroll Half Page Up',
  shortcut_label_scroll_half_down: 'Scroll Half Page Down',
  shortcut_label_toggle_focus: 'Toggle Focus',
  shortcut_label_toggle_model: 'Toggle Model Selector',
  shortcut_label_mode_instant: 'Set Mode: Fast',
  shortcut_label_mode_thinking: 'Set Mode: Thinking',
  shortcut_label_mode_pro: 'Set Mode: Pro',
  shortcut_label_temporary_chat: 'Open Temporary Chat',
  shortcut_label_toggle_shortcuts: 'Toggle Shortcuts List',
  shortcut_label_delete_chat: 'Delete Chat',
  shortcut_label_upload_files: 'Upload Files',
  shortcut_label_pin_chat: 'Pin Chat',
  gemini_default_shortcut_new_chat: 'New chat',
  gemini_default_shortcut_search: 'Search',
  gemini_default_shortcut_toggle_sidebar: 'Toggle Side Bar',
  toast_no_chat_selected: 'No chat is currently selected.',
  toast_pin_failed: 'Failed to pin chat.',
  toast_temp_chat_failed: 'Could not open a temporary chat. Please reload the page.',
  toast_delete_failed: 'Failed to delete chat.',
  toast_send_button_missing: 'Send button not found.',
  toast_send_button_disabled: 'Send button is temporarily disabled. Please reload the page.',
  toast_upload_failed: 'Could not open the upload menu.',
  toast_gem_create_failed: 'Could not open Gem creation. Please reload the page.',
  chat_delete_dialog_title: 'Delete chat?',
  chat_delete_dialog_body_generic: 'This will delete the currently selected chat.',
  chat_delete_dialog_body_named:
    'This will delete prompts, responses, and feedback from your Gemini Apps Activity, plus any content you created.',
  chat_delete_dialog_confirm: 'Delete',
  chat_delete_dialog_cancel: 'Cancel',
};

export function getMessage(key: I18nKey, substitutions?: string | string[]): string {
  const substitutionList = Array.isArray(substitutions)
    ? substitutions
    : substitutions
      ? [substitutions]
      : undefined;

  if (typeof chrome !== 'undefined' && chrome.i18n?.getMessage) {
    const value = chrome.i18n.getMessage(key, substitutionList);
    if (value) {
      return value;
    }
  }

  const dictionary = typeof window !== 'undefined' ? window.__gxt_i18n : undefined;
  const template = dictionary?.[key] ?? FALLBACK_MESSAGES[key] ?? key;
  return applyFallbackSubstitutions(template, substitutionList);
}

function applyFallbackSubstitutions(template: string, substitutions?: string[]): string {
  if (!substitutions || substitutions.length === 0) {
    return template;
  }
  return substitutions.reduce(
    (acc, value, index) => acc.replace(new RegExp(`\\$${index + 1}`, 'g'), value),
    template
  );
}
