# LocalShare - Nachbarschafts-Plattform

PWA für Nachbarschafts-Communities zum Teilen von Anzeigen (verkaufen, vermieten, verleihen, suchen).

## Features

- **SSO Authentication**: Google & Microsoft OAuth2
- **Gemeinschaften**: Nachbarschafts-Communities erstellen/verwalten
- **Gruppen**: Gruppen werden innerhalb von Communities verwaltet
- **Breadcrumb Navigation**: Übersichtliche Navigation zwischen Communities und Gruppen
- **Listings**: Anzeigen mit Bildern (max 3), Kategorien und Filtern
- **Multilingual**: Deutsch & Französisch (vollständig übersetzt)
- **PWA**: Installierbar auf allen Geräten

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 10, Prisma, PostgreSQL 15 |
| Frontend | Next.js 14 (App Router), shadcn/ui, Tailwind CSS |
| Auth | Passport (Google/Microsoft OAuth2), JWT |
| i18n | next-intl (de/fr) |
| Monorepo | Turborepo |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with OAuth credentials

# 3. Start database
docker compose up -d postgres

# 4. Setup database
cd apps/backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed  # optional test data

# 5. Start dev servers
cd ../..
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## Project Structure

```
apps/
├── backend/           # NestJS API (port 3001)
│   ├── src/
│   │   ├── auth/      # OAuth2 + JWT
│   │   ├── users/     # Profile management
│   │   ├── communities/
│   │   ├── groups/
│   │   ├── listings/  # + image upload
│   │   └── database/  # Prisma service
│   └── prisma/        # Schema + migrations
│
└── frontend/          # Next.js 14 (port 3000)
    └── src/
        ├── app/[locale]/  # i18n routing
        │   ├── auth/       # OAuth callback
        │   ├── communities/
        │   │   └── [id]/   # inkl. Gruppen-Verwaltung
        │   ├── groups/[id]/ # Gruppen-Detailseite
        │   ├── listings/
        │   ├── profile/
        │   ├── privacy/    # Datenschutz
        │   ├── terms/      # AGB
        │   └── imprint/    # Impressum
        ├── components/
        │   ├── ui/        # shadcn + breadcrumb, collapsible
        │   ├── communities/
        │   ├── groups/
        │   └── listings/
        └── messages/      # de.json, fr.json

packages/
└── shared/            # Types & Zod schemas
```

## API Endpoints

All routes prefixed with `/api/v1/`:

| Module | Endpoints |
|--------|-----------|
| Auth | `GET /auth/google`, `/auth/microsoft`, `POST /auth/refresh`, `/auth/logout` |
| Users | `GET/PATCH/DELETE /users/me` |
| Communities | CRUD + `/join?token=`, `/leave`, `/refresh-invite`, `/members` |
| Groups | CRUD + `/join?token=`, `/leave`, `/preview/:token` (Filter: `?communityId=`) |
| Listings | CRUD + `POST /:id/images` |

## Environment Variables

Key variables in `.env`:

```env
DATABASE_URL=postgresql://localshare:changeme@localhost:5433/localshare
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Docker Deployment

```bash
docker compose up -d
```

Services: postgres (5433), backend (3001), frontend (3000)

## Scripts

```bash
npm run dev              # Start frontend + backend
npm run build            # Build all packages
npm run lint             # Lint all packages
scripts/kill-port.sh     # Kill process on port (default: 3001)
```

## Recent Changes (v1.1)

- **Groups Hierarchy**: Gruppen werden jetzt unter Communities verwaltet (standalone `/groups` entfernt)
- **Breadcrumb Navigation**: Neue Navigation auf Community- und Gruppen-Seiten
- **Member Sorting**: Owner erscheint zuerst in Mitgliederlisten
- **i18n Complete**: Alle Seiten vollständig übersetzt (de/fr)
- **Graceful Shutdown**: Backend fährt sauber herunter bei SIGTERM/SIGINT

## License

AGPL-3.0
