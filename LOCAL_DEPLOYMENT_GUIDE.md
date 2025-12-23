# LocalShare - Local Deployment Guide

This guide will help you deploy and test the LocalShare application on your local machine.

## Prerequisites

- **Node.js**: v18+ (you have v22.16.0 ✅)
- **npm**: v8+ (you have v10.9.2 ✅)
- **Docker**: Latest version ✅
- **PostgreSQL**: Running on port 5433 ✅

## Quick Start (5 minutes)

### 1. Database Setup ✅ DONE

The PostgreSQL database is already running on port 5433:
```bash
docker compose ps postgres
# STATUS: Up (healthy) ✅
```

Database schema has been created ✅

### 2. Configure Environment Variables

The `.env` file is already created at the project root with these settings:

```bash
# PostgreSQL
POSTGRES_USER=localshare
POSTGRES_PASSWORD=changeme_in_production
POSTGRES_DB=localshare

# Backend API
DATABASE_URL=postgresql://localshare:changeme_in_production@localhost:5433/localshare
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=90d

# OAuth2 Credentials (⚠️ NEED TO CONFIGURE)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:3001/api/v1/auth/microsoft/callback

# URLs
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**⚠️ IMPORTANT**: OAuth2 credentials are placeholder values. For testing without OAuth:
- You can skip OAuth setup initially
- The app will work except for login functionality
- See "OAuth Setup (Optional)" section below

### 3. Start the Backend

```bash
# From project root
cd apps/backend

# Load environment variables and start
export $(cat ../../.env | grep -v '^#' | xargs) && npm run dev
```

**Expected output**:
```
🚀 Backend running on http://localhost:3001
```

**Backend will be available at**: http://localhost:3001/api/v1

### 4. Start the Frontend (New Terminal)

```bash
# From project root (in a NEW terminal)
cd apps/frontend

# Start Next.js dev server
npm run dev
```

**Expected output**:
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

**Frontend will be available at**: http://localhost:3000

### 5. Test the Application

Open your browser to: **http://localhost:3000**

You should see:
- ✅ LocalShare landing page
- ✅ Beta badge in header
- ✅ Navigation menu (Listings, Communities, Groups)
- ⚠️ Login buttons (will only work if OAuth is configured)

## Testing Without OAuth (Recommended for Initial Testing)

Since OAuth requires external setup, here's how to test the core functionality:

### Option 1: Create a Test User Directly in Database

```bash
# Connect to PostgreSQL
docker exec -it localshare-db psql -U localshare -d localshare

# Create a test user
INSERT INTO "User" (id, email, "firstName", "lastName", "ssoProvider", "preferredLanguage", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test',
  'User',
  'GOOGLE',
  'de',
  NOW(),
  NOW()
);

# Exit PostgreSQL
\q
```

### Option 2: Skip Authentication Temporarily

You can modify the backend to bypass auth for testing:

```typescript
// apps/backend/src/auth/guards/jwt-auth.guard.ts
// Comment out the @UseGuards decorator temporarily on protected routes
```

## OAuth Setup (Optional - For Full Functionality)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/v1/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "App registrations" → "New registration"
3. Configure:
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `http://localhost:3001/api/v1/auth/microsoft/callback`
4. Copy Application (client) ID and create a new client secret
5. Add to `.env`

## Troubleshooting

### Backend Won't Start - "JwtStrategy requires a secret"

**Problem**: Environment variables not loaded

**Solution**:
```bash
# Make sure to export env vars before starting
cd apps/backend
export $(cat ../../.env | grep -v '^#' | xargs)
npm run dev
```

### Port Already in Use

**Problem**: Port 3000 or 3001 already in use

**Solution**:
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
```

### Database Connection Error

**Problem**: Can't connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL container is running
docker compose ps postgres

# If not running, start it
docker compose up -d postgres

# Check logs
docker compose logs postgres
```

### Frontend Shows "Network Error"

**Problem**: Frontend can't reach backend

**Solution**:
1. Verify backend is running: http://localhost:3001/api/v1/health
2. Check `NEXT_PUBLIC_API_URL` in `.env` is set to `http://localhost:3001`
3. Restart frontend after changing env vars

## Available API Endpoints

### Health Check
```bash
curl http://localhost:3001/api/v1/health
```

### Auth Endpoints
- `GET /api/v1/auth/google` - Google OAuth login
- `GET /api/v1/auth/microsoft` - Microsoft OAuth login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Listings
- `GET /api/v1/listings` - Get all listings
- `POST /api/v1/listings` - Create listing
- `GET /api/v1/listings/:id` - Get listing by ID
- `PATCH /api/v1/listings/:id` - Update listing
- `DELETE /api/v1/listings/:id` - Delete listing
- `POST /api/v1/listings/:id/images` - Upload images

### Communities
- `GET /api/v1/communities` - Get all communities
- `POST /api/v1/communities` - Create community
- `GET /api/v1/communities/:id` - Get community by ID
- `PATCH /api/v1/communities/:id` - Update community
- `DELETE /api/v1/communities/:id` - Delete community
- `POST /api/v1/communities/join/:token` - Join via invite

### Groups
- `GET /api/v1/groups` - Get all groups
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups/:id` - Get group by ID
- `PATCH /api/v1/groups/:id` - Update group
- `DELETE /api/v1/groups/:id` - Delete group
- `POST /api/v1/groups/join/:token` - Join via invite

## Testing Features

### 1. Browse Listings (No Auth Required)
- Navigate to http://localhost:3000/listings
- You should see the listings page (empty initially)
- Try the filters sidebar

### 2. View Legal Pages (No Auth Required)
- Privacy Policy: http://localhost:3000/privacy
- Terms of Service: http://localhost:3000/terms
- Imprint: http://localhost:3000/imprint

### 3. Test PWA Features
- Open DevTools → Application → Service Workers
- Verify service worker is registered
- Try offline mode (DevTools → Network → Offline)
- Navigate to http://localhost:3000/offline

### 4. Create Content (Requires Auth)
After setting up OAuth or creating a test user:
- Create a community
- Create a group within that community
- Create a listing and share it with the community
- Test invite links

## Development Workflow

### Make Changes to Backend

```bash
cd apps/backend
# Edit files - hot reload is enabled
# Check http://localhost:3001/api/v1 for changes
```

### Make Changes to Frontend

```bash
cd apps/frontend
# Edit files - hot reload is enabled
# Check http://localhost:3000 for changes
```

### Run Database Migrations

```bash
cd apps/backend
npx prisma migrate dev --name your_migration_name
```

### View Database

```bash
cd apps/backend
npx prisma studio
# Opens at http://localhost:5555
```

## Stopping the Application

### Stop Services
```bash
# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal

# Stop database
docker compose down postgres
```

### Clean Everything
```bash
# Remove database data
docker compose down -v

# Remove node_modules
npm run clean
```

## Next Steps

1. ✅ **You're here**: Local deployment working
2. ⚠️ **Configure OAuth**: Set up Google/Microsoft credentials
3. ✅ **Test Core Features**: Create communities, groups, listings
4. 📝 **Review QA Report**: Check `PRODUCTION_READINESS_REPORT.md` for known issues
5. 🚀 **Deploy to Production**: Follow production deployment guide

## Quick Reference

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | ⏳ Not started |
| Backend API | http://localhost:3001/api/v1 | ⏳ Not started |
| Database | localhost:5433 | ✅ Running |
| Prisma Studio | http://localhost:5555 | ⏳ Not started |

## Need Help?

- **Architecture Issues**: See `ARCHITECTURE_REVIEW.md`
- **Known Bugs**: See `PRODUCTION_READINESS_REPORT.md`
- **Feature Status**: See `MVP_IMPLEMENTATION_COMPLETE.md`

## Common Commands Cheat Sheet

```bash
# Install dependencies
npm install

# Start database
docker compose up -d postgres

# Start backend (with env vars)
cd apps/backend && export $(cat ../../.env | grep -v '^#' | xargs) && npm run dev

# Start frontend
cd apps/frontend && npm run dev

# View database
cd apps/backend && npx prisma studio

# Run migrations
cd apps/backend && npx prisma migrate dev

# Check database status
docker compose ps postgres

# View logs
docker compose logs -f postgres

# Stop everything
docker compose down
```

---

**Ready to Test!** 🎉

Start the backend and frontend as described above, then open http://localhost:3000 in your browser.
