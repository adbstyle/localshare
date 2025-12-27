#!/usr/bin/env node

/**
 * Safe Build Script
 *
 * Performs a production build with automatic cache cleanup on failure.
 * Prevents corrupted cache artifacts from partial builds.
 *
 * Features:
 * - Pre-build cache validation
 * - Automatic cleanup on build failure
 * - Build integrity verification
 * - Detailed error reporting
 *
 * Usage:
 *   npm run build:safe
 *   node scripts/safe-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkBuildIntegrity() {
  log('\n🔍 Checking build artifact integrity...', colors.cyan);

  const nextDir = path.join(ROOT_DIR, 'apps', 'frontend', '.next');
  const buildIdFile = path.join(nextDir, 'BUILD_ID');

  if (fs.existsSync(nextDir) && !fs.existsSync(buildIdFile)) {
    log('  ⚠ Incomplete .next directory detected (missing BUILD_ID)', colors.yellow);
    return false;
  }

  log('  ✓ Build artifacts appear valid', colors.green);
  return true;
}

function cleanCache() {
  log('\n🧹 Running cache cleanup...', colors.cyan);
  try {
    execSync('npm run clean:cache', { stdio: 'inherit', cwd: ROOT_DIR });
    log('  ✓ Cache cleaned successfully', colors.green);
    return true;
  } catch (error) {
    log('  ✗ Cache cleanup failed', colors.red);
    return false;
  }
}

function runBuild() {
  log('\n🏗️  Starting production build...', colors.bright + colors.cyan);
  log('━'.repeat(60), colors.cyan);

  try {
    execSync('turbo run build', { stdio: 'inherit', cwd: ROOT_DIR });
    return true;
  } catch (error) {
    return false;
  }
}

async function safeBuild() {
  log('\n' + '═'.repeat(60), colors.bright + colors.cyan);
  log('🛡️  SAFE BUILD - Production Build with Cache Protection', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.bright + colors.cyan);

  // Step 1: Pre-build integrity check
  const isIntact = checkBuildIntegrity();
  if (!isIntact) {
    log('\n⚠ Corrupted build artifacts detected. Cleaning before build...', colors.yellow);
    if (!cleanCache()) {
      log('\n❌ Failed to clean cache. Aborting build.', colors.bright + colors.red);
      process.exit(1);
    }
  }

  // Step 2: Run build
  const buildSuccess = runBuild();

  // Step 3: Handle build result
  if (buildSuccess) {
    log('\n━'.repeat(60), colors.green);
    log('✅ Build completed successfully!', colors.bright + colors.green);
    log('━'.repeat(60), colors.green);
    process.exit(0);
  } else {
    log('\n━'.repeat(60), colors.red);
    log('❌ Build failed!', colors.bright + colors.red);
    log('━'.repeat(60), colors.red);

    log('\n🔧 Cleaning corrupted build artifacts...', colors.yellow);
    cleanCache();

    log('\n💡 Troubleshooting tips:', colors.cyan);
    log('  1. Review the error messages above', colors.reset);
    log('  2. Fix the underlying issues', colors.reset);
    log('  3. Run "npm run build:safe" again', colors.reset);
    log('  4. If issues persist, run "npm run clean:all"', colors.reset);
    log('', colors.reset);

    process.exit(1);
  }
}

// Run safe build
safeBuild().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.bright + colors.red);
  cleanCache();
  process.exit(1);
});
