#!/usr/bin/env node
/**
 * Fix glob imports across the codebase (CommonJS for package type: module)
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Files to process
const patterns = [
  'vite.config.ts',
  'vitest.config.ts',
  'scripts/**/*.{js,ts}',
  'backend/**/*.{js,ts,py}',
  'src/**/*.{ts,tsx,js,jsx}'
];

let filesFixed = 0;
let occurrencesFixed = 0;

console.log('🔍 Scanning for glob import issues...\n');

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/.venv/**', '**/.git/**'] });
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      let changesMade = 0;

      // Fix: import glob from 'glob'
      if (newContent.includes("import glob from 'glob'")) {
        newContent = newContent.replace(/import glob from 'glob'/g, "import { glob } from 'glob'");
        changesMade++;
      }

      // Fix: import glob from "glob"
      if (newContent.includes('import glob from "glob"')) {
        newContent = newContent.replace(/import glob from "glob"/g, 'import { glob } from "glob"');
        changesMade++;
      }

      // Fix: const glob = require('glob')
      if (newContent.includes("const glob = require('glob')")) {
        newContent = newContent.replace(/const glob = require\('glob'\)/g, "const { glob } = require('glob')");
        changesMade++;
      }

      if (changesMade > 0) {
        fs.writeFileSync(file, newContent, 'utf8');
        filesFixed++;
        occurrencesFixed += changesMade;
        console.log(`✅ Fixed ${changesMade} occurrence(s) in: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });
});

console.log(`\n✨ Done! Fixed ${occurrencesFixed} occurrences in ${filesFixed} files.`);
console.log('\n📊 Run "pnpm tsc --noEmit" to verify the fixes.\n');
