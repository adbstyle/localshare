# Migrationsplan: Railway + R2 → Vercel + Supabase

Stand: 29. September 2026 (Schritt 1 aktualisiert) · Recherche-Datum aller Quellen: 2026-09-06, Vercel-NestJS-Support: 2026-09-29

## Kontext

LocalShare läuft heute auf Railway (NestJS-API, Next.js-Frontend, 2× Postgres) mit Bildern in Cloudflare R2. Ziel: alles auf **Vercel** (Frontend + Backend) und **Supabase** (Postgres + Storage), mit möglichst wenig Umbau.

Entscheidungen (mit Adrian abgestimmt):
- **NestJS bleibt 1:1**, läuft als eine Vercel Function (Express-Adapter). Kein Rewrite.
- **Auth bleibt** (eigenes JWT/Passport, Cookies auf `.localshare.ch`). Kein Wechsel auf Supabase Auth.
- **Zwei Supabase-Projekte** (`localshare-staging`, `localshare-prod`), Region eu-central-1 (Frankfurt), gepaart mit Vercel-Region `fra1`.

Warum das «einfach» geht (verifiziert im Code):
- Backend ist stateless: kein Cron, keine Websockets, kein Cache, keine Queues.
- Kein Raw-SQL, keine Postgres-Extensions → DB-Wechsel = Connection-String.
- Bild-URLs werden zur Lesezeit aus `filename` gebaut (`listings.service.ts`) → Storage-Wechsel = Env-Vars, kein DB-Backfill.
- `@localshare/shared` wird vom Backend nicht importiert → Backend-Projekt kann Root Directory `apps/backend` nutzen.
- Frontend ist eine reine Client-SPA, keine Server-Fetches, kein Custom Server.

## Was zwingend angepasst werden muss (serverless-Stolpersteine)

| # | Problem heute | Fix |
|---|---|---|
| 1 | Uploads: 3 × 10 MB in **einem** Multipart-Request → Vercel-Limit 4.5 MB (HTTP 413) | Client-seitiges Downscaling vor Upload (Canvas, ≤1600 px JPEG) → ~2 MB total. Server-Sharp-Pipeline (WebP 1280 px + Thumb 400 px, EXIF-Strip) bleibt unverändert. |
| 2 | `refreshTokens()` lädt **alle** aktiven Refresh-Tokens und macht bcrypt.compare in Schleife (O(n)) | SHA-256-Hash + `findUnique` auf `tokenHash` (Spalte ist bereits `@unique`). Kein Schema-Change. Folge: einmaliger Re-Login aller User beim Release von Schritt 1 (Railway). Danach überleben Sessions den Cutover. |
| 3 | `ThrottlerGuard` in-memory, kein `trust proxy` → hinter Vercel-Proxy teilen sich alle User eine IP | Throttler entfernen; Vercel-DDoS-Schutz / Firewall nutzen. |
| 4 | Keine echte Prisma-Migrationshistorie (nur 5 lose `.sql`, `.gitignore` ignoriert `migrations/*_*/`!) | `.gitignore` fixen, Baseline `0_init` erzeugen, auf Supabase `migrate resolve --applied`. |
| 5 | `schema.prisma` ohne `directUrl` | Pooler: `DATABASE_URL` = Port 6543 `?pgbouncer=true&connection_limit=5`, `DIRECT_URL` = Port 5432 (Migrationen). `binaryTargets` nicht nötig, Prisma generiert auf Vercel nativ für `rhel-openssl-3.0.x`. |
| 6 | `image.service.ts` hat R2 hart verdrahtet (`useR2`, `R2_*`) | Generischer S3-Provider (`STORAGE_PROVIDER=s3`, `S3_ENDPOINT/REGION/BUCKET/ACCESS_KEY_ID/SECRET_ACCESS_KEY/PUBLIC_URL/FORCE_PATH_STYLE`). Supabase Storage ist S3-kompatibel. |
| 7 | Supabase Data API exponiert `public`-Schema via anon key | Data API deaktivieren (Project Settings → API) + RLS auf allen Tabellen aktivieren (Prisma verbindet als `postgres`, unbetroffen). |
| 8 | Vercel fängt `app.listen()` ab, wartet nach dem Modul-Import aber nur 1000 ms darauf. Das eager `$connect()` in `PrismaService.onModuleInit` verzögert `listen()` | `$connect()` entfernen, Prisma verbindet bei der ersten Abfrage. |

## Umsetzung

### Schritt 0: Doku
- Diesen Plan als `docs/supabase-vercel-migration.md` ins Repo (Konvention wie `docs/atproto-feasibility.md`: deutsch, `Stand:`-Zeile, nummerierte Sektionen).

### Schritt 1: Backend serverless-fähig machen (`apps/backend`) — umgesetzt in `feature/167-backend-serverless`
Vercel unterstützt NestJS seit 17.10.2025 ohne Konfiguration (`@vercel/nestjs`). `src/main.ts` wird als Entrypoint erkannt, `app.listen()` abgefangen und eine Catch-all-Route automatisch gesetzt. Ein Serverless-Wrapper (`serverless.ts`, `api/index.js`), Rewrites und `NODEJS_HELPERS=0` sind deshalb **nicht nötig**. Bei einem abgefangenen Server hängt Vercel keine Body-Helper an, Multer bekommt den rohen Stream.

Änderungen (Railway-kompatibel, geht vor dem Cutover live):
- `src/listings/image.service.ts`: generischer S3-Provider aus `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, `S3_FORCE_PATH_STYLE`. Jeder `STORAGE_PROVIDER` ausser `local` nutzt S3, auch das heutige `r2`.
- `src/common/utils/storage-provider.ts` (neu): gemeinsame Regel für `image.service.ts` und die Static-Assets-Bedingung in `src/main.ts`.
- `src/database/prisma.service.ts`: kein eager `$connect()` mehr (1-s-Listen-Fenster von Vercel).
- `src/auth/auth.service.ts`: Refresh-Token `randomBytes(32)` + SHA-256, Lookup per `findUnique` statt bcrypt-Schleife.
- `src/app.module.ts`: Throttler entfernt. `bcryptjs`, `@types/bcryptjs`, `@nestjs/throttler` deinstalliert.
- `vercel.json` (neu): nur `"regions": ["fra1"]`.
- Railway-Env vor dem Merge: `S3_*` aus den bestehenden `R2_*`-Werten (Endpoint `https://<account>.r2.cloudflarestorage.com`, Region `auto`). `R2_*` und `STORAGE_PROVIDER=r2` bleiben für den Rollback stehen.

Bewusst in spätere Schritte verschoben, damit Railway nicht bricht: Multer-Limit 4 MB (Schritt 3), `directUrl` + `migrate-on-deploy.js` (Schritt 2), `railpack.json` löschen (Schritt 7).

Unverändert und geprüft: `OwnershipGuard` (`req.route.path` enthält den Prefix), Passport-`require`, sharp 0.33.5 und Prisma 5.22 ohne Bump.

### Schritt 2: Prisma-Baseline
1. `.gitignore`: Zeilen `apps/backend/prisma/migrations/*_*/` + `!…/.gitkeep` entfernen.
2. Lose `.sql` nach `prisma/legacy-sql/` verschieben.
3. Drift-Check (muss leer sein): `npx prisma migrate diff --from-url "$RAILWAY_DB" --to-schema-datamodel prisma/schema.prisma --script`
4. Baseline: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql` + `migration_lock.toml`.
5. `schema.prisma`: `directUrl = env("DIRECT_URL")`. `DIRECT_URL` vorher auf Railway und lokal setzen (lokal = `DATABASE_URL`).
6. `scripts/migrate-on-deploy.js` (neu): `prisma migrate deploy` nur wenn `VERCEL_GIT_COMMIT_REF` ∈ {`main`,`develop`}, eingebunden als Script `vercel-build`.

### Schritt 3: Frontend (`apps/frontend`)
- `src/lib/image-resize.ts` (neu): `downscaleImage(file, maxEdge=1600, q=0.85)` via `createImageBitmap({imageOrientation:'from-image'})` → Canvas → JPEG; `<img>`-Fallback für alte Safari. Bonus: HEIC von iOS wird im Browser dekodiert.
- Backend `src/listings/listings.controller.ts`: Multer `fileSize` auf 4 MB, erst zusammen mit dem Downscaling.
- `src/components/listings/image-upload.tsx`: `downscaleImage` in `handleFileChange` vor beiden Zweigen (Sofort-Upload und Pending-Files); falls Summe > 4 MB, sequentiell ein Request pro Datei; 413 → bestehender `errors.failedToUploadImages`-Toast.
- `next.config.js`: beide `rewrites` löschen; `remotePatterns` `*.r2.dev` ersetzen durch `<ref>.supabase.co` + `pathname: '/storage/v1/object/public/**'` (staging + prod).
- Optional: dreifach dupliziertes `getImageUrl` (`listing-card.tsx`, `listings/[id]/page.tsx`, `image-upload.tsx`) nach `src/lib/image-url.ts` ziehen.
- Löschen: `start.sh` (Script `start` → `next start`), Stray-Ordner `apps/frontend/apps/`.

### Schritt 4: Infrastruktur anlegen
Supabase (je staging/prod, eu-central-1):
- Projekt, Bucket `listing-images` (public), S3 Access Keys (Storage → S3), Data API aus, RLS an.

Vercel (2 Projekte, gleiche Repo, Production-Branch `main`, Staging = Branch `develop` mit branch-scoped Env + Domains):

| | `localshare-frontend` | `localshare-backend` |
|---|---|---|
| Root Directory | `apps/frontend` | `apps/backend` |
| Framework | Next.js | NestJS (Zero-Config) |
| Ignored Build Step | `npx turbo-ignore` | `npx turbo-ignore` |
| Domains | `app.localshare.ch` (main), `staging.localshare.ch` (develop) | `api.localshare.ch` (main), `api-staging.localshare.ch` (develop) |

Env Backend: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `GOOGLE_*`/`MICROSOFT_*` (Callbacks unverändert, da Domains gleich bleiben), `FRONTEND_URL`, `COOKIE_DOMAIN=.localshare.ch`, `NODE_ENV=production`, `STORAGE_PROVIDER=s3`, `S3_ENDPOINT=https://<ref>.storage.supabase.co/storage/v1/s3`, `S3_REGION=eu-central-1`, `S3_BUCKET=listing-images`, `S3_FORCE_PATH_STYLE=true`, `S3_PUBLIC_URL=https://<ref>.supabase.co/storage/v1/object/public/listing-images`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
Env Frontend: `NEXT_PUBLIC_API_URL=https://api.localshare.ch` bzw. `…api-staging…`, `NEXT_PUBLIC_FEEDBACK_EMAIL`. `BACKEND_URL` entfällt.
Turbo v1 (`pipeline`-Key) ist mit repo-installiertem turbo 1.13.4 auf Vercel ok.

### Schritt 5: Daten migrieren (erst Staging als Probelauf, dann Prod)
```bash
# Client-Tools >= Server-Major (brew postgresql@17)
pg_dump "$RAILWAY_DB" -Fc --no-owner --no-privileges --schema=public \
  --exclude-table=public._prisma_migrations -f localshare.dump
pg_restore -d "postgresql://postgres.<ref>:<pw>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" \
  --no-owner --no-privileges --schema=public --exit-on-error localshare.dump
psql "$SUPABASE_DIRECT" -c "select (select count(*) from users),(select count(*) from listings),(select count(*) from listing_images);"
DATABASE_URL=… DIRECT_URL=… npx prisma migrate resolve --applied 0_init
npx prisma migrate status   # "up to date"
```
Bilder (flache Keys, 1:1):
```bash
rclone copy r2:localshare-images supa:listing-images --progress --transfers 16 --size-only
# Delta beim Cutover: --ignore-existing
```
(rclone `supa`-Remote: `provider=Other`, `endpoint=https://<ref>.storage.supabase.co/storage/v1/s3`, `region=eu-central-1`, `force_path_style=true`, `no_check_bucket=true`. Fallback: `aws s3 sync` mit `addressing_style path`.)

### Schritt 6: Cutover
**Phase A (kein Downtime):** Branch mit Schritten 2–3 (Schritt 1 ist dann schon auf Railway live) → Preview deployen → `/api/v1/auth/health`, `curl /main.js` (muss 404 sein) und ein Multipart-Upload testen (validiert Kaltstart-Listen, Body-Stream, sharp, Prisma-Engine). DNS-TTL der 4 Hostnames auf 60 s. Staging komplett durchspielen (Dump, Restore, rclone, merge `develop`, CNAMEs → `cname.vercel-dns.com`, Checkliste). Prod-Bucket vorab bulk-kopieren.

**Phase B (30–60 min Fenster):** Railway-Backend stoppen (Write-Freeze) → Dump/Restore/Resolve → rclone Delta → Domains in Vercel zuweisen → PR nach `main` mergen → CNAMEs `api.` + `app.` umstellen → Checkliste → 24 h Vercel- und Supabase-Logs beobachten.

**Rollback:** CNAMEs zurück auf Railway, Railway-Backend starten. Railway-DB und R2 wurden nie verändert; Schreibvorgänge nach Cutover gehen verloren. Railway + R2 1–2 Wochen behalten, dann löschen.

### Schritt 7: Doku nachziehen
`CLAUDE.md` (Environments-Tabelle, Migrations-Workflow), `README.md`, `docker-compose.yml` (Healthcheck-Pfad `/api/v1/auth/health`). Löschen: `apps/backend/railpack.json`, `R2_*`-Variablen. `S3_*` in `.env.example` und `CLAUDE.md` ist seit Schritt 1 erledigt, nur der Satz «Supabase Storage after migration» in `CLAUDE.md` (Image Storage) muss aktualisiert werden.

**Datenschutzerklärung** `apps/frontend/src/app/[locale]/privacy/page.tsx` (Zeilen «Datenbank» und «Bilder»): Hosting-Angaben Railway und Cloudflare R2 durch Vercel (Frankfurt) und Supabase (Frankfurt) ersetzen. Das ist Rechtstext, also zeitgleich mit dem Cutover live schalten.

## Verifikation (Checkliste nach jedem Deploy)
- `GET /api/v1/auth/health` → 200, Response-Header zeigen Vercel.
- Login Google und Microsoft → Redirect auf `/auth/callback`, `/auth/me` 200, Cookies `accessToken`/`refreshToken` mit `Domain=.localshare.ch`.
- `accessToken`-Cookie löschen → nächster Call triggert `POST /auth/refresh` → 200 (SHA-256-Pfad).
- Bestehendes Listing: Bilder + Thumbs laden von `<ref>.supabase.co/storage/v1/object/public/listing-images/…`.
- Neues Listing mit 3 grossen Handy-Fotos → ok, im Bucket ≈ ≤300 KB WebP + Thumb; Bild löschen; Cover setzen.
- Sichtbarkeit: Listing für Community-/Gruppen-Mitglied sichtbar, für Nicht-Mitglied nicht; Invite-Link-Join durch OAuth (`pendingInvite`-Cookie).
- Fremdes Listing editieren → 403 (OwnershipGuard). Logout → Cookies weg.
- Lokal: `npm run dev` unverändert (`main.ts`, `STORAGE_PROVIDER=local`), `npm run build` grün.

## Risiken / Unverifiziertes
| Risiko | Mitigation |
|---|---|
| Nest-Bootstrap braucht nach dem Import mehr als 1000 ms bis `listen()` → «Can't detect way to handle request» | Kein eager `$connect()`; erster Preview-Test; Fallback: Handler statt `listen()` exportieren |
| Vercel serviert Build-Output statisch (Quellcode-Leak) | Nach erstem Deploy `curl /main.js` → muss Nest-404 liefern |
| Prisma-Engine / sharp-Binary nicht ins Bundle getraced (Monorepo-Hoisting) | `includeFiles` in `vercel.json` oder Prisma `output` umstellen |
| Schema-Drift Railway-DB ≠ `schema.prisma` (SQL wurde von Hand angewendet) | Drift-Check in Schritt 2 muss leer sein |
| Cold Starts 1–3 s | Fluid Compute, `fra1` neben DB; akzeptabel |
| Pooler-Limits bei Fluid-Concurrency | `connection_limit=5`, Transaction Mode |
| Feature-Branch-Previews (`*.vercel.app`) können sich nicht einloggen (Cookie-Domain, Single-Origin-CORS) | Dokumentierte Einschränkung; Auth auf Staging testen |
| Alle User einmal ausgeloggt | Bewusst, beim Release von Schritt 1 |
| Ab Schritt 1 auch auf Railway kein App-Rate-Limit mehr | Gering: Der Throttler zählte hinter dem Proxy ohnehin alle User als eine IP. Nach dem Cutover übernimmt die Vercel Firewall |
| Lazy Prisma-Connect: falsche `DATABASE_URL` crasht nicht mehr beim Boot, `/auth/health` prüft die DB nicht | Erster echter Request nach Deploy (Checkliste) deckt es auf |
| Keine Tests im Repo | Manuelle Checkliste; Staging-Probelauf ist der Sicherheitsnetz |

Nicht verifiziert: Tracing von Prisma-Engine und sharp im npm-Monorepo, rclone-Listing gegen Supabase S3, Railway-Postgres-Version, exakte heutige Railway-Env-Werte (Annahme: Frontend ruft `api.localshare.ch` direkt, Rewrites sind in Prod tot).
