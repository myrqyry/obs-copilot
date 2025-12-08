#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🎨 Fixing Tailwind CSS issues...\n');

const colorMappings = {
  'bg-gray-50': 'bg-muted/10',
  'bg-gray-100': 'bg-muted/30',
  'bg-gray-200': 'bg-muted',
  'bg-gray-300': 'bg-muted/70',
  'bg-gray-400': 'bg-muted/80',
  'bg-gray-700': 'bg-muted/70',
  'bg-gray-900': 'bg-card',
  'dark:bg-gray-700': 'dark:bg-muted/70',
  'bg-white': 'bg-card',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-400': 'text-muted-foreground',
  'text-gray-900': 'text-foreground',
  'text-gray-700': 'text-muted-foreground',
  'text-white': 'text-foreground',
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-400': 'border-border',
  'bg-blue-500': 'bg-primary',
  'bg-blue-600': 'bg-primary',
  'bg-blue-700': 'bg-primary/80',
  'bg-blue-50': 'bg-primary/10',
  'shadow-lg bg-white': 'shadow-lg bg-card',
  'from-white': 'from-card',
  'to-gray-100': 'to-muted/30',
  'bg-gray-800': 'bg-card',
  'text-gray-300': 'text-muted-foreground',
  'bg-gray-600': 'bg-muted/70',
  'border-gray-600': 'border-border',
  'text-blue-600': 'text-primary',
  'focus:ring-blue-500': 'focus:ring-ring',
  'hover:bg-gray-600': 'hover:bg-muted/70',
  'dark:border-gray-700': 'dark:border-border',
  'bg-black/50': 'bg-overlay/50',
  'bg-black/60': 'bg-overlay/60',
  'bg-black/80': 'bg-overlay/80',
  'bg-black/0': 'bg-overlay/0',
  'bg-black/30': 'bg-overlay/30',
  'bg-black/20': 'bg-overlay/20',
  'bg-white/5': 'bg-overlay/5',
  'bg-black bg-opacity-50': 'bg-overlay/50',
  'text-blue-700': 'text-primary',
  'hover:text-blue-700': 'hover:text-primary/90',
  'text-blue-400': 'text-primary',
  'hover:text-blue-300': 'hover:text-primary/90',
  'text-blue-900': 'text-primary',
  'border-blue-500': 'border-ring',
  'hover:border-blue-500': 'hover:border-ring',
  'hover:bg-blue-500': 'hover:bg-primary',
  'active:bg-blue-600': 'active:bg-primary/95',
  'from-blue-500': 'from-primary',
  'to-blue-500': 'to-primary',
  'bg-blue-900': 'bg-card',
  'bg-blue-800': 'bg-card',
  'text-blue-800': 'text-primary',
  'bg-blue-50': 'bg-primary/10',
  'text-blue-50': 'text-primary/10',
  'bg-blue-900/10': 'bg-card/10',
  'border-blue-200': 'border-primary/20',
  'border-blue-300': 'border-primary/30',
  'hover:border-blue-300': 'hover:border-primary/30',
  'text-purple-500': 'text-accent',
  'hover:text-purple-500': 'hover:text-accent',
  'hover:bg-purple-500/10': 'hover:bg-accent/10',
  'focus:ring-purple-500/50': 'focus:ring-accent/50',
  'from-purple-500': 'from-accent',
  'to-pink-500': 'to-accent',
  'border-purple-500': 'border-accent',
  'data-[state=active]:border-purple-500': 'data-[state=active]:border-accent',
  // Error / Destructive
  'text-red-400': 'text-error',
  'text-red-500': 'text-error',
  'text-red-600': 'text-error',
  'text-red-700': 'text-error',
  'bg-red-50': 'bg-error/10',
  'bg-red-100': 'bg-error/10',
  'border-red-200': 'border-error/20',
  'border-red-300': 'border-error/30',
  'hover:text-red-600': 'hover:text-error',
  'hover:bg-red-500/10': 'hover:bg-error/10',
  // Success / Green
  'text-green-500': 'text-success',
  'text-green-600': 'text-success',
  'text-green-400': 'text-success',
  'text-red-300': 'text-error',
  'border-green-300': 'border-success/30',
  'focus:ring-green-500/20': 'focus:ring-success/20',
  'hover:text-red-50': 'hover:text-error',
  'focus:ring-red-400': 'focus:ring-error/50',
  'focus:ring-offset-red-600': 'focus:ring-offset-error/50',
  'bg-green-50': 'bg-success/10',
  'bg-green-100': 'bg-success/10',
  'border-green-200': 'border-success/20',
  'hover:text-green-500': 'hover:text-success',
  'hover:bg-green-500/10': 'hover:bg-success/10',
  // Warning / Yellow / Orange
  'text-yellow-400': 'text-warning',
  'text-yellow-500': 'text-warning',
  'bg-yellow-50': 'bg-warning/10',
  'bg-yellow-100': 'bg-warning/10',
  'border-yellow-200': 'border-warning/20',
  'text-orange-700': 'text-warning',
  'text-orange-600': 'text-warning',
  'bg-orange-50': 'bg-warning/10',
  // Gradients and chained mappings
  'from-red-500': 'from-error',
  'via-yellow-500': 'via-warning',
  'to-green-500': 'to-success',
  'ring-blue-500': 'ring-ring',
  'text-red-800': 'text-error',
  'bg-green-600': 'bg-success',
  'border-orange-300': 'border-warning/30',
  'text-orange-900': 'text-warning',
  'border-orange-200': 'border-warning/20',
  // Info / Indigo
  'text-indigo-600': 'text-info',
  'focus:ring-indigo-500': 'focus:ring-info',
  'bg-indigo-600': 'bg-info',
  // Border mappings for status tokens
  'border-green-500': 'border-success/20',
  'border-red-500': 'border-error/20',
  'border-yellow-500': 'border-warning/20',
  'ring-green-500/50': 'ring-success/50',
  'ring-red-500/50': 'ring-error/50',
  'ring-yellow-500/50': 'ring-warning/50',
  'ring-orange-500/50': 'ring-warning/50',
  'bg-green-500': 'bg-success',
  'bg-red-500': 'bg-error',
  'bg-yellow-500': 'bg-warning',
  'bg-orange-50': 'bg-warning/10',
};

const files = glob.sync('src/**/*.{ts,tsx}', { ignore: ['**/node_modules/**', '**/__tests__/**'] });

let fixCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  Object.entries(colorMappings).forEach(([oldStr, replacement]) => {
    const regex = new RegExp(oldStr.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'g');
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
