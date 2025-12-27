# Cache Management Guide

## Overview

This guide explains how to manage build caches in the LocalShare monorepo to prevent corruption from partial builds.

## Problem: Cache Corruption from Failed Builds

### What Happened?

When a production build fails mid-process (e.g., during React Server Components compilation), Next.js and Turbo leave **partial build artifacts** on disk. These corrupted artifacts can be cached and restored in subsequent builds, causing runtime errors.

### The Cache Layers

LocalShare uses **three cache layers**:

1. **`.next/`** - Next.js build output (Webpack bundles, RSC manifests)
2. **`.turbo/`** - Turbo monorepo task cache
3. **`node_modules/.cache`** - Node module compilation cache

**Critical:** All three layers must be cleaned atomically. Cleaning only one layer is insufficient because Turbo will restore from its cache.

### Example Error Scenario

```bash
# Production build fails at RSC compilation
npm run build  # ❌ Fails, but creates partial artifacts

# Dev server reads corrupted cache
npm run dev    # ❌ Error: Cannot find module './169.js'
               # ❌ Error: Cannot read properties of undefined (reading 'clientModules')
```

## Solution: Atomic Cache Cleanup

### Quick Commands

```bash
# Clean all caches (recommended after any build failure)
npm run clean:cache

# Start dev server with clean caches
npm run dev:clean

# Production build with automatic cleanup on failure
npm run build:safe

# Verify build artifact integrity
npm run verify:build

# Nuclear option: clean everything including node_modules
npm run clean:all
```

## When to Clean Caches

### ✅ Always clean caches after:

- Production build failures
- TypeScript compilation errors during build
- Webpack bundling errors
- React Server Components errors
- Next.js middleware errors
- Switching branches with significant changes
- After pulling major updates from main/develop

### ⚠️ Consider cleaning caches when:

- Experiencing unexplained runtime errors
- Module resolution errors (e.g., "Cannot find module")
- Hot Module Replacement (HMR) not working
- Components not updating in dev mode
- Seeing stale code after changes

### ℹ️ No need to clean caches when:

- Making small code changes
- Working in dev mode without build failures
- Running tests (they don't use production cache)

## Detailed Command Reference

### `npm run clean:cache`

**Purpose:** Remove all build caches atomically

**What it cleans:**
- All `.next/` directories in the monorepo
- All `.turbo/` directories in the monorepo
- `node_modules/.cache/`
- `tsconfig.tsbuildinfo` files

**When to use:** After any build failure, before important builds

**Example:**
```bash
$ npm run clean:cache

🧹 Starting atomic cache cleanup...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Cleaning Next.js build artifacts (.next)...
  ✓ Removed apps/frontend/.next

⚡ Cleaning Turbo cache (.turbo)...
  ✓ Removed apps/frontend/.turbo
  ✓ Removed apps/backend/.turbo

📚 Cleaning Node module cache...
  ✓ Removed node_modules/.cache

📝 Cleaning TypeScript build info...
  ✓ Removed apps/frontend/tsconfig.tsbuildinfo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Cache cleanup completed! Removed 5 items.
```

### `npm run build:safe`

**Purpose:** Production build with automatic cleanup on failure

**How it works:**
1. Checks build artifact integrity before starting
2. Cleans corrupted artifacts if detected
3. Runs production build
4. On failure: automatically cleans all caches

**When to use:** Instead of `npm run build` when you want safety guarantees

**Example:**
```bash
$ npm run build:safe

═══════════════════════════════════════════════════════════
🛡️  SAFE BUILD - Production Build with Cache Protection
═══════════════════════════════════════════════════════════

🔍 Checking build artifact integrity...
  ✓ Build artifacts appear valid

🏗️  Starting production build...
# ... build output ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Build completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### `npm run verify:build`

**Purpose:** Verify build artifact integrity without rebuilding

**What it checks:**
- Build output directories exist
- Critical build files are present (BUILD_ID, server/, static/)
- Cache consistency

**When to use:** Debugging cache issues, before important deployments

**Example:**
```bash
$ npm run verify:build

🔍 Build Verification Report
═══════════════════════════════════════════════════════════

📦 Frontend Build Artifacts:
  ✓ Next.js build directory: apps/frontend/.next
  ✓ Build ID file: apps/frontend/.next/BUILD_ID
  ✓ Server directory: apps/frontend/.next/server
  ✓ Static directory: apps/frontend/.next/static
  📊 Total size: 45.2 MB

⚡ Cache Directories:
  ✓ Frontend Turbo cache: apps/frontend/.turbo
  📊 Total cache size: 12.8 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Build verification passed!
   All required artifacts are present and valid.
```

### `npm run dev:clean`

**Purpose:** Start dev server with clean caches

**Equivalent to:**
```bash
npm run clean:cache && npm run dev
```

**When to use:** When dev server has issues loading, after failed builds

### `npm run build:clean`

**Purpose:** Production build with pre-cleaned caches

**Equivalent to:**
```bash
npm run clean:cache && npm run build
```

**When to use:** When you want a guaranteed clean build

## Troubleshooting

### Issue: "Cannot find module './169.js'" or similar module errors

**Cause:** Corrupted Webpack manifest from partial build

**Solution:**
```bash
npm run clean:cache
npm run dev
```

### Issue: "Cannot read properties of undefined (reading 'clientModules')"

**Cause:** Corrupted React Server Components registry from failed build

**Solution:**
```bash
npm run clean:cache
npm run dev
```

### Issue: Build fails, then dev server won't start

**Cause:** Build failure created corrupted cache, dev server restores it

**Solution:**
```bash
npm run clean:cache  # Clean first
npm run dev         # Then start dev server
```

### Issue: HMR (Hot Module Replacement) not working

**Cause:** Stale `.next/` or `.turbo/` cache

**Solution:**
```bash
npm run dev:clean
```

### Issue: TypeScript errors in dev mode but not in editor

**Cause:** Stale `tsconfig.tsbuildinfo`

**Solution:**
```bash
npm run clean:cache
```

## Best Practices

### 1. Clean After Failed Builds

**Always** run `npm run clean:cache` after a build failure before retrying.

```bash
# ❌ Bad workflow:
npm run build  # Fails
npm run build  # Retries with corrupted cache

# ✅ Good workflow:
npm run build        # Fails
npm run clean:cache  # Clean first
npm run build        # Retry with clean slate
```

### 2. Use Safe Build for Important Builds

For production deployments or important builds, use `build:safe`:

```bash
npm run build:safe  # Automatic cleanup on failure
```

### 3. Verify Before Deployment

Check build integrity before deploying:

```bash
npm run verify:build
```

### 4. Clean Before Branch Switches

When switching to branches with significant changes:

```bash
git checkout develop
npm run clean:cache
npm run dev
```

### 5. Document Build Failures

If you encounter a build failure:

1. Note the error message
2. Run `npm run clean:cache`
3. If issue persists, it's a code issue (not cache)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      # Install dependencies
      - run: npm ci

      # Clean caches before build (prevents cross-build pollution)
      - run: npm run clean:cache

      # Use safe build
      - run: npm run build:safe

      # Verify build integrity
      - run: npm run verify:build
```

### Important CI Considerations

1. **Don't cache `.next/` or `.turbo/` between CI runs**
2. **Always clean caches before each build**
3. **Use `build:safe` for automatic cleanup on failure**
4. **Verify build integrity after successful builds**

## Technical Details

### Why Partial Builds Happen

Next.js build pipeline has multiple stages:

1. **TypeScript Compilation** → Creates `.d.ts` files
2. **Webpack Bundling** → Creates chunks (e.g., `169.js`)
3. **RSC Compilation** → Creates client/server module registry
4. **Static Generation** → Renders pages to HTML
5. **Optimization** → Minifies assets

If stage 3 fails, stages 1-2 **have already created artifacts**. These partial artifacts are then cached by Turbo.

### Why Turbo Caching Is Aggressive

Turbo caches based on **input hashing**:
- Source files
- Dependencies
- Environment variables

If inputs haven't changed, Turbo assumes the output is valid and restores from cache. This is normally an optimization but becomes problematic when the cached output is corrupted.

### Cache Invalidation Strategy

Our scripts implement **atomic cache cleanup**:

```javascript
// Clean ALL cache layers atomically
function cleanCache() {
  removeAllDirectories('.next');
  removeAllDirectories('.turbo');
  removeDirectory('node_modules/.cache');
  removeFiles('tsconfig.tsbuildinfo');
}
```

This ensures no cache layer can restore corrupted state.

## FAQ

### Q: Why not just delete `.next`?

**A:** Turbo will immediately restore `.next` from its `.turbo/` cache. You must delete **all cache layers** atomically.

### Q: How often should I clean caches?

**A:** Only when needed (after build failures, branch switches, unexplained errors). Don't clean unnecessarily as it slows down development.

### Q: Will cleaning caches delete my code?

**A:** No. Cache cleanup only removes **generated** files (`.next/`, `.turbo/`, caches). Your source code is never touched.

### Q: Can I clean caches while dev server is running?

**A:** No. Stop the dev server first, clean caches, then restart.

```bash
# Stop dev server (Ctrl+C)
npm run clean:cache
npm run dev
```

### Q: What if `clean:cache` doesn't fix the issue?

**A:** If cache cleanup doesn't help, the issue is in your code, not the cache. Review the error messages and fix the underlying problem.

## Related Documentation

- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Turbo Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Systematic Debugging Guide](./SYSTEMATIC_DEBUGGING.md) (if you create one)

## Support

If you encounter cache-related issues not covered here:

1. Run `npm run verify:build` to check current state
2. Try `npm run clean:all` (nuclear option)
3. Check if the issue reproduces after full cleanup
4. If yes, it's a code issue; if no, document the new cache pattern
