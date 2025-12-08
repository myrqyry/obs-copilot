#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🎨 Fixing Tailwind CSS issues...\n');

const colorMappings = {
  'bg-gray-200': 'bg-muted',
  'bg-gray-700': 'bg-muted/70',
  'dark:bg-gray-700': 'dark:bg-muted/70',
  'bg-blue-500': 'bg-primary',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-900': 'text-foreground',
  'border-gray-300': 'border-border',
};

const files = glob.sync('src/**/*.{ts,tsx}', { ignore: ['**/node_modules/**', '**/__tests__/**'] });

let fixCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  Object.entries(colorMappings).forEach(([oldStr, replacement]) => {
    const regex = new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
      fixCount++;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed colors in: ${file}`);
  }
});

console.log(`\n✨ Fixed ${fixCount} color references across ${files.length} files!\n`);

// Print a summary of next manual steps
console.log('Next steps: run `pnpm lint` and `pnpm test` to verify no unintended changes.');
