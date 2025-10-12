import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import stylistic from '@stylistic/eslint-plugin';
import reactHooks from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@stylistic': stylistic,
      "react-hooks": reactHooks,
      // '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // ✅ Общие JS-правила логики
      eqeqeq: ['error', 'always'],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-empty-function': 'error',
      'no-duplicate-imports': ['error', { includeExports: true }],
      'no-inner-declarations': 'error',
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'require-await': 'error',
      'dot-notation': ['error', { allowPattern: '^[a-z]+(_[a-z]+)+$' }],
      camelcase: ['error', { ignoreImports: true }],
      'no-unsafe-optional-chaining': 'off',
      "react-hooks/exhaustive-deps": "warn",

      // ✅ TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-unused-vars': 'off',

      // ✅ Стилистические правила через @stylistic
      "@stylistic/array-bracket-newline": ["error", { "minItems": 3 }],
      "@stylistic/array-bracket-spacing": [
        "error",
        "always",
        {
          "objectsInArrays": false,
          "arraysInArrays": false,
        },
      ],
      "@stylistic/array-element-newline": ["error", { "minItems": 3 }],
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/block-spacing": "error",
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/computed-property-spacing": ["error", "always"],
      "@stylistic/curly-newline": ["error", "always"],
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/function-paren-newline": ["error", { "minItems": 3 }],
      "@stylistic/indent": ["error", 2],
      "@stylistic/indent-binary-ops": ["error", 2],
      "@stylistic/jsx-child-element-spacing": "error",
      "@stylistic/jsx-closing-bracket-location": ["error", "line-aligned"],
      "@stylistic/jsx-closing-tag-location": ["error", "line-aligned"],
      "@stylistic/jsx-curly-newline": [
        "error",
        {
          multiline: "require",
          singleline: "forbid",
        }
      ],
      "@stylistic/jsx-indent-props": ["error", 2],
      "@stylistic/jsx-max-props-per-line": ["error", { "maximum": 1 }],
      "@stylistic/jsx-one-expression-per-line": [
        "error",
        { "allow": "non-jsx" }
      ],
      "@stylistic/jsx-first-prop-new-line": ["error", "multiline"],
      "@stylistic/jsx-sort-props": [
        "error",
        {
          "ignoreCase": true,
          "callbacksLast": true,
          "shorthandFirst": true,
          "reservedFirst": true,
        }],
      "@stylistic/jsx-tag-spacing": [
        "error",
        {
          "beforeSelfClosing": "always"
        }
      ],
      "@stylistic/jsx-wrap-multilines": [
        "error",
        {
          declaration: "parens",
          assignment: "parens-new-line",
          return: "parens-new-line",
          arrow: "parens-new-line",
          condition: "parens-new-line",
          logical: "parens-new-line",
          prop: "parens",
          propertyValue: "parens",
        }
      ],
      "@stylistic/key-spacing": [
        "error",
        {"mode": "strict"}
      ],
      "@stylistic/line-comment-position": [
        "error",
        {"ignorePattern": "pragma"}
      ],
      "@stylistic/max-statements-per-line": [
        "error",
        { "max": 1 }
      ],
      "@stylistic/multiline-ternary": ["error", "never"],
      "@stylistic/newline-per-chained-call": [
        "error",
        { "ignoreChainWithDepth": 2 }
      ],
      "@stylistic/no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
      "@stylistic/no-multi-spaces": "error",
      "@stylistic/no-multiple-empty-lines": "error",
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/no-whitespace-before-property": "error",
      "@stylistic/object-curly-newline": [
        "warn",
        {
          "minProperties": 3,
          "multiline": true,
        }
      ],
      "@stylistic/object-curly-spacing": [
        "error",
        "always",
        {
          "arraysInObjects": false,
          "objectsInObjects": false,
        }
      ],
      "@stylistic/operator-linebreak": ["error", "after"],
      "@stylistic/quote-props": ["error", "consistent"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/semi-spacing": "error",
      "@stylistic/semi-style": ["error", "last"],
      "@stylistic/space-before-blocks": "error",
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/type-annotation-spacing": "error",
      "@stylistic/type-generic-spacing": ["error"],
      "@stylistic/type-named-tuple-spacing": ["error"],
    },
  },
];

export default eslintConfig;
