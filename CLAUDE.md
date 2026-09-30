# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **IMPORTANT: Documentation Maintenance**
>
> This file and README.md must be kept up-to-date with all changes to the codebase:
>
> - **Adding features**: Document new functionality, API endpoints, components, or patterns
> - **Removing features**: Remove references to deleted code and update affected sections
> - **Changing features**: Update descriptions, code examples, and usage patterns
> - **Schema changes**: Update the Database Schema section when tables/columns change
> - **Dependency updates**: Update the Tech Stack table when versions change significantly
>
> Keeping documentation current ensures AI assistants always have accurate context for the codebase.

## Output Style

In all interactions be extremely concise and sacrifice grammar for the sake of concision.

## Core Development Principles

- **KISS Principle**: Keep solutions simple and straightforward
- **YAGNI Principle**: Don't add functionality until it's actually needed
- **Minimal Changes**: Only change what is explicitly requested
- **Think First**: Carefully analyze requirements before proposing changes
- **No Invention**: Don't add features, abstractions, or complexity that wasn't asked for
- **Self-Documenting Code**: Prefer explicit, clear code over comments explaining complex logic
- **Naming Conventions**: Use descriptive names (camelCase for variables, PascalCase for classes, SNAKE_CASE for constants)
- **Single Responsibility**: Keep functions single-purpose; avoid side effects when possible
- **Type Safety**: Type annotations are required where supported (e.g., Python, TypeScript)
- **Function Size**: Avoid large functions — refactor if a function exceeds 50 lines

## Project Overview

LocalShare is a neighborhood sharing platform (Turborepo monorepo) with:
- **Backend**: NestJS + Prisma + PostgreSQL (port 3001)
- **Frontend**: Next.js 14 App Router + shadcn/ui + Tailwind CSS (port 3000)
- **Auth**: OAuth2 SSO (Google/Microsoft) with JWT + refresh tokens

## Common Commands

### Development
```bash
# Start all services (from root)
npm run dev

# Start only backend
cd apps/backend && npm run dev

# Start only frontend
cd apps/frontend && npm run dev

# Start database
docker-compose up -d postgres
```

### Database (from apps/backend)
```bash
npx prisma generate          # Generate Prisma client
npx prisma migrate dev --name <change>   # Create + apply a migration after editing schema.prisma
npx prisma migrate status    # Show applied/pending migrations
npx prisma db seed          # Seed test data
npx prisma studio           # Open Prisma Studio GUI
```

Schema changes go through migrations in `prisma/migrations/` (baseline `0_init` = state of Railway prod as of 2026-09-29). Deploys apply pending migrations via `prisma migrate deploy` (Dockerfile `CMD`). Do not use `prisma db push` or hand-written SQL against shared databases; old hand-written SQL lives in `prisma/legacy-sql/` for reference only.

New tables must enable RLS in their own migration (`ALTER TABLE "x" ENABLE ROW LEVEL SECURITY;`), see `20260930000000_enable_rls`. On Supabase this keeps them unreachable for the Data API roles; the app connects as table owner and is unaffected.

Existing local DB created via `db push` before the baseline: run `npx prisma migrate resolve --applied 0_init` and `npx prisma migrate resolve --applied 20260929000000_thumbnail_filename_text` once (or `npx prisma migrate reset` to rebuild it).

### Build & Test
```bash
npm run build               # Build all packages
npm run lint                # Lint all packages
npm run test                # Run tests
npm run type-check          # TypeScript check (frontend)
cd apps/frontend && npm test  # Frontend unit tests (node:test via tsx, src/**/*.test.ts)
```

Backend integration tests (`apps/backend/test/integration/*.int-spec.ts`) run the real Nest app over HTTP against a local database `localshare_test` (same Docker Postgres, port 5433; override with `TEST_DATABASE_URL`). The global setup rebuilds that database from the migrations and refuses any URL that is not localhost and `*_test`:
```bash
docker-compose up -d postgres
cd apps/backend && npm run test:int
```
Known bugs are pinned as `it.failing` until their fix lands. `npm run test` (unit tests in `apps/backend/test/**/*.spec.ts`) needs no database.

### Docker
```bash
docker-compose up -d postgres    # Start only database
docker-compose up -d             # Start all services
docker-compose logs -f           # View logs
```

## Architecture

### Monorepo Structure
```
apps/
├── backend/           # NestJS API (port 3001)
│   ├── src/
│   │   ├── access/   # Visibility + permission rules (where builders, assert*, viewer)
│   │   ├── auth/     # OAuth2 strategies, JWT, guards
│   │   ├── users/    # User profile management
│   │   ├── communities/  # Community CRUD + membership (+ membership.cascade.ts)
│   │   ├── groups/   # Groups within communities
│   │   ├── listings/ # Listings + images (listing-query.ts: feed where/includes)
│   │   ├── common/   # Decorators, types, utils
│   │   │   ├── decorators/  # @CurrentUser, @Public
│   │   │   ├── types/       # Pagination types
│   │   │   └── utils/       # Prisma + storage-provider utilities
│   │   └── database/ # Prisma service, HealthController (/health, /health/db)
│   ├── prisma/       # Schema + migrations + seed (legacy-sql/ = old hand SQL)
│   └── test/         # Jest unit tests (`*.spec.ts`, import from `@jest/globals`)
└── frontend/         # Next.js 14 (port 3000)
    ├── public/
    │   └── images/          # Static image assets
    │       ├── how-it-works/  # Step illustrations
    │       └── neighbors-sharing.jpg  # Hero background
    └── src/
        ├── app/[locale]/  # i18n routing (de/fr)
        │   ├── auth/callback/  # OAuth callback
        │   ├── communities/    # Community pages
        │   ├── groups/         # Group pages
        │   ├── listings/       # Listing CRUD pages
        │   ├── profile/        # User profile
        │   ├── imprint/        # Legal: Impressum
        │   ├── privacy/        # Legal: Privacy policy
        │   └── terms/          # Legal: Terms of service
        ├── components/
        │   ├── ui/           # shadcn/ui components
        │   ├── auth/         # Login components (login-page.tsx)
        │   ├── layout/       # Header, Footer, UserMenu
        │   ├── communities/  # Community cards, dialogs
        │   ├── groups/       # Group dialogs
        │   ├── listings/     # Listing cards, forms, filters
        │   └── how-it-works.tsx  # How-it-works section
        ├── hooks/         # use-auth, use-toast, use-error-toast
        └── lib/
            ├── api/       # client (axios + refresh), errors, per-resource queries
            └── utils/     # url-filters, parse-invite
packages/
└── shared/           # Shared types (future)
```

### Database Schema (Prisma)
Key models: `User`, `SsoAccount`, `RefreshToken`, `Community`, `CommunityMember`, `Group`, `GroupMember`, `Listing`, `ListingImage`, `ListingVisibility`, `ListingBookmark`

Key enums:
- `ListingType`: SELL, RENT, LEND, SEARCH
- `ListingCategory`: ELECTRONICS, FURNITURE, SPORTS, CLOTHING, HOUSEHOLD, GARDEN, BOOKS, TOYS, TOOLS, FOOD, SERVICES, VEHICLES, OTHER
- `PriceTimeUnit`: HOUR, DAY, WEEK, MONTH
- `VisibilityType`: COMMUNITY, GROUP

Listings have visibility rules - they can be shared with specific communities or groups. All access rules live in `src/access/` (see Key Patterns).

### API Routes
All backend routes are prefixed with `/api/v1/`:
- `/auth/*` - OAuth flows, token refresh, logout
- `/users/me` - Profile management
- `/communities/*` - Community CRUD, join/leave, member management (owner can remove members)
- `/groups/*` - Group CRUD within communities, member management (owner can remove members)
- `/listings/*` - Listing CRUD with image upload, bookmarks
- `/health` - Liveness (no DB), `/health/db` - runs `SELECT 1` (daily Vercel cron keeps the Supabase Free project from pausing); `/auth/health` kept for compatibility

### Auth Flow
1. User clicks OAuth login → redirected to Google/Microsoft
2. Callback returns to backend → `AuthService.validateSsoUser` finds user by SSO account (provider + providerUserId), else creates one. Email rules:
   - Empty email or provider user id → rejected. Emails are stored trimmed + lowercase, looked up case-insensitively
   - **No account linking by email**: email of an existing user → `account_exists`, of a soft-deleted user → `account_deleted` (Microsoft `mail`/UPN unverified (nOAuth), Google addresses can be reassigned)
   - New account needs a verified email where the provider reports it (Google `email_verified`); returning users are not checked
   - Rejections throw `SsoLoginException`; `SsoLoginExceptionFilter` redirects to `/auth/callback?error=<code>`, which shows `auth.loginErrors.<code>`
3. Backend issues JWT (15min) + refresh token (90d) as HTTPOnly cookies (refresh token stored as SHA-256 hash, rotated on every refresh)
4. Frontend redirects to `/auth/callback` (no token in URL)
5. API client sends cookies automatically (`withCredentials: true`)
6. On 401, client calls `/auth/refresh` to get new tokens via cookies

### Frontend State
Server state goes through TanStack Query (`QueryProvider` in `[locale]/layout.tsx`); no Redux/Zustand.
- `lib/api/client.ts`: axios instance with HTTPOnly cookies. On 401 it refreshes once and retries; parallel 401s share one refresh (the backend rotates the refresh token). If the refresh fails, the cached user is set to `null`.
- `lib/api/<resource>.ts`: query keys, fetchers and `queryOptions()`. Keys are hierarchical by REST resource (`['me']`, `['listings','detail',id]`, …) so a prefix invalidates everything below it.
- `useAuth()` reads `meQuery`: `{ user, loading, logout }`. After changing the profile, write the response with `queryClient.setQueryData(authKeys.me, …)`.
- Error toasts: `useErrorToast()(error, 'errors.failedToX')`. It maps 403/404/network errors to i18n keys; backend messages (English) are never shown.

## Key Patterns

### Backend
- Use `@CurrentUser()` decorator to get authenticated user
- Use `@Public()` decorator for unauthenticated endpoints
- Services handle business logic; controllers handle HTTP
- Soft delete pattern: set `deletedAt` instead of deleting
- **Access rules live only in `src/access/`**:
  - `access.where.ts`: pure Prisma where fragments (`visibleListingWhere`, `memberOfCommunity`, `memberOfGroup`, `shownVisibilityWhere`). Reads apply them inside their own query.
  - `AccessService`: `assertListingVisible/Owner`, `assertCommunityMember/Owner`, `assertGroupMember/Owner`, `assertShareTargets`. Not visible → 404, visible but not allowed → 403.
  - `permissions.ts`: `listingViewer` / `communityViewer`, returned as `viewer` in responses. The frontend reads `viewer.*` instead of comparing ids.
- Ending a membership (leave, remove, delete community/group/account) goes through `communities/membership.cascade.ts` inside a transaction: shares of the user's listings in the community and its groups are removed, groups the user owns pass to the community owner.
- Route ids and invite tokens use `ParseUUIDPipe` (malformed → 400)

### Frontend
- All pages use `[locale]` dynamic route for i18n
- Use `useTranslations()` for all user-facing text (including alt text)
- Use Next.js `Image` component from `next/image` for all images (exception: local file previews using data URLs may use native `<img>` for Android gallery compatibility)
- Use shadcn/ui components from `@/components/ui/*`
- Protected pages use `useAuth()` hook
- Static images go in `public/images/` directory

## Environments (Vercel + Supabase, live since 2026-09-30)

| Environment | Frontend | Backend | Branch | Supabase project |
|-------------|----------|---------|--------|------------------|
| Production | app.localshare.ch | api.localshare.ch | `main` | `localshare-prod` (eu-central-1) |
| Staging | staging.localshare.ch | api-staging.localshare.ch | `develop` | `localshare-staging` (eu-central-2) |

- Vercel projects `localshare-frontend` / `localshare-backend` (Hobby, region `fra1`), Git-connected: push to `main` → production, push to `develop` → staging (branch domains); other branches → preview deployments (staging DB)
- Backend = NestJS zero-config (entrypoint `src/main.ts`); each app has a `vercel.json` with an explicit `buildCommand` (Vercel's Turbo auto-detection breaks on our turbo v1 setup); `.vercelignore` keeps local `.env` files out of CLI uploads
- Backend build (`npm run vercel-build`) applies pending migrations when `PRISMA_MIGRATE_ON_DEPLOY=true` (set for production and the `develop` branch only)
- Frontend previews and `staging.localshare.ch` require Vercel login (Deployment Protection); the backend project has protection off
- Daily Vercel cron `/api/v1/health/db` keeps the Supabase Free project from pausing (runs on production only; staging may pause and must then be resumed in the Supabase dashboard)
- Supabase (separate LocalShare account, Free plan): public bucket `listing-images` (WebP/JPEG, 5 MB), Data API off, RLS on all tables via migration. Local credentials in `apps/backend/.env.supabase-{staging,prod}.local` (gitignored)
- DNS at Infomaniak (CNAMEs to `*.vercel-dns-017.com`, TTL 15 min); cookie domain `.localshare.ch`; OAuth callbacks unchanged (`api[-staging].localshare.ch/api/v1/auth/{google|microsoft}/callback`)
- Previous hosting (Railway + Cloudflare R2) was decommissioned after the migration, see `docs/supabase-vercel-migration.md`

## Environment Setup

Copy `.env.example` to `.env` at root level. Key variables:
- `DATABASE_URL` - PostgreSQL connection (use port 5433 for local Docker)
- `DIRECT_URL` - Connection used by Prisma for migrations (`directUrl`). Same as `DATABASE_URL` locally; on Supabase the session pooler (:5432) while `DATABASE_URL` is the transaction pooler (:6543)
- `PRISMA_MIGRATE_ON_DEPLOY` - Vercel only: `true` lets the build apply pending migrations
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - JWT signing keys
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth credentials
- `MICROSOFT_CLIENT_ID/SECRET` - Microsoft OAuth credentials
- `NEXT_PUBLIC_API_URL` - Backend URL for frontend
- `STORAGE_PROVIDER` - `local` or `s3` for image storage
- `S3_*` - S3-compatible storage config: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, `S3_FORCE_PATH_STYLE` (only if STORAGE_PROVIDER=s3)
- `COOKIE_DOMAIN` - Cookie domain for cross-subdomain auth (e.g., `.wylergut.ch` with leading dot in production, empty for localhost)

Local database uses port 5433 (not 5432) to avoid conflicts:
```
DATABASE_URL=postgresql://localshare:changeme_in_production@localhost:5433/localshare
```

### Image Storage

#### Static Images (Frontend)
Static UI images (hero backgrounds, illustrations, icons) go in `apps/frontend/public/images/`:
- Use Next.js `Image` component with `fill` prop for backgrounds
- Use `priority` prop for above-the-fold images (hero backgrounds)
- Always provide i18n alt text via translation keys

#### User-Generated Images (Backend)
Two storage backends supported for user uploads:
- **local**: Files saved to `/uploads/listings/` (default for dev)
- **s3**: S3-compatible bucket via `S3_*` (production/staging: Supabase Storage bucket `listing-images`)

Image URLs are computed at read time from `S3_PUBLIC_URL` + filename, so switching buckets needs no DB change.

Uploads: the frontend downscales every picked image in the browser (`src/lib/image-resize.ts`, JPEG, max 1280 px wide = the width the backend stores) before upload. Downscaling is what keeps a 3-image request below Vercel's 4.5 MB limit; the backend's 4 MB per-file limit is only a backstop. The backend still resizes/re-encodes to WebP + thumbnail with sharp.

## i18n (Internationalization)

Frontend supports German (de) and French (fr). Translations in `apps/frontend/messages/*.json`. Always add translations for both languages when adding user-facing text.

## Testing OAuth Locally

1. Create OAuth credentials in Google Cloud Console / Azure Portal
2. Set redirect URIs to `http://localhost:3001/api/v1/auth/{google|microsoft}/callback`
3. Add credentials to `.env`

## E2E Testing with OAuth

For automated QA/Playwright tests using real OAuth flow:

1. Create a dedicated test Google account (e.g., `localshare.test@gmail.com`)
2. Add to `.env`:
   ```
   TEST_USER_EMAIL=localshare.test@gmail.com
   TEST_USER_PASSWORD=your-test-password
   ```
3. QA skill/Playwright reads these env vars to perform real login
4. **Important**: Disable 2FA on the test account or use App Passwords

### CLAUDE.md Updates Required

| Change Type              | Sections to Update                                        |
| ------------------------ | --------------------------------------------------------- |
| New feature/page         | Project Structure, Common Tasks, relevant feature section |
| New API endpoint         | API Routes section                                        |
| New component            | Project Structure, Component Structure if patterns change |
| Database change          | Database Schema section                                   |
| New dependency           | Tech Stack table                                          |
| New environment variable | Environment Variables section                             |
| PWA changes              | PWA Features section                                      |
| Auth flow changes        | Authentication Flow section                               |

### README.md Updates Required

- Update when user-facing features change
- Update setup instructions when dependencies or env vars change
- Keep getting started guide current with actual workflow

### When to Update

1. **Before committing**: Review if any documentation needs updating
2. **After feature completion**: Ensure full documentation of new functionality
3. **After removing code**: Remove stale references from documentation
4. **After refactoring**: Update structural documentation if paths/patterns changed