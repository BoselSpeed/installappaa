module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  settings: {
    react: { version: '18.3' }
  },
  ignorePatterns: [
    'dist',
    'تطبيق الفقه',
    // Prebuilt web bundles checked into the native projects — minified
    // build output, not source we maintain.
    'public',
    'ايفون/App/App/public',
    'android/app/src/main/assets/public',
    // Android build intermediates (generated Capacitor copies of the bundle).
    'android/app/build',
    'node_modules',
    '*.log'
  ],
  overrides: [
    {
      // Node-side tooling (build scripts, content verification).
      files: ['**/*.cjs', '**/*.mjs'],
      env: { node: true, es2022: true },
      parserOptions: { sourceType: 'script' },
      rules: { 'no-undef': 'error' }
    }
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'off'
  }
};
