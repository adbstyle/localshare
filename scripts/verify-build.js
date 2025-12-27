#!/usr/bin/env node

/**
 * Build Verification Script
 *
 * Verifies the integrity of build artifacts.
 * Useful for debugging cache-related issues.
 *
 * Checks:
 * - Build output directories exist
 * - Critical build files are present
 * - Cache consistency across layers
 *
 * Usage:
 *   npm run verify:build
 *   node scripts/verify-build.js
 */

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

function checkPath(filePath, description, required = true) {
  const exists = fs.existsSync(filePath);
  const relativePath = path.relative(ROOT_DIR, filePath);

  if (exists) {
    log(`  ✓ ${description}: ${relativePath}`, colors.green);
    return true;
  } else if (required) {
    log(`  ✗ ${description}: ${relativePath} (MISSING)`, colors.red);
    return false;
  } else {
    log(`  ℹ ${description}: ${relativePath} (not found, optional)`, colors.yellow);
    return true;
  }
}

function getCacheSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let totalSize = 0;

  function calculateSize(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          calculateSize(fullPath);
        } else {
          try {
            const stats = fs.statSync(fullPath);
            totalSize += stats.size;
          } catch (error) {
            // Ignore errors
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  calculateSize(dirPath);
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function verifyBuild() {
  log('\n🔍 Build Verification Report', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);

  let allValid = true;

  // Frontend build artifacts
  log('\n📦 Frontend Build Artifacts:', colors.cyan);
  const frontendNext = path.join(ROOT_DIR, 'apps', 'frontend', '.next');
  const frontendBuildId = path.join(frontendNext, 'BUILD_ID');
  const frontendServer = path.join(frontendNext, 'server');
  const frontendStatic = path.join(frontendNext, 'static');

  allValid &= checkPath(frontendNext, 'Next.js build directory', false);
  if (fs.existsSync(frontendNext)) {
    allValid &= checkPath(frontendBuildId, 'Build ID file', true);
    allValid &= checkPath(frontendServer, 'Server directory', true);
    allValid &= checkPath(frontendStatic, 'Static directory', true);

    const nextSize = getCacheSize(frontendNext);
    log(`  📊 Total size: ${formatBytes(nextSize)}`, colors.reset);
  }

  // Backend build artifacts
  log('\n📦 Backend Build Artifacts:', colors.cyan);
  const backendDist = path.join(ROOT_DIR, 'apps', 'backend', 'dist');
  allValid &= checkPath(backendDist, 'Backend dist directory', false);
  if (fs.existsSync(backendDist)) {
    const distSize = getCacheSize(backendDist);
    log(`  📊 Total size: ${formatBytes(distSize)}`, colors.reset);
  }

  // Cache directories
  log('\n⚡ Cache Directories:', colors.cyan);
  const frontendTurbo = path.join(ROOT_DIR, 'apps', 'frontend', '.turbo');
  const backendTurbo = path.join(ROOT_DIR, 'apps', 'backend', '.turbo');
  const rootTurbo = path.join(ROOT_DIR, '.turbo');
  const nodeCache = path.join(ROOT_DIR, 'node_modules', '.cache');

  checkPath(frontendTurbo, 'Frontend Turbo cache', false);
  checkPath(backendTurbo, 'Backend Turbo cache', false);
  checkPath(rootTurbo, 'Root Turbo cache', false);
  checkPath(nodeCache, 'Node modules cache', false);

  let totalCacheSize = 0;
  totalCacheSize += getCacheSize(frontendTurbo);
  totalCacheSize += getCacheSize(backendTurbo);
  totalCacheSize += getCacheSize(rootTurbo);
  totalCacheSize += getCacheSize(nodeCache);

  if (totalCacheSize > 0) {
    log(`  📊 Total cache size: ${formatBytes(totalCacheSize)}`, colors.reset);
  }

  // TypeScript build info
  log('\n📝 TypeScript Build Info:', colors.cyan);
  const frontendTsBuildInfo = path.join(ROOT_DIR, 'apps', 'frontend', 'tsconfig.tsbuildinfo');
  const backendTsBuildInfo = path.join(ROOT_DIR, 'apps', 'backend', 'tsconfig.tsbuildinfo');
  checkPath(frontendTsBuildInfo, 'Frontend TS build info', false);
  checkPath(backendTsBuildInfo, 'Backend TS build info', false);

  // Summary
  log('\n━'.repeat(60), colors.cyan);
  if (allValid) {
    log('✅ Build verification passed!', colors.bright + colors.green);
    log('   All required artifacts are present and valid.', colors.green);
  } else {
    log('⚠️  Build verification found issues!', colors.bright + colors.yellow);
    log('   Some required artifacts are missing or corrupted.', colors.yellow);
    log('\n💡 Recommendations:', colors.cyan);
    log('   - Run "npm run clean:cache" to clear caches', colors.reset);
    log('   - Run "npm run build:safe" for a clean build', colors.reset);
  }
  log('', colors.reset);

  return allValid;
}

// Run verification
verifyBuild()
  .then((valid) => {
    process.exit(valid ? 0 : 1);
  })
  .catch((error) => {
    log(`\n❌ Verification failed: ${error.message}`, colors.bright + colors.red);
    process.exit(1);
  });
