import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Browser/Extension code (src/)
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        performance: "readonly",
        HTMLElement: "readonly",
        Element: "readonly",
        Node: "readonly",
        Event: "readonly",
        KeyboardEvent: "readonly",
        MouseEvent: "readonly",
        FocusEvent: "readonly",
        MutationObserver: "readonly",
        AbortController: "readonly",
        // Chrome extension globals
        chrome: "readonly",
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["tsconfig.json"],
        },
        node: true,
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
    },
    rules: {
      "import/no-unresolved": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      // Disallow Node.js built-in modules in browser code
      "no-restricted-imports": [
        "error",
        {
          patterns: ["fs", "path", "child_process", "os", "crypto", "node:*"],
        },
      ],
    },
  },
  // Node.js code (config files, build scripts)
  {
    files: ["*.config.{ts,mjs,js}", "config/**/*.{ts,mjs}"],
    languageOptions: {
      globals: {
        // Node.js globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        console: "readonly",
        module: "readonly",
        require: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },
  // Feature files special rules (allow empty catch blocks, unused vars for event handlers)
  {
    files: ["src/inject/features/**/*.ts"],
    rules: {
      "no-empty": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  prettier
);
