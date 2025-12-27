#!/usr/bin/env node

/**
 * Atomic Cache Cleanup Script
 *
 * Removes ALL build caches to prevent corruption from partial builds.
 *
 * Cleans:
 * - .next directories (Next.js build output)
 * - .turbo directories (Turbo monorepo cache)
 * - node_modules/.cache (Node module cache)
 * - tsconfig.tsbuildinfo (TypeScript incremental build info)
 *
 * Usage:
 *   npm run clean:cache
 *   node scripts/clean-cache.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function findDirectories(baseDir, targetName) {
  const results = [];

  function search(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip node_modules except for the top-level cache
        if (entry.name === 'node_modules' && dir !== ROOT_DIR) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name === targetName) {
            results.push(fullPath);
          } else {
            search(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  search(baseDir);
  return results;
}

function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    }
  } catch (error) {
    log(`  ⚠ Failed to remove ${dirPath}: ${error.message}`, colors.yellow);
    return false;
  }
  return false;
}

function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    log(`  ⚠ Failed to remove ${filePath}: ${error.message}`, colors.yellow);
    return false;
  }
  return false;
}

async function cleanCache() {
  log('\n🧹 Starting atomic cache cleanup...', colors.bright + colors.cyan);
  log('━'.repeat(60), colors.cyan);

  let totalRemoved = 0;

  // 1. Clean .next directories
  log('\n📦 Cleaning Next.js build artifacts (.next)...', colors.cyan);
  const nextDirs = findDirectories(ROOT_DIR, '.next');
  for (const dir of nextDirs) {
    const relativePath = path.relative(ROOT_DIR, dir);
    if (removeDirectory(dir)) {
      log(`  ✓ Removed ${relativePath}`, colors.green);
      totalRemoved++;
    }
  }
  if (nextDirs.length === 0) {
    log('  ℹ No .next directories found', colors.yellow);
  }

  // 2. Clean .turbo directories
  log('\n⚡ Cleaning Turbo cache (.turbo)...', colors.cyan);
  const turboDirs = findDirectories(ROOT_DIR, '.turbo');
  for (const dir of turboDirs) {
    const relativePath = path.relative(ROOT_DIR, dir);
    if (removeDirectory(dir)) {
      log(`  ✓ Removed ${relativePath}`, colors.green);
      totalRemoved++;
    }
  }
  if (turboDirs.length === 0) {
    log('  ℹ No .turbo directories found', colors.yellow);
  }

  // 3. Clean node_modules/.cache
  log('\n📚 Cleaning Node module cache...', colors.cyan);
  const nodeCache = path.join(ROOT_DIR, 'node_modules', '.cache');
  if (removeDirectory(nodeCache)) {
    log(`  ✓ Removed node_modules/.cache`, colors.green);
    totalRemoved++;
  } else {
    log('  ℹ No node_modules/.cache found', colors.yellow);
  }

  // 4. Clean tsconfig.tsbuildinfo files
  log('\n📝 Cleaning TypeScript build info...', colors.cyan);
  const tsbuildInfoPaths = [
    path.join(ROOT_DIR, 'apps', 'frontend', 'tsconfig.tsbuildinfo'),
    path.join(ROOT_DIR, 'apps', 'backend', 'tsconfig.tsbuildinfo'),
  ];

  let tsbuildInfoRemoved = 0;
  for (const filePath of tsbuildInfoPaths) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    if (removeFile(filePath)) {
      log(`  ✓ Removed ${relativePath}`, colors.green);
      tsbuildInfoRemoved++;
    }
  }
  if (tsbuildInfoRemoved === 0) {
    log('  ℹ No tsconfig.tsbuildinfo files found', colors.yellow);
  }
  totalRemoved += tsbuildInfoRemoved;

  // Summary
  log('\n━'.repeat(60), colors.cyan);
  log(`✨ Cache cleanup completed! Removed ${totalRemoved} items.`, colors.bright + colors.green);
  log('', colors.reset);
}

// Run cleanup
cleanCache().catch((error) => {
  log(`\n❌ Cache cleanup failed: ${error.message}`, colors.bright);
  process.exit(1);
});
