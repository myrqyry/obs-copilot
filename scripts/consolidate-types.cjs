#!/usr/bin/env node
/**
 * Consolidate duplicate type exports into a single index file (CommonJS)
 */

const fs = require('fs');
const path = require('path');

const typesDir = path.join(__dirname, '../src/shared/types');
const indexFile = path.join(typesDir, 'index.ts');

console.log('📦 Consolidating type exports...\n');

if (!fs.existsSync(typesDir)) {
  console.error(`Types directory does not exist: ${typesDir}`);
  process.exit(1);
}

// Get all type files in the directory
const typeFiles = fs.readdirSync(typesDir)
  .filter(file => file.endsWith('.ts') && file !== 'index.ts')
  .map(file => file.replace('.ts', ''));

// Generate index.ts content
const indexContent = `/**
 * Centralized type exports
 * Single source of truth for all shared types
 */
\n${typeFiles.map(file => `export * from './${file}';`).join('\n')}
`;

fs.writeFileSync(indexFile, indexContent, 'utf8');
console.log('✅ Created src/shared/types/index.ts');

// Update imports in key files
const filesToUpdate = [
  'src/shared/services/obsActionValidator.ts',
  'src/shared/services/obsActionExecutor.ts',
  'src/shared/services/obsStateManager.ts',
  'src/shared/hooks/useGeminiChat.ts',
  'src/shared/hooks/useObsActions.ts'
];

let importsFixed = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Replace specific imports with centralized import
    const specificImportPatterns = [
      /import\s+type\s+{\s*ObsAction\s*}\s+from\s+['"]@\/_shared\/types\/obsActions['"]/g,
      /import\s+{\s*ObsAction\s*}\s+from\s+['"]@\/_shared\/types\/obsActions['"]/g,
      /import\s+{\s*OBSScene,?\s*OBSSource\s*}\s+from\s+['"]@\/_shared\/types\/obs['"]/g,
      /import\s+type\s+{\s*OBSScene,?\s*OBSSource\s*}\s+from\s+['"]@\/_shared\/types\/obs['"]/g
    ];

    specificImportPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, "import type { ObsAction, OBSScene, OBSSource } from '@/shared/types'");
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      importsFixed++;
      console.log(`✅ Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✨ Done! Updated ${importsFixed} files with centralized imports.\n`);
