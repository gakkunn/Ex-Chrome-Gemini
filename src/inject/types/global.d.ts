/**
 * Global type definitions for the Gemini extension
 */

interface Utils {
  sleep: (ms: number) => Promise<void>;
  isVisible: (el: HTMLElement | null | undefined) => boolean;
  click: (el: HTMLElement | null) => void;
  waitForElement: (
    selector: string,
    options?: {
      root?: Document | HTMLElement;
      timeout?: number;
      mustBeVisible?: boolean;
    }
  ) => Promise<HTMLElement>;
  waitForRemoval: (el: HTMLElement | null, options?: { timeout?: number }) => Promise<void>;
  showToast: (message: string, type?: 'error' | 'warning' | 'success', duration?: number) => void;
}

interface Window {
  __gxt_utils?: Utils;
  __gxt_shortcutsInited?: boolean;
  __gxt_shortcutsKeybound?: boolean;
  __gxt_shortcutsToggle?: () => void;
  __gxt_bindShiftCmdS?: boolean;
  __gxt_closeSidebarAfterNewChat?: boolean;
  __gxt_deleteHotkeyBound?: boolean;
  __gxt_hotkeysBound?: boolean;
  __gxtModelSwitchBound?: boolean;
  __gxt_ctrlEnterSendBound?: boolean;
  __gxt_vimScrollBound?: boolean;
  __gxtUploadHotkeyOff?: () => void;
  __gxtDoUpload?: () => Promise<void>;
  gxtNewChatFix?: {
    closeNow: () => void;
  };
  gxtDeleteChat?: {
    showDialog: () => Promise<void>;
    runOnce: () => Promise<void>;
  };
  gxtHotkeys?: {
    pinOnce: () => Promise<void>;
    tempOnce: () => Promise<void>;
  };
}
