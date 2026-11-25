// @ts-check
// ESLint for tajweed-frontend: Angular's recommended rules, the accessibility rules of templates, and the author's
// rule «comments on the code everywhere» (AGENTS.md §1) in its TypeScript form: every class, method, function,
// interface, property and exported constant has a TSDoc comment (eslint-plugin-jsdoc). Lint must stay at 0 errors.
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const jsdoc = require('eslint-plugin-jsdoc');

module.exports = defineConfig([
  {
    ignores: ['dist/**', '.angular/**', 'coverage/**', 'tools/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: { jsdoc },
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'tj', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'tj', style: 'kebab-case' }],
      'no-console': ['error', { allow: ['error'] }],
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: false,
        require: { ClassDeclaration: true, MethodDefinition: true, FunctionDeclaration: true },
        contexts: ['TSInterfaceDeclaration', 'TSPropertySignature', 'PropertyDefinition', 'TSTypeAliasDeclaration',
          'ExportNamedDeclaration > VariableDeclaration'],
      }],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: { 'jsdoc/require-jsdoc': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
