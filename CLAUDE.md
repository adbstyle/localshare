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
│   │   ├── common/   # Decorators (@CurrentUser, @Public)
│   │   └── database/ # Prisma service
│   └── prisma/       # Schema + migrations + seed
└── frontend/         # Next.js 14 (port 3000)
    └── src/
        ├── app/[locale]/  # i18n routing (de/fr)
        ├── components/    # UI components (shadcn/ui)
        ├── hooks/         # use-auth, use-toast
        └── lib/           # API client, utilities
packages/
└── shared/           # Shared types (future)
```

### Database Schema (Prisma)
Key models: `User`, `SsoAccount`, `Community`, `CommunityMember`, `Group`, `GroupMember`, `Listing`, `ListingImage`, `ListingVisibility`

Listings have visibility rules - they can be shared with specific communities or groups. The `VisibilityService` handles access control.

### API Routes
All backend routes are prefixed with `/api/v1/`:
- `/auth/*` - OAuth flows, token refresh, logout
- `/users/me` - Profile management
- `/communities/*` - Community CRUD, join/leave
- `/groups/*` - Group CRUD within communities
- `/listings/*` - Listing CRUD with image upload

### Auth Flow
1. User clicks OAuth login → redirected to Google/Microsoft
2. Callback returns to backend → validates & creates/links user
3. Backend issues JWT (15min) + refresh token (90d, httpOnly cookie)
4. Frontend stores access token in localStorage
5. API client auto-refreshes on 401

### Frontend State
Auth state uses a lightweight global pattern in `use-auth.ts` (no Redux/Zustand). The `api.ts` client handles auth headers and token refresh automatically.

## Key Patterns

### Backend
- Use `@CurrentUser()` decorator to get authenticated user
- Use `@Public()` decorator for unauthenticated endpoints
- Services handle business logic; controllers handle HTTP
- Soft delete pattern: set `deletedAt` instead of deleting

### Frontend
- All pages use `[locale]` dynamic route for i18n
- Use `useTranslations()` for all user-facing text
- Use shadcn/ui components from `@/components/ui/*`
- Protected pages use `useAuth()` hook

## Environment Setup

Copy `.env.example` to `.env` at root level. Key variables:
- `DATABASE_URL` - PostgreSQL connection (use port 5433 for local Docker)
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth credentials
- `MICROSOFT_CLIENT_ID/SECRET` - Microsoft OAuth credentials
- `NEXT_PUBLIC_API_URL` - Backend URL for frontend

Local database uses port 5433 (not 5432) to avoid conflicts:
```
DATABASE_URL=postgresql://localshare:changeme_in_production@localhost:5433/localshare
```

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