import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import type { Linter } from "eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config: Linter.Config[] = [
  // ─── Configs de base Next.js ──────────────────────────────────
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
  ),

  // ─── Fichiers ciblés ─────────────────────────────────────────
  {
    files: ["**/*.{ts,tsx}"],

    rules: {

      // ─── TypeScript ──────────────────────────────────────────
      "@typescript-eslint/no-explicit-any":          "error",
      "@typescript-eslint/no-unused-vars":           ["error", {
        argsIgnorePattern:  "^_",
        varsIgnorePattern:  "^_",
        caughtErrors:       "none",
      }],
      "@typescript-eslint/consistent-type-imports":  ["error", {
        prefer:              "type-imports",
        fixStyle:            "inline-type-imports",
      }],
      "@typescript-eslint/no-non-null-assertion":    "warn",
      "@typescript-eslint/no-floating-promises":     "error",
      "@typescript-eslint/await-thenable":           "error",
      "@typescript-eslint/no-misused-promises":      ["error", {
        checksVoidReturn: { attributes: false },
      }],

      // ─── React ───────────────────────────────────────────────
      "react/self-closing-comp":             "error",
      "react/jsx-sort-props":                "off",
      "react/display-name":                  "off",
      "react-hooks/rules-of-hooks":          "error",
      "react-hooks/exhaustive-deps":         "warn",

      // ─── Imports ─────────────────────────────────────────────
      "import/no-duplicates":                "error",
      "import/no-default-export":            "off",

      // ─── Général ─────────────────────────────────────────────
      "no-console":           ["warn", { allow: ["warn", "error"] }],
      "prefer-const":         "error",
      "no-var":               "error",
      "object-shorthand":     "error",
      "eqeqeq":               ["error", "always"],
      "no-nested-ternary":    "warn",
      "no-duplicate-imports": "error",

      // ─── Accessibilité ───────────────────────────────────────
      "jsx-a11y/alt-text":                   "error",
      "jsx-a11y/aria-props":                 "error",
      "jsx-a11y/aria-role":                  "error",
      "jsx-a11y/no-autofocus":               "warn",
    },
  },

  // ─── Ignorer ces chemins ──────────────────────────────────────
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
