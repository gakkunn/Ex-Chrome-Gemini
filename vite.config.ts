import path from 'node:path';
import fs from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest/manifest.config';

/**
 * Plugin to copy `_locales` from the project root to `dist/_locales`.
 * - Re-copy on both build/watch to avoid relying on publicDir.
 */
function copyLocalesPlugin(): Plugin {
  const rootLocalesDir = path.resolve(__dirname, '_locales');
  const distLocalesDir = path.resolve(__dirname, 'dist/_locales');

  const copyLocales = () => {
    if (!fs.existsSync(rootLocalesDir)) {
      console.warn('[copy-locales] _locales not found, skipping.');
      return;
    }
    fs.rmSync(distLocalesDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(distLocalesDir), { recursive: true });
    fs.cpSync(rootLocalesDir, distLocalesDir, { recursive: true });
    console.log('[copy-locales] Copied _locales to dist.');
  };

  return {
    name: 'copy-locales',
    apply: 'build',
    buildStart() {
      copyLocales();
    },
    closeBundle() {
      copyLocales();
    },
  };
}

/**
 * Plugin to fix Vite 7 and @crxjs/vite-plugin compatibility.
 * Replaces inject/index.ts with a loader after build and updates
 * manifest.json web_accessible_resources.
 */
function fixInjectLoaderPlugin(): Plugin {
  return {
    name: 'fix-inject-loader',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const assetsDir = path.resolve(distDir, 'assets');
      const injectDir = path.resolve(distDir, 'src/inject');
      const injectFile = path.resolve(injectDir, 'index.js');
      const legacyInjectFile = path.resolve(injectDir, 'index.ts');
      const manifestFile = path.resolve(distDir, 'manifest.json');

      if (!fs.existsSync(assetsDir)) {
        console.warn('[fix-inject-loader] assets directory not found, skipping.');
        return;
      }

      // Find the assets/inject-*.js file
      const assets = fs.readdirSync(assetsDir);
      const injectBundle = assets.find((f) => f.startsWith('inject-') && f.endsWith('.js'));

      if (injectBundle) {
        fs.mkdirSync(injectDir, { recursive: true });
        // Generate the loader file
        const loaderContent = `import "../../assets/${injectBundle}";`;
        fs.writeFileSync(injectFile, loaderContent);
        console.log(`[fix-inject-loader] Updated ${injectFile}`);
        if (fs.existsSync(legacyInjectFile)) {
          fs.rmSync(legacyInjectFile);
        }

        // Update manifest.json web_accessible_resources
        const manifestContent = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
        if (manifestContent.web_accessible_resources?.[0]) {
          const resources = manifestContent.web_accessible_resources[0].resources;
          const loaderResourcePath = 'src/inject/index.js';
          if (!resources.includes(loaderResourcePath)) {
            resources.push(loaderResourcePath);
          }
          // Add inject-*.js and storage-*.js to resources
          const storageBundle = assets.find((f) => f.startsWith('storage-') && f.endsWith('.js'));
          if (injectBundle && !resources.includes(`assets/${injectBundle}`)) {
            resources.push(`assets/${injectBundle}`);
          }
          if (storageBundle && !resources.includes(`assets/${storageBundle}`)) {
            resources.push(`assets/${storageBundle}`);
          }
          fs.writeFileSync(manifestFile, JSON.stringify(manifestContent, null, 2));
          console.log(`[fix-inject-loader] Updated manifest.json web_accessible_resources`);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [
      preact(),
      crx({
        manifest,
      }),
      copyLocalesPlugin(),
      fixInjectLoaderPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    // Chrome extensions require relative paths
    base: '',
    build: {
      sourcemap: !isProd,
      esbuild: isProd
        ? {
            drop: ['console', 'debugger'],
          }
        : undefined,
      rollupOptions: {
        input: {
          background: path.resolve(__dirname, 'src/background/index.ts'),
          content: path.resolve(__dirname, 'src/content/index.ts'),
          inject: path.resolve(__dirname, 'src/inject/index.ts'),
          popup: path.resolve(__dirname, 'src/popup/index.html'),
        },
      },
    },
  };
});
