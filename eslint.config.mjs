import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'][value.type='Literal']",
          message: "Put classnames in a file-level styles/variants map.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] > JSXExpressionContainer > TemplateLiteral",
          message:
            "Compose predefined styles rather than inline classname templates.",
        },
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            "Use the shared tokens and class maps rather than inline styles.",
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/**",
                "@/app/**",
                "**/features/**",
                "**/app/**",
              ],
              message:
                "Shared modules cannot depend on features or app routes.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@headlessui/react",
              message: "Use a local components/ui wrapper.",
            },
          ],
          patterns: [
            {
              group: ["@/app/**", "**/app/**", "@/features/**"],
              message:
                "Compose features at the app layer. Use local relative imports within a feature.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
