import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

import pluginNext from "@next/eslint-plugin-next";

const eslintConfig = [
  // Enable JSX syntax for JavaScript files so ESLint parses React components in .js
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext, // ✅ keep Next.js plugin so Next.js detects it
    },
    rules: {
      // ✅ disable all Next.js rules
      ...Object.fromEntries(
        Object.keys(pluginNext.rules).map((rule) => [
          `@next/next/${rule}`,
          "off",
        ])
      ),
    },
  },
];

export default eslintConfig;

