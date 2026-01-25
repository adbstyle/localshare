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
npx prisma migrate dev       # Run migrations
npx prisma db seed          # Seed test data
npx prisma studio           # Open Prisma Studio GUI
```

### Build & Test
```bash
npm run build               # Build all packages
npm run lint                # Lint all packages
npm run test                # Run tests
npm run type-check          # TypeScript check (frontend)
```

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
│   │   ├── auth/     # OAuth2 strategies, JWT, guards
│   │   ├── users/    # User profile management
│   │   ├── communities/  # Community CRUD + membership
│   │   ├── groups/   # Groups within communities
│   │   ├── listings/ # Listings + images + visibility
│   │   ├── common/   # Decorators, types, utils
│   │   │   ├── decorators/  # @CurrentUser, @Public
│   │   │   ├── types/       # Pagination types
│   │   │   └── utils/       # Prisma utilities
│   │   └── database/ # Prisma service
│   └── prisma/       # Schema + migrations + seed
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
        │   ├── terms/          # Legal: Terms of service
        │   └── offline/        # PWA offline page
        ├── components/
        │   ├── ui/           # shadcn/ui components
        │   ├── auth/         # Login components (login-page.tsx)
        │   ├── layout/       # Header, Footer, UserMenu
        │   ├── communities/  # Community cards, dialogs
        │   ├── groups/       # Group dialogs
        │   ├── listings/     # Listing cards, forms, filters
        │   └── how-it-works.tsx  # How-it-works section
        ├── hooks/         # use-auth, use-toast, use-media-query
        └── lib/           # API client, utilities
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

Listings have visibility rules - they can be shared with specific communities or groups. The `VisibilityService` handles access control.

### API Routes
All backend routes are prefixed with `/api/v1/`:
- `/auth/*` - OAuth flows, token refresh, logout
- `/users/me` - Profile management
- `/communities/*` - Community CRUD, join/leave, member management (owner can remove members)
- `/groups/*` - Group CRUD within communities, member management (owner can remove members)
- `/listings/*` - Listing CRUD with image upload, bookmarks

### Auth Flow
1. User clicks OAuth login → redirected to Google/Microsoft
2. Callback returns to backend → validates & creates/links user
3. Backend issues JWT (15min) + refresh token (90d) as HTTPOnly cookies
4. Frontend redirects to `/auth/callback` (no token in URL)
5. API client sends cookies automatically (`withCredentials: true`)
6. On 401, client calls `/auth/refresh` to get new tokens via cookies

### Frontend State
Auth state uses a lightweight global pattern in `use-auth.ts` (no Redux/Zustand). The `api.ts` client handles token refresh automatically via HTTPOnly cookies.

## Key Patterns

### Backend
- Use `@CurrentUser()` decorator to get authenticated user
- Use `@Public()` decorator for unauthenticated endpoints
- Services handle business logic; controllers handle HTTP
- Soft delete pattern: set `deletedAt` instead of deleting

### Frontend
- All pages use `[locale]` dynamic route for i18n
- Use `useTranslations()` for all user-facing text (including alt text)
- Use Next.js `Image` component from `next/image` for all images (never use `<img>` tags)
- Use shadcn/ui components from `@/components/ui/*`
- Protected pages use `useAuth()` hook
- Static images go in `public/images/` directory

## Environments (Railway)

| Environment | Frontend | Backend | Branch | R2 Bucket |
|-------------|----------|---------|--------|-----------|
| Production | localshare.wylergut.ch | api.localshare.wylergut.ch | `main` | localshare-images |
| Staging | staging.localshare.wylergut.ch | api-staging.localshare.wylergut.ch | `develop` | localshare-images-staging |

- Auto-deploy: Push to `develop` → Staging, Push to `main` → Production
- Each environment has separate PostgreSQL database
- Cookie domain: `.localshare.wylergut.ch` (shared between frontend/backend)
- OAuth callbacks configured for both environments in Google/Microsoft Console

## Environment Setup

Copy `.env.example` to `.env` at root level. Key variables:
- `DATABASE_URL` - PostgreSQL connection (use port 5433 for local Docker)
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - JWT signing keys
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth credentials
- `MICROSOFT_CLIENT_ID/SECRET` - Microsoft OAuth credentials
- `NEXT_PUBLIC_API_URL` - Backend URL for frontend
- `STORAGE_PROVIDER` - `local` or `r2` for image storage
- `R2_*` - Cloudflare R2 credentials (only if STORAGE_PROVIDER=r2)
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
- **r2**: Cloudflare R2 bucket (for production)

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