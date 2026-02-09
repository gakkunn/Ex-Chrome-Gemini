# Changelog

## 1.5.0 - 2026-02-09
### Features
- **shortcuts:** Add a Copy Last User Message hotkey (`Cmd/Ctrl + Shift + Y`)
- **inject:** Trigger Gemini's latest `Copy prompt` button with toast feedback
- **i18n:** Add copy-last-user-message label and toast keys across all locales
- **popup:** Add a Preserve Scroll Position on Send toggle
- **inject:** Preserve scroll position when sending a message
- **i18n:** Add preserve-scroll-on-send locale keys across all locales

### Documentation
- Document the Copy Last User Message shortcut

## 1.4.1 - 2026-02-06
### Fixes
- **inject:** Refine viewport spoof event handling to satisfy lint and TypeScript checks

### Chores
- **deps:** Upgrade `preact` and pin `undici` via overrides to resolve security advisories

## 1.4.0 - 2026-02-06
### Features
- **shortcuts:** Add a Share Conversation hotkey (`Cmd/Ctrl + Shift + H`)
- **i18n:** Add Share Conversation label and failure toast keys across all locales
- **popup:** Mark the Share Conversation shortcut as new in the shortcuts list

## 1.3.0 - 2026-01-22
### Features
- **inject:** Add Keep Desktop UI spoofing to prevent mobile UI on narrow viewports
- **popup:** Add Keep Desktop UI toggle help text

## 1.2.0 - 2026-01-21
### Features
- **popup:** Add a review callout (icon + button) in the popup header
- **i18n:** Add review prompt translations for all locales

### Fixes
- **inject:** Explicitly set `passive: false` on event listeners to allow `preventDefault` and suppress warnings

### Documentation
- Add Gemini input field DOM structure documentation
- Add popup layout and review footer reproduction notes

## 1.1.1 - 2026-01-04
### Features
- **model-switch:** Add Windows-specific Fast mode shortcut
- **i18n:** Update chat delete dialog message

### Documentation
- Update Fast mode shortcut documentation

## 1.1.0 - 2025-12-20
### Features
- **model-switch:** Add support for Pro model and update shortcuts
- **i18n:** Update model switching labels
- **popup:** Add footer with support links

### Fixes
- **popup:** Replace static i18n placeholders with dynamic JS
- **inject:** Allow preventDefault on passive listeners

### Performance
- **inject:** Optimize file upload triggering

### Documentation & Chores
- Update model switching shortcuts
- Align repo references to Ex-Chrome-Gemini
- Add URL to README

## 1.0.0 - 2025-12-07
- Initial release
