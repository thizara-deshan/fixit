import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import fixit from './tools/eslint/fixit-plugin.js';

const prismaPattern = {
  group: ['@prisma/client', '@prisma/client/*'],
  message: 'Prisma types stay in apps/api infra/, module mappers and *.repo.ts.',
};
const mswPattern = { group: ['msw', 'msw/*'], message: 'MSW is only imported in src/mocks and tests.' };
const uiDeepPattern = {
  group: ['@/components/ui/*/*'],
  message: 'Import shadcn primitives from @/components/ui/<name> only.',
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.vite/**',
      'reference/**',
      'docs/**',
      'apps/web/public/mockServiceWorker.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.node },
    },
    plugins: { fixit },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      'fixit/no-reference-import': 'error',
      'no-restricted-imports': ['error', { patterns: [prismaPattern] }],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  // Web app
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    ...reactHooks.configs['recommended-latest'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/mocks/**', 'apps/web/src/test/**', '**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [prismaPattern, mswPattern, uiDeepPattern] }] },
  },
  {
    // Colour rule: app, features and shared components. shadcn primitives (components/ui) are generated code.
    files: ['apps/web/src/{app,features,components}/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/components/ui/**'],
    rules: { 'fixit/no-raw-colors': 'error' },
  },
  // Contracts: pure, time injected
  {
    files: ['packages/contracts/src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Contracts take `now: Date` as a parameter. No `new Date()` here.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Contracts take `now: Date` as a parameter. No `Date.now()` here.',
        },
      ],
    },
  },
  // API (from M14): Prisma allowed in infra/mappers/repos
  {
    files: ['apps/api/src/infra/**/*.ts', 'apps/api/src/modules/**/mappers*.ts', 'apps/api/src/**/*.repo.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
