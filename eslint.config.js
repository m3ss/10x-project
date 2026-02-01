import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
  },
});

// Node.js scripts configuration
const nodeScriptsConfig = tseslint.config({
  files: ["**/*.mjs", "**/*.cjs"],
  languageOptions: {
    globals: {
      console: "readonly",
      process: "readonly",
      __dirname: "readonly",
      __filename: "readonly",
      Buffer: "readonly",
      global: "readonly",
    },
  },
  rules: {
    "no-console": "off",
  },
});

// Test files configuration
const testConfig = tseslint.config({
  files: ["tests/**/*.{ts,tsx,js,jsx}", "**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}"],
  rules: {
    "no-console": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/no-useless-constructor": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
    "react-hooks/rules-of-hooks": "off", // Playwright fixtures use "use" callback, not React hooks
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "warn",
    "react/no-unescaped-entities": "warn",
    "jsx-a11y/heading-has-content": "warn",
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.astro/**",
      "**/coverage/**",
      "src/db/database.types.ts", // Generated file
      "**/*.mjs", // Node scripts with console/process
      "src/layouts/Layout.astro", // Prettier parsing issue
      "src/pages/test-openrouter.astro", // Test page with parsing issues
    ],
  },
  baseConfig,
  nodeScriptsConfig,
  jsxA11yConfig,
  reactConfig,
  testConfig, // Apply after reactConfig to override react-hooks rules
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier
);
