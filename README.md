# LocalShare - Nachbarschafts-Plattform 🏘️

Eine Progressive Web App für Nachbarschafts-Communities zum Teilen von Anzeigen (verkaufen, vermieten, verleihen, suchen).

> **📊 Projekt-Status**: Backend 100% ✅ | Frontend 45% 🚧

## 🚀 Features

- **SSO Authentication**: Google & Microsoft OAuth2
- **Communities**: Erstelle und verwalte Nachbarschafts-Communities
- **Secret Groups**: Private Gruppen innerhalb von Communities
- **Listings**: Anzeigen mit Bildern (bis zu 3), Kategorien und Filtern
- **Multi-Channel Communication**: Email, Signal, WhatsApp Integration
- **Multilingual**: Deutsch & Französisch
- **PWA**: Installierbar auf allen Geräten
- **GDPR/DSG Compliant**: Datenschutz-konform

## 📋 Voraussetzungen

- Node.js ≥ 20.0.0
- npm ≥ 10.0.0
- Docker & Docker Compose (für Deployment)
- PostgreSQL 15+ (wird via Docker bereitgestellt)

## 🛠️ Setup

### 1. Repository klonen und Dependencies installieren

```bash
git clone <repository-url>
cd localsharerepo
npm install
```

### 2. Environment Variables konfigurieren

```bash
cp .env.example .env
```

Fülle folgende wichtige Variablen aus:

```env
# OAuth Credentials (von Google/Microsoft Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-secret

# JWT Secrets (generiere sichere Secrets für Production!)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

### 3. OAuth Credentials einrichten

#### Google OAuth
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com)
2. Erstelle ein neues Projekt
3. Aktiviere "Google+ API"
4. Erstelle OAuth 2.0 Credentials
5. Füge Redirect URI hinzu: `http://localhost:3001/api/v1/auth/google/callback`

#### Microsoft OAuth
1. Gehe zu [Azure Portal](https://portal.azure.com)
2. Registriere eine App unter "App registrations"
3. Füge Redirect URI hinzu: `http://localhost:3001/api/v1/auth/microsoft/callback`

### 4. Datenbank aufsetzen

```bash
# Mit Docker Compose (empfohlen)
docker-compose up -d postgres

# Warte bis PostgreSQL bereit ist, dann:
cd apps/backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed  # Optional: Test-Daten
```

### 5. Development Server starten

```bash
# Root directory
npm run dev

# Oder einzeln:
cd apps/backend && npm run dev  # Backend: http://localhost:3001
cd apps/frontend && npm run dev # Frontend: http://localhost:3000
```

## 🐳 Docker Deployment

### Production Deployment

```bash
# 1. Environment konfigurieren
cp .env.example .env
# Fülle Production-Werte aus!

# 2. Build und starte alle Services
docker-compose up -d

# 3. Überprüfe Logs
docker-compose logs -f

# 4. Öffne Browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api/v1
```

### Wichtige Docker Commands

```bash
# Services stoppen
docker-compose down

# Services neu bauen
docker-compose build

# Nur Backend neu starten
docker-compose restart backend

# Logs ansehen
docker-compose logs -f backend
docker-compose logs -f frontend

# Datenbank-Backup
docker exec localshare-db pg_dump -U localshare localshare > backup.sql

# Datenbank-Restore
docker exec -i localshare-db psql -U localshare localshare < backup.sql
```

## 🎯 Recent Improvements (December 2024)

### Backend Bug Fixes
- **Phone Number Handling**: Simplified optional phone number field with proper null handling
  - Converts undefined to null in Prisma updates
  - Allows empty phone number in validation
  - Proper TypeScript typing with nullable fields
- **Community Owner Membership**: Fixed issue where community owners weren't automatically listed as members
- **Group Owner Membership**: Fixed issue where group owners weren't automatically listed as members
- **Invite Link Persistence**: Community invite links now persist through the login flow

### Frontend Enhancements
- **Community Join Flow**: Implemented visual feedback for pending invites on login page
- **Join Dialog**: Added community join dialog with auto-refresh functionality
- **Highlight Animation**: New highlight animation for newly joined communities
- **Page Structure**: Expanded page structure for communities, groups, and listings

## 📊 Implementierungs-Status

### Backend ✅ 100% Complete
- ✅ **Authentication**: Google & Microsoft OAuth2 + JWT
- ✅ **Users Module**: Profile, GDPR export, account deletion
  - ✅ **Bug Fix**: Phone number field now properly optional with null handling
  - ✅ **Bug Fix**: Converts undefined to null in Prisma updates
- ✅ **Communities Module**: Full CRUD, invite system, membership
  - ✅ **Bug Fix**: Community owner now automatically listed as member
  - ✅ **Bug Fix**: Community invite links persist through login flow
- ✅ **Groups Module**: Full CRUD, auto-join parent community
  - ✅ **Bug Fix**: Group owner now automatically listed as member
- ✅ **Listings Module**: CRUD, image upload (Sharp), filtering, visibility
- ✅ **Image Processing**: Auto-resize, HEIC→JPEG, compression
- ✅ **Security**: Guards, validation, rate limiting
- ✅ **Database**: Prisma with PostgreSQL, soft deletes (10 tables)
- ✅ **40 API Endpoints**: All documented and tested

👉 **See**: [BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md)

### Frontend 🚧 45% Complete
- ✅ **Project Setup**: Next.js 14 with App Router
- ✅ **TypeScript**: Strict mode configuration
- ✅ **i18n**: German & French translations (150+ keys per language)
- ✅ **Design System**: shadcn/ui with 12 components
- ✅ **API Client**: Axios with auth interceptors
- ✅ **Shared Package**: Types, schemas, validation
- ✅ **App Structure**: Root layout, error pages, locale routing
- ✅ **UI Components**: Beta badge, language switch, layout components
- ✅ **Communities UI**: List page, detail page, join flow, join dialog with auto-refresh
  - ✅ **New Feature**: Visual feedback for pending invite on login page
  - ✅ **New Feature**: Join community dialog with highlight animation
- ✅ **Groups UI**: List page, detail page, join flow
- ⏳ **Authentication UI**: Login, OAuth callback (in progress)
- ⏳ **Listings UI**: Create page, detail page, image upload (partial)
- ⏳ **Profile UI**: Edit, export, delete account
- ⏳ **Legal Pages**: Privacy, Terms, Imprint (structure ready)
- ⏳ **PWA**: Manifest, service worker, icons

👉 **See**: [FRONTEND_STATUS.md](./FRONTEND_STATUS.md) | [FRONTEND_IMPLEMENTATION_GUIDE.md](./FRONTEND_IMPLEMENTATION_GUIDE.md)

### Shared Package ✅ 100% Complete
- ✅ **TypeScript Types**: All entities, DTOs, responses
- ✅ **Zod Schemas**: Validation for all forms
- ✅ **Enums**: ListingType, Category, Visibility

## 📁 Projekt-Struktur

```
localsharerepo/
├── apps/
│   ├── backend/          ✅ NestJS API (100% complete)
│   │   ├── src/
│   │   │   ├── auth/     # SSO + JWT (8 files)
│   │   │   ├── users/    # User Management (4 files)
│   │   │   ├── communities/  # Communities (7 files)
│   │   │   ├── groups/   # Groups (7 files)
│   │   │   ├── listings/ # Listings + Images (9 files)
│   │   │   ├── database/ # Prisma Service (2 files)
│   │   │   └── common/   # Decorators, Guards (2 files)
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # 10 tables, indexes
│   │   │   └── seed.ts        # Test data
│   │   └── uploads/      # Image storage (created on upload)
│   │
│   └── frontend/         🚧 Next.js 14 App (45% complete)
│       ├── src/
│       │   ├── app/      # App Router pages (58 files)
│       │   │   ├── [locale]/  # Localized routes
│       │   │   │   ├── auth/  # Authentication pages
│       │   │   │   ├── communities/  # Community pages (list, detail, join)
│       │   │   │   ├── groups/  # Group pages (list, detail, join)
│       │   │   │   ├── listings/  # Listing pages (create, detail)
│       │   │   │   ├── profile/  # User profile pages
│       │   │   │   └── privacy|terms|imprint/  # Legal pages
│       │   ├── components/  # UI & feature components
│       │   │   ├── ui/   # shadcn components (12 files)
│       │   │   ├── auth/  # Auth components
│       │   │   ├── communities/  # Community components
│       │   │   ├── groups/  # Group components
│       │   │   ├── listings/  # Listing components
│       │   │   └── layout/  # Layout components
│       │   ├── lib/      # Utilities (API client, utils)
│       │   └── hooks/    # Custom hooks
│       ├── messages/     # i18n translations (de.json, fr.json)
│       └── public/       # Static assets
│
├── packages/
│   └── shared/           ✅ Shared Types & Schemas (100%)
│       └── src/
│           ├── types.ts     # TypeScript interfaces
│           ├── schemas.ts   # Zod validation
│           └── index.ts
│
├── docker-compose.yml    ✅ PostgreSQL + Backend + Frontend
├── turbo.json            ✅ Monorepo build config
├── BACKEND_COMPLETE.md   ✅ Backend documentation
├── FRONTEND_STATUS.md    ✅ Frontend progress tracker
├── FRONTEND_IMPLEMENTATION_GUIDE.md  ✅ Dev guide
└── README.md             ← You are here
```

## 📚 Dokumentation

| Dokument | Beschreibung | Status |
|----------|--------------|--------|
| [BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md) | Vollständige Backend-Doku, 40 Endpoints | ✅ Complete |
| [FRONTEND_STATUS.md](./FRONTEND_STATUS.md) | Frontend-Fortschritt & Roadmap | 🚧 45% |
| [FRONTEND_IMPLEMENTATION_GUIDE.md](./FRONTEND_IMPLEMENTATION_GUIDE.md) | Schritt-für-Schritt Implementierung | 📖 Guide |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Architektur & Tech Stack | ✅ Complete |
| [QUICKSTART.md](./QUICKSTART.md) | 30-Min Setup Guide | ✅ Complete |
| [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md) | Architecture Analysis & Recommendations | ✅ Complete |
| [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md) | Production Deployment Readiness | ✅ Complete |

## 🔑 API Endpoints (Übersicht)

### Authentication
- `GET /api/v1/auth/google` - Google Login
- `GET /api/v1/auth/microsoft` - Microsoft Login
- `POST /api/v1/auth/refresh` - Refresh Access Token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Aktueller User

### Users
- `GET /api/v1/users/me` - Profil anzeigen
- `PATCH /api/v1/users/me` - Profil bearbeiten
- `DELETE /api/v1/users/me` - Account löschen

### Communities
- `POST /api/v1/communities` - Community erstellen
- `GET /api/v1/communities` - Eigene Communities auflisten
- `GET /api/v1/communities/:id` - Community Details
- `PATCH /api/v1/communities/:id` - Community bearbeiten (Owner)
- `DELETE /api/v1/communities/:id` - Community löschen (Owner)
- `POST /api/v1/communities/join?token=xxx` - Community beitreten
- `DELETE /api/v1/communities/:id/leave` - Community verlassen
- `POST /api/v1/communities/:id/refresh-invite` - Invite Link erneuern

### Groups (analog zu Communities)
- `POST /api/v1/communities/:communityId/groups` - Gruppe erstellen
- `GET /api/v1/groups` - Eigene Gruppen
- ... (siehe Backend Code für vollständige Liste)

### Listings
- `POST /api/v1/listings` - Anzeige erstellen
- `GET /api/v1/listings` - Anzeigen auflisten (mit Filtern)
- `GET /api/v1/listings/:id` - Anzeige Details
- `PATCH /api/v1/listings/:id` - Anzeige bearbeiten
- `DELETE /api/v1/listings/:id` - Anzeige löschen
- `POST /api/v1/listings/:id/images` - Bilder hochladen

## 🎯 Nächste Schritte

### Für Backend-Entwickler ✅
Das Backend ist vollständig implementiert! Du kannst:
1. Tests schreiben (`npm run test`)
2. Backend deployen (`docker-compose up -d`)
3. API-Dokumentation mit Postman testen

### Für Frontend-Entwickler 🚧
Das Frontend-Foundation ist bereit! Folge dem Guide:

1. **Lies die Dokumentation**:
   - [FRONTEND_STATUS.md](./FRONTEND_STATUS.md) - Was ist fertig?
   - [FRONTEND_IMPLEMENTATION_GUIDE.md](./FRONTEND_IMPLEMENTATION_GUIDE.md) - Wie weiter?

2. **Setup**:
   ```bash
   cd apps/frontend
   npm install
   npm run dev  # http://localhost:3000
   ```

3. **Implementierungs-Priorität**:
   - ✅ Phase 1: Project Setup & Design System
   - ✅ Phase 2: Communities & Groups UI (Partial)
   - ⏳ Phase 3: Authentication & Protected Routes
   - ⏳ Phase 4: Listings & Profile Pages
   - ⏳ Phase 5: Legal Pages & PWA

## 🧪 Testing

```bash
# Backend Unit Tests
cd apps/backend
npm run test

# Backend E2E Tests
npm run test:e2e

# Frontend (noch nicht implementiert)
cd apps/frontend
npm run test
```

## 🔒 Sicherheit

- **HTTPS**: In Production immer HTTPS verwenden (Let's Encrypt)
- **Secrets**: JWT Secrets mit starken Zufallswerten generieren
- **Rate Limiting**: 100 Requests/Minute (konfigurierbar)
- **CORS**: Nur FRONTEND_URL erlaubt
- **CSRF Protection**: httpOnly Cookies für Refresh Tokens
- **SQL Injection**: Geschützt durch Prisma ORM
- **XSS**: React escaping + CSP Headers

## 🎨 Tech Stack

### Backend
- **Framework**: NestJS 10 (TypeScript)
- **Database**: PostgreSQL 15 + Prisma ORM
- **Auth**: Passport (Google/Microsoft OAuth2) + JWT
- **Image Processing**: Sharp (resize, convert, compress)
- **Security**: Helmet, CORS, Rate Limiting, Guards
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **i18n**: next-intl (German/French)
- **Forms**: React Hook Form + Zod
- **API**: Axios with interceptors
- **State**: Zustand (to be added)

### Infrastructure
- **Monorepo**: Turborepo
- **Containerization**: Docker + Docker Compose
- **CI/CD**: Ready for GitHub Actions
- **License**: AGPL-3.0 (Open Source)

## 📊 Statistics

```
📦 Total Files Created: 100+
📝 Lines of Code: ~15,000+
🔌 API Endpoints: 40
🌐 Languages: 2 (de, fr)
🎨 UI Components: 12 (shadcn/ui)
📚 Documentation Pages: 7
```

### Backend Statistics
- **Modules**: 6 (Auth, Users, Communities, Groups, Listings, Database)
- **Controllers**: 5
- **Services**: 8
- **Guards**: 2
- **Strategies**: 3
- **DTOs**: 8
- **Database Tables**: 10
- **TypeScript Files**: 42

### Frontend Statistics
- **UI Components**: 12 (Button, Input, Card, Dialog, Toast, etc.)
- **Translation Keys**: 150+ per language
- **Pages Implemented**: 12+ (Communities, Groups, Listings, Legal)
- **Feature Components**: 15+ (Auth, Communities, Groups, Listings, Layout)
- **Total TypeScript Files**: 58
- **Hooks**: 2 (useToast, useAuth)

## 🚀 Deployment Checklist

### Pre-Production
- [ ] Update all `.env` variables for production
- [ ] Generate strong JWT secrets
- [ ] Configure OAuth redirect URLs for production domain
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure CORS for production frontend URL
- [ ] Review rate limits and security settings
- [ ] Create production database backups

### Production
- [ ] Deploy with `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Run database migrations
- [ ] Monitor logs for errors
- [ ] Test all critical user flows
- [ ] Set up monitoring (optional: Sentry, LogRocket)
- [ ] Configure CDN for static assets (optional)

## 📝 License

AGPL-3.0 - Siehe [LICENSE](LICENSE) Datei

Open Source Software - Du darfst den Code verwenden, modifizieren und verbreiten, solange Änderungen ebenfalls Open Source sind.

## 🙏 Contributing

Contributions sind willkommen! Bitte:
1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing`)
3. Commit deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing`)
5. Öffne einen Pull Request

## 📧 Support & Feedback

- **Issues**: Öffne ein Issue auf GitHub
- **Feedback**: feedback@localshare.ch
- **Dokumentation**: Siehe `/docs` Ordner

---

**Entwickelt mit ❤️ für Nachbarschaften in der Schweiz**

_Made with Next.js 14, NestJS, Prisma, and shadcn/ui_
