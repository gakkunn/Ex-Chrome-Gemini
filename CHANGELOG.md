# Changelog

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
