module.exports = {
  root: true,
  // Use the TypeScript parser at the root so TS/TSX files are parsed correctly
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // point at both tsconfig files so type-aware rules work across the repo
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
    ecmaVersion: 2024,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: { react: { version: 'detect' } },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      // TypeScript-specific overrides live here; parser is set at root so it
      // applies consistently for all TS/TSX files.
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
      ],
      rules: {
        // TypeScript-specific overrides can go here
      }
    }
  ],
  rules: {
    // project-specific overrides
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react/react-in-jsx-scope': 'off'
  }
};
