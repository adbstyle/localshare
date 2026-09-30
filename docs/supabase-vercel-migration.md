# Migrationsplan: Railway + R2 → Vercel + Supabase

Stand: 30. September 2026 (Schritte 1–5 aktualisiert) · Recherche-Datum aller Quellen: 2026-09-06, Vercel-NestJS-Support: 2026-09-29, Supabase-Free-Limits: 2026-09-30

## Kontext

LocalShare läuft heute auf Railway (NestJS-API, Next.js-Frontend, 2× Postgres) mit Bildern in Cloudflare R2. Ziel: alles auf **Vercel** (Frontend + Backend) und **Supabase** (Postgres + Storage), mit möglichst wenig Umbau.

Entscheidungen (mit Adrian abgestimmt):
- **NestJS bleibt 1:1**, läuft als eine Vercel Function (Express-Adapter). Kein Rewrite.
- **Auth bleibt** (eigenes JWT/Passport, Cookies auf `.localshare.ch`). Kein Wechsel auf Supabase Auth.
- **Zwei Supabase-Projekte** (`localshare-staging`, `localshare-prod`). Prod liegt in eu-central-1 (Frankfurt), gepaart mit der Vercel-Region `fra1`, Staging in eu-central-2 (Zürich), siehe Schritt 4.

Warum das «einfach» geht (verifiziert im Code):
- Backend ist stateless: keine Websockets, kein Cache, keine Queues. Seit Schritt 4 gibt es nur einen täglichen Keep-alive-Cron von Vercel.
- Kein Raw-SQL, abgesehen von `SELECT 1` im Health-Check seit Schritt 4, und keine Postgres-Extensions → DB-Wechsel = Connection-String.
- Bild-URLs werden zur Lesezeit aus `filename` gebaut (`listings.service.ts`) → Storage-Wechsel = Env-Vars, kein DB-Backfill.
- `@localshare/shared` wird vom Backend nicht importiert → Backend-Projekt kann Root Directory `apps/backend` nutzen.
- Frontend ist eine reine Client-SPA, keine Server-Fetches, kein Custom Server.

## Was zwingend angepasst werden muss (serverless-Stolpersteine)

| # | Problem heute | Fix |
|---|---|---|
| 1 | Uploads: 3 × 10 MB in **einem** Multipart-Request → Vercel-Limit 4.5 MB (HTTP 413) | Client-seitiges Downscaling vor Upload (Canvas, JPEG, max. 1280 px breit) → ~0,3–1 MB pro Bild. Server-Sharp-Pipeline (WebP 1280 px + Thumb 400 px, EXIF-Strip) bleibt unverändert. |
| 2 | `refreshTokens()` lädt **alle** aktiven Refresh-Tokens und macht bcrypt.compare in Schleife (O(n)) | SHA-256-Hash + `findUnique` auf `tokenHash` (Spalte ist bereits `@unique`). Kein Schema-Change. Folge: einmaliger Re-Login aller User beim Release von Schritt 1 (Railway). Danach überleben Sessions den Cutover. |
| 3 | `ThrottlerGuard` in-memory, kein `trust proxy` → hinter Vercel-Proxy teilen sich alle User eine IP | Throttler entfernen; Vercel-DDoS-Schutz / Firewall nutzen. |
| 4 | Keine echte Prisma-Migrationshistorie (nur 5 lose `.sql`, `.gitignore` ignoriert `migrations/*_*/`!) | `.gitignore` fixen, Baseline `0_init` aus der Railway-DB erzeugen, auf Railway `migrate resolve --applied`. Die Historie wandert danach mit dem Dump zu Supabase. |
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

Bewusst in spätere Schritte verschoben, damit Railway nicht bricht: Multer-Limit 4 MB (Schritt 3), `directUrl` (Schritt 2), `migrate-on-deploy.js` (Schritt 4), `railpack.json` löschen (Schritt 7).

Unverändert und geprüft: `OwnershipGuard` (`req.route.path` enthält den Prefix), Passport-`require`, sharp 0.33.5 und Prisma 5.22 ohne Bump.

### Schritt 2: Prisma-Baseline — umgesetzt in `feature/167-prisma-baseline`
Befund vom 2026-09-29:
- **Crash-Risiko.** Railway startet über das Dockerfile, und das führt vor dem Start `prisma migrate deploy` aus. Sobald `0_init` existiert, würde der Befehl die Baseline auf die volle DB anwenden und scheitern. Deshalb muss `0_init` vor dem Deploy auf jeder DB per `migrate resolve --applied` markiert werden.
- **Tabelle `_prisma_migrations`.** Sie existiert auf Staging, Production und lokal, aber jeweils leer.
- **Drift.** Die einzige Abweichung ist `listing_images.thumbnail_filename`. Auf Railway ist sie `VARCHAR` aus der alten Hand-SQL, im Schema und lokal `TEXT`.
- **Umgebungen.** Staging und Production sind schemagleich. Railway-Postgres läuft in Version 17.

Umsetzung:
1. `.gitignore`: Die Prisma-Ausnahme für Migrationsordner ist entfernt. Die 5 losen `.sql` liegen jetzt in `prisma/legacy-sql/`, nur noch zur Referenz.
2. `0_init` wurde **aus der Prod-DB** erzeugt: `prisma migrate diff --from-empty --to-url "$RAILWAY_PROD" --script`. Geprüft: Auf eine leere DB angewendet ist der Diff zur Prod-DB leer.
3. `20260929000000_thumbnail_filename_text` stellt `VARCHAR` auf `TEXT` um. In Postgres ist das eine reine Metadaten-Änderung ohne Tabellen-Rewrite. Railway wendet die Migration beim Deploy automatisch an. Geprüft: Danach ist der Diff zu `schema.prisma` leer.
4. `schema.prisma`: `directUrl = env("DIRECT_URL")`. `DIRECT_URL` steht in `.env.example` (zweimal), in `docker-compose.yml`, in der lokalen `.env` und auf Railway als Referenz `${{DATABASE_URL}}`.
5. Deploy-Reihenfolge je Umgebung:
   - `DIRECT_URL` setzen.
   - `DATABASE_URL=… DIRECT_URL=… npx prisma migrate resolve --applied 0_init` über die öffentliche DB-URL.
   - Mergen. Das Dockerfile wendet dann nur Migration 1 an.
6. Lokal: beide Migrationen per `migrate resolve --applied` markiert, weil die lokale DB schon `TEXT` hat.

`migrate-on-deploy.js` für Vercel wandert in Schritt 4. Es hängt am Vercel-Build und lässt sich erst dort testen.

### Schritt 3: Frontend (`apps/frontend`) — umgesetzt in `feature/167-client-image-downscale`
- `src/lib/image-resize.ts` (neu): `downscaleImage(file)` dekodiert per `createImageBitmap({ imageOrientation: 'from-image' })`, mit `<img>` als Fallback für ältere Engines wie iOS 15, die die Option ablehnen. Daraus wird ein JPEG mit Qualität 0,9 und **max. 1280 px Breite**, also genau der Breite, die das Backend speichert. Sichtbar ändert sich deshalb nichts. Pro Bild sind das etwa 0,3 bis 0,8 MB.
  - Transparente PNGs bekommen einen weissen Hintergrund.
  - Kann der Browser eine Datei nicht dekodieren, etwa HEIC ausserhalb von Safari, geht das Original hoch, falls es höchstens 4 MB hat. Sonst erscheint die neue Meldung `listings.imageProcessingFailed` (de/fr).
- `src/components/listings/image-upload.tsx` meldet über `onBusyChange` an `listing-form.tsx`, dass noch Bilder verarbeitet werden. Solange sind «Erstellen/Speichern» sowie Löschen und Cover setzen gesperrt, damit keine gerade gewählten Fotos verloren gehen. Die Komponente verkleinert jedes gewählte Bild, und zwar nacheinander, damit es keine Speicherspitzen auf dem Handy gibt. Das passiert vor beiden Zweigen: beim Sofort-Upload im Bearbeiten-Modus und bei den Pending-Files beim Erstellen. Die Vorschau zeigt schon das verkleinerte Bild. Ein Fallback «ein Request pro Datei» ist nicht nötig, weil 3 verkleinerte Bilder weit unter 4,5 MB bleiben. Nur wenn der Browser mehrere Originale nicht dekodieren kann (je ≤ 4 MB), kann Vercel einen Request mit 413 ablehnen. Dann erscheint die generische Upload-Fehlermeldung. Das ist bewusst akzeptiert, weil solche Dateien sehr selten sind.
- Backend `src/listings/listings.controller.ts`: Das Multer-Limit `fileSize` sinkt von 10 auf 4 MB. Das Limit bei der Auswahl im Frontend bleibt bei 10 MB.
- `next.config.js`: Beide `rewrites` und der dazugehörige `localhost:3000`-Eintrag in `remotePatterns` sind gelöscht. Production rief die API ohnehin direkt auf. Lokal zeigt `NEXT_PUBLIC_API_URL` jetzt auf `http://localhost:3001`, und `BACKEND_URL` entfällt.
- Verschoben: Die Supabase-Einträge in `remotePatterns` folgen in Schritt 4, weil die Projekt-Refs erst dort entstehen. `*.r2.dev` bleibt bis Schritt 7. `start.sh` und die Railway-Variable `BACKEND_URL` kommen in Schritt 7, weil Railway sie bis zum Cutover nutzt. Die Konsolidierung von `getImageUrl` ist nicht nötig (YAGNI).

### Schritt 4: Infrastruktur anlegen — umgesetzt in `feature/167-vercel-setup`
Entscheide vom 2026-09-30: **Supabase Free** und **Vercel Hobby**.

**Supabase**
- Eigener Account mit der Org «LocalShare». Das Free-Limit von 2 aktiven Projekten gilt pro Person, und Adrians Account ist mit KIFU ausgelastet. Adrians Account ist dort als Developer eingeladen. Damit der MCP-Connector die Org sieht, muss er in claude.ai neu autorisiert werden, die Org ist noch nicht freigegeben.
- `localshare-prod` in `eu-central-1` (Frankfurt), `localshare-staging` in `eu-central-2` (Zürich).
- Beide auf Postgres 17.6, die Data API ist aus.
- Bucket `listing-images` in beiden Projekten: public, nur `image/webp`, max. 5 MB, angelegt per SQL in `storage.buckets`. Die S3-Keys sind getestet: PutObject, öffentlicher GET mit 200 und identischen Bytes, DeleteObject.
- Migration `20260930000000_enable_rls` aktiviert RLS auf allen 12 Tabellen, `_prisma_migrations` inklusive, nur falls die Tabelle existiert, weil sie der Shadow-DB fehlt. Die App verbindet überall als Tabellen-Owner mit `BYPASSRLS` und ist nicht betroffen. Das ist geprüft auf Railway Staging und Prod, Supabase Staging und lokal.
- **Staging:** `migrate deploy` ist gelaufen, das Schema mit RLS steht, die DB ist ohne Daten.
- **Prod:** Die DB ist bewusst leer, bis zum Restore in Schritt 5.
- Zugangsdaten liegen lokal in `apps/backend/.env.supabase-{staging,prod}.local`, von Git ignoriert.
- **Pausieren:** Free-Projekte pausieren nach 7 Tagen ohne Aktivität. Der Vercel-Cron `17 4 * * *` ruft täglich `/api/v1/health/db` auf, das `SELECT 1` ausführt. Crons laufen nur auf Production-Deployments. **Bis zum Cutover kann das Prod-Projekt deshalb pausieren.** Schritt 5 sollte innerhalb einer Woche folgen, sonst muss das Projekt im Dashboard wieder gestartet werden. Staging darf pausieren.

**Vercel** (Team `adbstyles-projects`, Hobby):

| | `localshare-frontend` | `localshare-backend` |
|---|---|---|
| Root Directory | `apps/frontend` | `apps/backend` |
| Framework | Next.js | NestJS (Zero-Config, Entrypoint `src/main.ts`) |
| Build Command (`vercel.json`) | `npm run build` | `npm run vercel-build` = `prisma generate` + `scripts/migrate-on-deploy.js` |
| Node / Region | 22.x / `fra1` | 22.x / `fra1` |
| Git | erst beim Cutover verbinden | erst beim Cutover verbinden |
| Domains (Cutover) | `app.localshare.ch` (main), `staging.localshare.ch` (develop) | `api.localshare.ch` (main), `api-staging.localshare.ch` (develop) |

Erkenntnisse aus den ersten Deploys:
- **Expliziter `buildCommand` ist Pflicht.** Sonst erkennt Vercel Turbo und baut mit einem globalen Turbo 2.x. Das bricht ab, weil `packageManager` fehlt und `turbo.json` noch das v1-Format hat. `turbo-ignore` entfällt aus demselben Grund.
- **`.vercelignore` im Repo-Root ist Pflicht für CLI-Deploys.** Ohne sie lädt die CLI `.env`-Dateien mit hoch, und NestJS würde sie zur Laufzeit laden. Mit ihr umfasst der Upload rund 2,2 MB.
- **`migrate-on-deploy.js` läuft nur mit `PRISMA_MIGRATE_ON_DEPLOY=true`.** Ein Branch-Check reicht nicht, weil CLI-Deploys den lokalen Branch melden. Das Flag wird erst gesetzt, wenn die jeweilige Supabase-DB die restaurierten Daten enthält, also für Production und für die Preview von `develop`.
- **Target explizit setzen.** Der erste CLI-Deploy eines Projekts ohne Git wurde trotz `--target=preview` Production, also mit Production-Variablen. Previews haben Vercel Authentication aktiv, getestet wird mit `vercel curl`.
- **Backend-Preview funktioniert:**
  - Health liefert 200, auch direkt nach dem Kaltstart. Das 1-s-Fenster für `listen()` reicht also.
  - `/auth/me` liefert 401.
  - `/main.js`, `/src/main.ts` und `/package.json` liefern 404, es gibt kein Quellcode-Leak.
  - Ohne `DATABASE_URL` meldet Prisma sauber den fehlenden Wert.
- **Frontend-Preview funktioniert:** Der Build dauert 2 min, alle Seiten liefern 200, und `/api/*` liefert 404, weil der Rewrite entfernt ist.
- **Backend-Preview gegen Supabase-Staging funktioniert:**
  - `/health/db` liefert 200, der Transaction-Pooler :6543 funktioniert also von `fra1` aus.
  - Eine echte Prisma-Abfrage (Community-Preview) liefert 404, wie erwartet.
  - `/auth/me` und `/auth/refresh` liefern 401.
  - Das Log meldet `ImageService: Using S3 storage`.

Env Backend, **vollständig gesetzt**. Preview hat Staging-Werte, Production hat Prod-Werte:
- Von Railway übernommen: `JWT_SECRET`, `GOOGLE_*`, `MICROSOFT_*`, `FRONTEND_URL`, `COOKIE_DOMAIN`.
- Datenbank: `DATABASE_URL` (Pooler :6543 `?pgbouncer=true&connection_limit=5`) und `DIRECT_URL` (Session-Pooler :5432).
- Speicher: `STORAGE_PROVIDER=s3`, `S3_ENDPOINT`, `S3_REGION` (jeweilige Projektregion), `S3_BUCKET=listing-images`, `S3_FORCE_PATH_STYLE=true`, `S3_PUBLIC_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- `PRISMA_MIGRATE_ON_DEPLOY` ist noch **nicht** gesetzt, das passiert erst beim Cutover: für Production und als Preview-Variable **nur für den Git-Branch `develop`**, sonst würde jede Feature-Preview die gemeinsame Staging-DB migrieren. Achtung: Ist Staging pausiert, scheitert der `develop`-Build am Migrationsschritt. Dann das Projekt im Dashboard fortsetzen und neu deployen.
- `NODE_ENV` setzt Vercel selbst.

Env Frontend: `NEXT_PUBLIC_API_URL`, Preview `https://api-staging.localshare.ch` und Production `https://api.localshare.ch`, plus `NEXT_TELEMETRY_DISABLED=1`. Railway setzt heute kein `NEXT_PUBLIC_FEEDBACK_EMAIL`, der Fallback im Code bleibt.
`remotePatterns` in `next.config.js` enthält die beiden Supabase-Hosts `<ref>.supabase.co/storage/v1/object/public/**`.

### Schritt 5: Daten migrieren — Staging komplett, Prod vorab kopiert (2026-09-30, `feature/167-data-migration`)
Werkzeuge liegen in `scripts/supabase-migration/`, siehe README dort. Sie brauchen die Railway-CLI, `jq`, `python3`, `node` und libpq ≥ 17 (`brew install libpq`, hier 18.1). Credentials kommen aus `apps/backend/.env.supabase-*.local`.
```bash
scripts/supabase-migration/migrate-db.sh <staging|production> apps/backend/.env.supabase-<staging|prod>.local
scripts/supabase-migration/copy-images.sh <staging|production> apps/backend/.env.supabase-<staging|prod>.local
```
- **`migrate-db.sh`:**
  - Ablauf: `pg_dump -Fc --schema=public`, TOC ohne die Einträge `SCHEMA public` und `COMMENT ON SCHEMA public` filtern, dann `pg_restore --clean --if-exists -L`, am Schluss alle Tabellen zählen und die Listing-IDs hashen.
  - Warum der Filter: Mit `--clean` würde `pg_restore` sonst `DROP SCHEMA public` versuchen, und das scheitert auf Supabase.
  - Der Dump liegt nur in einem temporären Ordner mit Modus 700 und wird danach gelöscht, weil er Personendaten enthält.
- **`copy-images.sh`:**
  - Kopiert alle Objekte von R2 nach Supabase Storage und übernimmt dabei den Content-Type. Gesetzt wird `Cache-Control: public, max-age=31536000, immutable`, weil die Keys UUIDs sind.
  - Es ist idempotent und überspringt gleiche Keys. Ein erneuter Lauf ist also der Delta-Abgleich beim Cutover.
  - rclone ist nicht nötig.
- **Bucket:** Prod enthält ältere **JPG**-Uploads, deshalb erlauben die Buckets jetzt `image/webp` und `image/jpeg`. Einige alte JPGs nutzen dieselbe Datei als Voll- und als Vorschaubild.

Ergebnisse:

| | Staging | Prod (Vorab-Kopie, Railway bleibt live) |
|---|---|---|
| Tabellen Railway = Supabase | ✅ alle 12, identischer ID-Hash | ✅ alle 12: 22 User, 52 Inserate, 57 Bilder, 480 Refresh-Tokens |
| RLS / `migrate status` / Drift | 12/12 / up to date / leer | 12/12 / up to date / leer |
| Bilder | 70/70 kopiert, alle DB-Verweise mit 200 erreichbar | 108/108 kopiert, alle 114 DB-Verweise mit 200 erreichbar |
| Ende-zu-Ende über Vercel | Preview: Community-Vorschau mit echtem Token liefert 200 | `localshare-backend.vercel.app`: Community-Vorschau mit echtem Token liefert 200 |

Die Prod-Kopie ist nur eine Vorab-Kopie. Railway nimmt weiter Schreibzugriffe an. Beim Cutover (Schritt 6, Phase B) werden deshalb beide Skripte für `production` erneut ausgeführt, nachdem Railway gestoppt ist. `migrate-db.sh` ersetzt dabei den Stand komplett, und `copy-images.sh` kopiert nur das Delta. Seit dieser Kopie liegen Personendaten in Supabase-Prod, geschützt durch RLS, eine abgeschaltete Data API und ein Datenbank-Passwort.

### Schritt 6: Cutover
**Phase A (kein Downtime):** Branch mit Schritten 2–3 (Schritt 1 ist dann schon auf Railway live) → Preview deployen → `/api/v1/health/db`, `curl /main.js` (muss 404 sein) und ein Multipart-Upload testen (validiert Kaltstart-Listen, Body-Stream, sharp, Prisma-Engine). DNS-TTL der 4 Hostnames auf 60 s. Staging-Daten und die Vorab-Kopie der Prod-Daten sind seit Schritt 5 erledigt. Es fehlt: Staging-Domains (`staging.`, `api-staging.`) auf die Vercel-Projekte legen, CNAMEs → `cname.vercel-dns.com` und die Checkliste mit Login (OAuth-Callbacks zeigen weiterhin auf `api-staging.localshare.ch`).

**Phase B (30–60 min Fenster):** Railway-Backend stoppen (Write-Freeze) → `migrate-db.sh production …` (Zahlen vergleichen) → `copy-images.sh production …` (Delta) → in Vercel `PRISMA_MIGRATE_ON_DEPLOY=true` setzen (Production und Preview-Branch `develop`) → Git verbinden → Domains in Vercel zuweisen → CNAMEs `api.` + `app.` umstellen → Checkliste → 24 h Vercel- und Supabase-Logs beobachten.

**Rollback:** CNAMEs zurück auf Railway, Railway-Backend starten. Railway-DB und R2 wurden nie verändert; Schreibvorgänge nach Cutover gehen verloren. Railway + R2 1–2 Wochen behalten, dann löschen.

### Schritt 7: Doku nachziehen
`CLAUDE.md` (Environments-Tabelle), `README.md`, `docker-compose.yml` (erledigt: `/api/v1/health` existiert seit Schritt 4). Löschen: `apps/backend/railpack.json`, `apps/frontend/start.sh` (Script `start` → `next start`), `R2_*`-Variablen, Railway-Variable `BACKEND_URL` (Frontend), `*.r2.dev` in `remotePatterns`. `S3_*` in `.env.example` und `CLAUDE.md` ist seit Schritt 1 erledigt, nur der Satz «Supabase Storage after migration» in `CLAUDE.md` (Image Storage) muss aktualisiert werden.

**Datenschutzerklärung** `apps/frontend/src/app/[locale]/privacy/page.tsx` (Zeilen «Datenbank» und «Bilder»): Hosting-Angaben Railway und Cloudflare R2 durch Vercel (Frankfurt) und Supabase (Frankfurt) ersetzen. Das ist Rechtstext, also zeitgleich mit dem Cutover live schalten.

## Verifikation (Checkliste nach jedem Deploy)
- `GET /api/v1/health/db` → 200 (DB erreichbar), Response-Header zeigen Vercel.
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
| Schema-Drift Railway-DB ≠ `schema.prisma` (SQL wurde von Hand angewendet) | Erledigt in Schritt 2: Baseline aus der Prod-DB, Drift per Migration behoben |
| Neue Migration nach Schritt 2 vergessen, Restore-Stand ≠ Code-Stand | Vor dem Dump `migrate status` auf Railway: "up to date" |
| Cold Starts 1–3 s | Fluid Compute, `fra1` neben DB; akzeptabel |
| Pooler-Limits bei Fluid-Concurrency | `connection_limit=5`, Transaction Mode |
| Feature-Branch-Previews (`*.vercel.app`) können sich nicht einloggen (Cookie-Domain, Single-Origin-CORS) | Dokumentierte Einschränkung; Auth auf Staging testen |
| Alle User einmal ausgeloggt | Bewusst, beim Release von Schritt 1 |
| Ab Schritt 1 auch auf Railway kein App-Rate-Limit mehr | Gering: Der Throttler zählte hinter dem Proxy ohnehin alle User als eine IP. Nach dem Cutover übernimmt die Vercel Firewall |
| Lazy Prisma-Connect: falsche `DATABASE_URL` crasht nicht mehr beim Boot, `/auth/health` prüft die DB nicht | `/api/v1/health/db` in der Checkliste deckt es auf |
| Keine Tests im Repo | Manuelle Checkliste; Staging-Probelauf ist der Sicherheitsnetz |

Nicht verifiziert: Tracing von Prisma-Engine und sharp im npm-Monorepo, rclone-Listing gegen Supabase S3, Railway-Postgres-Version, exakte heutige Railway-Env-Werte (Annahme: Frontend ruft `api.localshare.ch` direkt, Rewrites sind in Prod tot).
