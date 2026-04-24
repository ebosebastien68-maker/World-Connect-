import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import type { Linter } from "eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config: Linter.Config[] = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
  ),

  {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      // TypeScript — en avertissement pour ne pas bloquer le build
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrors: "none",
      }],
      "@typescript-eslint/consistent-type-imports": ["warn", {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/no-misused-promises": ["warn", {
        checksVoidReturn: { attributes: false },
      }],

      // React
      "react/self-closing-comp": "warn",
      "react/jsx-sort-props": "off",
      "react/display-name": "off",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",

      // Next / imports
      "import/no-duplicates": "warn",
      "import/no-default-export": "off",
      "@next/next/no-img-element": "warn",

      // Général
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "warn",
      "object-shorthand": "warn",
      "eqeqeq": ["warn", "always"],
      "no-nested-ternary": "warn",
      "no-duplicate-imports": "warn",

      // Accessibilité
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/no-autofocus": "warn",
    },
  },

  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "*.config.mjs",
      "public/**",
      "coverage/**",
    ],
  },
];

export default config;
