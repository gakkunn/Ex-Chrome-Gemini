import { defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest(() => ({
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_ext_name__',
  short_name: '__MSG_ext_short_name__',
  version: '1.4.1',
  description: '__MSG_ext_description__',
  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '64': 'icons/icon-64.png',
    '96': 'icons/icon-96.png',
    '128': 'icons/icon-128.png',
  },
  permissions: ['storage'],
  action: {
    default_popup: 'src/popup/index.html',
    default_title: '__MSG_ext_name__',
  },
  commands: {
    reload_extension_dev: {
      suggested_key: {
        default: 'Ctrl+Shift+R',
        mac: 'Command+Shift+R',
      },
      description: 'Reload the extension during development',
    },
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://gemini.google.com/*'],
      js: ['src/content/viewport-spoof-main.ts'],
      run_at: 'document_start',
      world: 'MAIN',
    },
    {
      matches: ['https://gemini.google.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_start',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['src/inject/index.ts', 'assets/*'],
      matches: ['https://gemini.google.com/*'],
    },
  ],
}));

export default manifest;
