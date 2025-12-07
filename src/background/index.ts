const RELOAD_COMMAND_ID = 'reload_extension_dev';

chrome.commands.onCommand.addListener((command) => {
  if (command === RELOAD_COMMAND_ID) {
    chrome.runtime.reload();
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'openSettings') {
    // Open popup.html in a new tab because we can't programmatically open the extension popup
    // But usually settings are in options page or just popup.
    // If the user wants to open the popup, they usually click the icon.
    // But if we want to open it from a link, we can open it as a tab.
    chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/index.html') });
  }
});
