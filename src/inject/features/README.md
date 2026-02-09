# Gemini Extension Features

This directory contains 11 modular feature implementations for the Gemini Shortcut Effective Extension. Each feature is self-contained with proper TypeScript types and exports a single initialization function.

## Feature Modules

### 1. Focus Management (`focus-management.ts`) - 121 lines

**Hotkey:** `Shift + Space`

- Focus management for input field with IME-friendly Shift+Space toggle
- Handles history navigation (pushState, replaceState, popstate)
- Double requestAnimationFrame for proper focus timing
- Prevents IME mode issues when toggling focus

### 2. Shortcuts Dialog (`shortcuts-dialog.ts`) - 308 lines

**Hotkey:** `Cmd/Ctrl + /`

- Modal dialog showing all keyboard shortcuts
- Displays keyboard shortcuts with proper keyboard key styling
- Dark mode support
- Accessible with ARIA attributes

### 3. Sidebar Toggle (`sidebar.ts`) - 24 lines

**Hotkey:** `Shift + Cmd/Ctrl + S`

- Simple sidebar toggle functionality
- Works even when input fields are focused
- Only skips during IME composition

### 4. New Chat Close Sidebar (`new-chat-close-sidebar.ts`) - 32 lines

**Hotkey:** `Shift + Cmd/Ctrl + O` (hooks into existing new chat)

- Automatically closes sidebar after creating new chat
- Multiple retry attempts for reliability (120ms, 300ms, 800ms, 1600ms)
- Exposes `gxtNewChatFix.closeNow()` API

### 5. Chat Delete (`chat-delete.ts`) - 283 lines

**Hotkey:** `Shift + Cmd/Ctrl + Backspace`

- Delete current chat with confirmation dialog
- Custom modal dialog with keyboard navigation (Enter/Escape)
- Opens sidebar, finds selected chat, triggers delete action
- Comprehensive error handling and toast notifications
- Exposes `gxtDeleteChat.showDialog()` and `gxtDeleteChat.runOnce()` APIs

### 6. File Upload (`file-upload.ts`) - 190 lines

**Hotkey:** `Cmd/Ctrl + U` (optional: `Cmd/Ctrl + Shift + U`)

- Opens file upload menu
- Pointer event simulation for reliable clicking
- Cooldown mechanism to prevent double-triggering (1200ms)
- Busy state management with timeout (6000ms)
- Exposes `__gxtUploadHotkeyOff()` and `__gxtDoUpload()` APIs

### 7. Pin Chat (`pin-chat.ts`) - 181 lines

**Hotkey:** `Cmd/Ctrl + Shift + P`, `Cmd/Ctrl + I` (temporary chat)

- Pin current chat to top of sidebar
- Open temporary/incognito chat
- Platform-specific hotkey handling
- Exposes `gxtHotkeys.pinOnce()` and `gxtHotkeys.tempOnce()` APIs

### 8. Model Switch (`model-switch.ts`) - 177 lines

**Hotkeys:**

- `Cmd/Ctrl + Shift + ↓` - Toggle model menu
- `Cmd+Shift+0` (macOS) / `Ctrl+Shift+7` (Windows) - Switch to Fast Mode
- `Cmd/Ctrl + Shift + 8` - Switch to Thinking Mode
- `Cmd/Ctrl + Shift + 9` - Switch to Pro Mode
- Strong pointer event simulation for menu interaction
- Waits for menu animation completion
- Returns focus to input field after switching

### 9. Ctrl+Enter to Send (`ctrl-enter-send.ts`) - 109 lines

**Hotkey:** `Ctrl + Enter` (Win/Linux) / `Cmd + Enter` or `Ctrl + Enter` (Mac)

- Requires Ctrl+Enter on Win/Linux or Cmd/Ctrl+Enter on Mac to send messages
- Plain Enter inserts newline (does not send)
- Shift+Enter behaves natively to avoid IME issues
- IME composition tracking for reliable behavior
- Platform-specific send key detection

### 10. Vim Scroll (`vim-scroll.ts`) - 262 lines

**Hotkeys:**

- `j` / `k` - Scroll down/up (small steps, 60px)
- `Shift + J` / `Shift + K` - Half page scroll
- `Cmd/Ctrl + J` / `Cmd/Ctrl + K` - Jump to bottom/top
- Continuous scrolling when holding keys
- Smooth easing animation with `easeInOutQuad`
- Different animation durations for different actions
- Detects scrollable container intelligently

### 11. Copy Last User Message (`copy-last-user-message.ts`) - 74 lines

**Hotkey:** `Cmd/Ctrl + Shift + Y`

- Finds the latest user turn's `Copy prompt` button in chat history
- Triggers Gemini's built-in copy action via pointer/mouse click sequence
- Shows success/error toast notifications

## Architecture

### Initialization Pattern

Each feature exports a single initialization function:

```typescript
export function initialize<FeatureName>(): void;
```

### Type Safety

- All features use proper TypeScript types
- No `any` types
- Function parameters and return types are explicitly typed
- Global window extensions defined in `/src/inject/types/global.d.ts`

### Dependency on Utils

Most features depend on the shared utilities from `/src/inject/utils/common.ts`:

- `window.__gxt_utils.sleep(ms)` - Promise-based delay
- `window.__gxt_utils.isVisible(el)` - Element visibility check
- `window.__gxt_utils.click(el)` - Reliable element clicking
- `window.__gxt_utils.waitForElement(selector, options)` - Wait for DOM element
- `window.__gxt_utils.waitForRemoval(el, options)` - Wait for element removal
- `window.__gxt_utils.showToast(message, type, duration)` - Toast notifications

### Guard Flags

Each feature uses window-scoped guard flags to prevent duplicate initialization:

- `window.__gxt_bindShiftCmdS` - Sidebar toggle
- `window.__gxt_deleteHotkeyBound` - Chat delete
- `window.__gxt_hotkeysBound` - Pin chat
- `window.__gxtModelSwitchBound` - Model switch
- `window.__gxt_ctrlEnterSendBound` - Ctrl+Enter send
- `window.__gxt_vimScrollBound` - Vim scroll
- etc.

## Usage

### Import All Features

```typescript
import {
  initializeFocusManagement,
  initializeShortcutsDialog,
  initializeSidebar,
  // ... other features
} from './features';
```

### Initialize in Order

```typescript
// Initialize utilities first (required by other features)
initializeUtils();

// Initialize all features
initializeFocusManagement();
initializeShortcutsDialog();
// ... etc.
```

## Migration Notes

The original `/src/inject/index.ts` (1493 lines) has been split into:

- 10 feature modules (including proper types and comments)
- 1 barrel export file (`index.ts`)
- Utilities already extracted to `/src/inject/utils/common.ts` (107 lines)

**Total:** ~1895 lines (vs original 1493 lines)
The increase is due to:

- Proper TypeScript type annotations
- Enhanced documentation comments
- Better code organization with clear module boundaries

## Testing

After migration, test each feature:

1. Focus management (Shift+Space)
2. Shortcuts dialog (Cmd+/)
3. All other hotkeys listed above

Verify:

- No console errors
- All features work independently
- No duplicate event listeners
- Proper cleanup on page navigation
