import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-app artifacts (PL-011): Python venv, QA browser profiles (contain
    // thousands of minified third-party extension files), runtime data.
    "venv/**",
    "data/**",
    "scripts/.chrome-profile*/**",
    "scripts/.shots/**",
  ]),
]);

export default eslintConfig;
