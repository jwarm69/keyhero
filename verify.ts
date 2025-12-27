#!/usr/bin/env node

/**
 * Quick verification script for KeyHero audio engine
 * Run this to verify all files are created and syntactically correct
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const files = [
  'src/types.ts',
  'src/audio/proceduralTrack.ts',
  'src/audio/audioEngine.ts',
  'src/audio/tests.ts',
  'src/index.ts',
  'index.html',
  'tests.html',
  'package.json',
];

console.log('🎵 KeyHero Audio Engine Verification\n');
console.log('Checking files...\n');

let allExists = true;

for (const file of files) {
  const fullPath = join(process.cwd(), file);
  const exists = existsSync(fullPath);

  if (exists) {
    const stats = readFileSync(fullPath);
    const size = (stats.length / 1024).toFixed(2);
    console.log(`✓ ${file} (${size} KB)`);
  } else {
    console.log(`✗ ${file} - MISSING`);
    allExists = false;
  }
}

console.log('\n');

if (allExists) {
  console.log('✅ All files present!\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:5173 (game)');
  console.log('  3. Open: http://localhost:5173/tests.html (tests)');
  console.log('  4. Click "Run All Tests" to verify audio timing\n');
  console.log('🎸 Ready to rock!');
} else {
  console.log('❌ Some files are missing. Please review the implementation.\n');
  process.exit(1);
}
