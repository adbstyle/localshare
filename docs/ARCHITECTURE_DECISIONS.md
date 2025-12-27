# Architecture Decision Records (ADR)

## ADR-001: Atomic Cache Cleanup Strategy

**Date:** 2025-12-27
**Status:** Accepted
**Context:** Cache Corruption from Partial Builds

### Problem

During systematic debugging of a TypeScript enum issue, we discovered that failed production builds create corrupted cache artifacts that persist across dev server restarts, causing runtime errors.

**Specific Issues Encountered:**
1. `Error: Cannot find module './169.js'` - Webpack manifest corruption
2. `TypeError: Cannot read properties of undefined (reading 'clientModules')` - RSC registry corruption

### Root Cause Analysis

Next.js build pipeline is **not atomic**:
- If build fails at stage 3 (RSC compilation), stages 1-2 artifacts persist
- Turbo caches these partial artifacts
- Dev server restores corrupted state from cache

**Multi-Layer Caching:**
1. `.next/` - Next.js build output
2. `.turbo/` - Turbo monorepo cache
3. `node_modules/.cache` - Node module cache

**Critical Finding:** Cleaning only `.next` is insufficient because Turbo restores from `.turbo/` cache.

### Decision

Implement **atomic cache cleanup** strategy with the following components:

#### 1. Package.json Scripts

```json
{
  "scripts": {
    "clean:cache": "node scripts/clean-cache.js",
    "dev:clean": "npm run clean:cache && turbo run dev",
    "build:clean": "npm run clean:cache && turbo run build",
    "build:safe": "node scripts/safe-build.js",
    "verify:build": "node scripts/verify-build.js"
  }
}
```

#### 2. Build Safety Scripts

- `clean-cache.js` - Atomically removes ALL cache layers
- `safe-build.js` - Production build with automatic cleanup on failure
- `verify-build.js` - Build integrity verification

#### 3. Turbo Configuration

```json
{
  "pipeline": {
    "build": {
      "outputMode": "errors-only"
    }
  },
  "remoteCache": {
    "enabled": false
  }
}
```

#### 4. Developer Documentation

Comprehensive guide at `docs/CACHE_MANAGEMENT.md` covering:
- Problem explanation
- Command reference
- Troubleshooting
- Best practices
- CI/CD integration

### Consequences

**Positive:**
- ✅ Prevents cache corruption runtime errors
- ✅ Automatic cleanup on build failures
- ✅ Developer-friendly commands (`npm run clean:cache`)
- ✅ Build integrity verification
- ✅ Clear documentation for team

**Negative:**
- ⚠️ Requires developers to understand cache management
- ⚠️ Adds minor overhead to development workflow (when cleaning needed)

**Neutral:**
- ℹ️ Slightly longer build times after cache cleanup (expected, acceptable trade-off)

### Alternatives Considered

1. **Manual `.next` cleanup only**
   - ❌ Rejected: Turbo restores from cache, ineffective

2. **Disable Turbo caching completely**
   - ❌ Rejected: Loses build performance benefits

3. **Hook-based automatic cleanup**
   - 🤔 Considered: Pre-commit hooks
   - ❌ Rejected: Too aggressive, slows down normal development

4. **CI-only safety measures**
   - ❌ Rejected: Doesn't help local development

### Implementation

**Files Created:**
- `scripts/clean-cache.js` - Atomic cache cleanup
- `scripts/safe-build.js` - Safe production build
- `scripts/verify-build.js` - Build verification
- `docs/CACHE_MANAGEMENT.md` - Developer documentation
- `docs/ARCHITECTURE_DECISIONS.md` - This ADR

**Files Modified:**
- `package.json` - Added cache management scripts
- `turbo.json` - Build failure handling configuration
- `.gitignore` - Consolidated cache entries
- `README.md` - Added cache cleanup guidance

### Success Metrics

1. **Elimination of cache corruption errors** - Primary goal
2. **Developer awareness** - Team understands when to clean caches
3. **CI reliability** - No cache-related CI failures

### Related Issues

- Original TypeScript enum issue (resolved)
- Runtime module resolution errors (resolved via cache cleanup)
- RSC clientModules errors (resolved via cache cleanup)

### References

- [Systematic Debugging Session Notes](../CACHE_MANAGEMENT.md#technical-details)
- [Next.js Build Process](https://nextjs.org/docs/app/building-your-application/deploying)
- [Turbo Caching Documentation](https://turbo.build/repo/docs/core-concepts/caching)

---

## Template for Future ADRs

```markdown
## ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Context:** [Brief description]

### Problem
[What problem are we solving?]

### Decision
[What did we decide to do?]

### Consequences
**Positive:**
- [List positive outcomes]

**Negative:**
- [List negative outcomes]

### Alternatives Considered
1. [Alternative 1]
   - [Why rejected]

### Implementation
[How was this implemented?]

### References
[Links to related documents]
```
