# Aufräumen vor Chat, Status, Benachrichtigungen und Kalender

> Status: umgesetzt als gestapelte PRs #193–#200, #202, #203 (Stand 2026-09-30), Review und Merge offen. Reihenfolge und Inhalt siehe unten.

## Kontext

Wir brauchen eine saubere Basis, bevor Chat, Status (State Machine), Benachrichtigungen und Kalender dazukommen. Der Audit hat Folgendes gezeigt:

- **Sichtbarkeitsregeln sind verteilt.** Im Backend stecken sie in etwa 12 Dateien, im Frontend in 6. Mitgliedschaft wird auf 4 verschiedene Arten geprüft.
- **Echte Fehler und Sicherheitslücken:**
  - **A:** Wer eine Community verlässt, dessen Inserate bleiben in deren Gruppen sichtbar.
  - **B:** Wird eine Community gelöscht, bleiben die Sichtbarkeits-Einträge ihrer Gruppen stehen.
  - **C:** `setVisibility` prüft nicht, ob der User Mitglied des Ziels ist. Man kann also in fremde Communities teilen.
  - **F:** Ein Gruppen-Owner verliert seine Mitgliedschaft, wenn er die Community verlässt. Die Gruppe hat dann einen Owner ohne Mitgliedschaft.
  - **Refresh-Race im Frontend:** Parallele 401 lösen mehrere Refreshes aus. Das endet mit einem falschen "not found" und einem Redirect.
  - **Filter-Reset:** Die Listen-Seite springt beim Laden auf Seite 1.
- **Performance:**
  - Jeder Request prüft das JWT doppelt, weil der Guard global und zusätzlich pro Controller läuft.
  - Der Feed macht rund 10 Queries. Dabei wird eine unbegrenzte `id IN (...)`-Liste gebaut.
  - Die Detailseite macht rund 12 Queries.
  - Jeder Aufruf lädt sharp und das AWS SDK beim Kaltstart, auch `/health`.
  - `/auth/me` wird pro Seitenaufruf mindestens zweimal geholt.
  - zod ist in jedem Seiten-Bundle.
- **Duplikate:** Communities und Gruppen sind zu 80–93 % Kopien, im Backend und im Frontend.

**Entscheide des Users:**
1. Community und Gruppe werden **ein Modell** (Gruppe = Community mit `parentId`). Das kommt als letzte Phase, wenn die Tests stehen.
2. Gruppen eines austretenden oder entfernten Users gehen **an den Community-Owner**. Gleiches gilt bei Account-Löschung.
3. Frontend mit **TanStack Query**. Rechte kommen vom Backend, nicht mehr aus `isOwner`.

**Stand:** `develop` enthält #181 (SSO-Fix und Jest-Unit-Tests in `apps/backend/test/`); darauf baut B0 auf.

---

## Kern: Zugriffsregeln an einem Ort

**Backend `src/access/`** (`@Global`, nur lesend):

- **`access.where.ts`:** reine Funktionen, die Prisma-Where-Fragmente liefern. Sie sind die einzige Stelle für die Sichtbarkeitsregel.
  - `memberOf(userId)` liefert `{ deletedAt: null, members: { some: { userId } } }`.
  - `sharedWithUser(userId)`: Sichtbarkeits-Eintrag zeigt auf eine Community, in der der User Mitglied ist. Vor dem Merge gibt es zusätzlich den Gruppenzweig.
  - `visibleListingWhere(userId)` liefert `{ deletedAt: null, OR: [{ creatorId }, { visibility: { some: sharedWithUser } }] }`.
  - `shownVisibilityWhere(userId)`: welche Einträge "geteilt mit" jemand sieht. Der Owner sieht alle.
- **`access.service.ts`:** `assertListingOwner`, `assertCommunityMember`, `assertCommunityOwner` (plus die Gruppen-Varianten bis zum Merge), `assertShareTargets(userId, ids)`.
  - Einheitliche Regel: nicht sichtbar ergibt 404, sichtbar aber nicht erlaubt ergibt 403.
  - Jede Prüfung ist eine einzige Query.
- **`permissions.ts`:** `listingPermissions(row, userId)` liefert `{ isOwner, canEdit, canBookmark }`. `communityPermissions(row, userId)` liefert `{ role, canEdit, canDelete, canManageMembers, canLeave }`.
  - Das Ergebnis geht als `viewer` in jede Response.
  - Hier kommen später `canChat` und die erlaubten Status-Übergänge dazu.

**Kaskaden** in `src/communities/membership.cascade.ts`. Sie sind schreibend und bleiben bewusst ausserhalb von `AccessService`. Alle laufen in einer Transaktion:

- `revokeCommunityMembership(tx, community, userId)` in vier Schritten:
  1. Sichtbarkeit der eigenen Inserate in der Community und ihren Gruppen löschen (behebt A).
  2. Eigene Gruppen an den Community-Owner übertragen; der Owner wird dort Mitglied (behebt F).
  3. Gruppenmitgliedschaften löschen.
  4. Community-Mitgliedschaft löschen.
- `revokeGroupMembership`, `softDeleteCommunity` (inkl. Gruppen, behebt B) und `softDeleteGroup`.
- Verwendet von: Verlassen, Mitglied entfernen, Löschen und Account-Löschung (`users.service`).

**Frontend:** kein `isOwner` mehr. Komponenten lesen nur `listing.viewer` bzw. `community.viewer`.

Das bedeutet für später:
- Chat, Buchung und Status nutzen denselben Baustein `visibleListingWhere` bzw. `assertListingOwner`.
- Jede Kaskade ist eine Funktion und damit genau ein Ort, an dem später eine Benachrichtigung ausgelöst wird.
- Der Status-Filter wird ein eigener Feed-Filter und kommt nicht in `visibleListingWhere`.

---

## PR-Reihenfolge

Jede Zeile ist ein PR nach `develop`, jeder für sich deploybar.

| # | PR | Abhängig von |
|---|---|---|
| 1 | **B0** (#183) Integrationstests, Lint, doppelter Guard, Hotfix C | – |
| 2 | **F0** (#184) Toten Code und Deps entfernen, schnelle Bild-Gewinne, ESLint | – |
| 3 | **B1** (#185) Access-Modul, Bugfixes A/B/F, `viewer`, Datenbereinigung | B0 |
| 4 | **F1** (#186) TanStack Query, Single-Flight-Refresh, `useAuth`, Fehler-Helper | – |
| 5 | **F2** (#187) Lese-Pfade auf Queries, Filter-Bugs | F1 |
| 6 | **F3** (#188) Rechte aus `viewer` (4× `isOwner` entfernen) | B1, F2 |
| 7 | **B2** (#189) Schlanker und schneller (Bilder, Mapper, Indizes, Refresh-Tokens) | B1 |
| 8 | **F4** (#190) Schreib-Pfade für Inserate, Bild-Editor neu | F2, B2 |
| 9 | **B3+F5** (#191) Merge Community/Gruppe (ein PR) | alle |
| 10 | **F6** (#192) Sweep der ungenutzten Übersetzungs-Keys, Bundle-Vergleich | B3+F5 |

---

## Backend

### B0: Test-Basis und Hotfix
- **Neu `src/app.setup.ts`** mit `configureApp(app)`: Helmet, CORS, Cookies, ValidationPipe, Prefix und Uploads. Beide Einstiege nutzen es, `main.ts` und die Tests.
- **Neu `test/integration/`:**
  - `jest.config.json` mit `*.int-spec.ts` und `maxWorkers: 1`.
  - `env.ts` nutzt die Test-DB `localshare_test` im Docker-Postgres auf Port 5433, dazu Dummy-OAuth-Werte und `STORAGE_PROVIDER=local`.
  - `global-setup.ts` bricht ab, wenn die DB nicht auf localhost liegt oder nicht auf `_test` endet. Danach läuft `prisma migrate reset --force --skip-seed`.
  - `helpers/app.ts`: HTTP über `fetch` und `app.listen(0)`, wie in den bestehenden Tests aus #181. Der Bearer-Token wird mit `JwtService` signiert.
  - `helpers/db.ts`: `TRUNCATE` aller Tabellen.
  - `helpers/factories.ts`: `createUser` direkt in die DB, alles andere über HTTP.
- **`package.json`:** Skript `test:int`. `npm test` bleibt ohne Docker.
- **ESLint:** neue `.eslintrc.js` (typescript-eslint recommended, `max-lines-per-function` 50 als Warnung).
- **Doppelten Guard entfernen:** alle `@UseGuards(JwtAuthGuard)` raus (4 Controller, dazu `auth.controller` `logout` und `me`). Das spart eine User-Query pro Request.
- **Hotfix C** in `listings.service` `create`/`update`: IDs deduplizieren, dann zählen, ob der User Mitglied aller Ziele ist. Sonst 403.
- **Tests:** alle Zugriffsregeln (Liste unten). Bekannte Bugs stehen als `it.failing` drin und werden in B1 zu `it`.

### B1: Access-Modul und Bugfixes
- **Neu:**
  - `src/access/`: `access.where.ts`, `access.service.ts`, `permissions.ts`, `access.module.ts`
  - `src/communities/membership.cascade.ts`
  - `src/listings/listing-query.ts`: `listingFeedWhere` = `{ AND: [visibleListingWhere, ...filter] }`. Das `AND` ist nötig, damit das Such-`OR` die Sichtbarkeit nicht aufweicht. Dazu Include-Konstanten mit `bookmarks: { where: { userId } }`.
  - `src/common/utils/prisma-errors.ts`: `isUniqueViolation`
- **`listings.service.ts`:**
  - Der Feed wird `findMany` plus `count` auf `listingFeedWhere`, parallel. Die ID-Liste und die separate Bookmark-Query fallen weg.
  - Die Detailseite wird ein einziges `findFirst`.
  - `create` legt die Sichtbarkeit verschachtelt an und ist damit atomar. `update` und `delete` laufen in einer Transaktion.
  - Der Bookmark-Toggle wird `deleteMany` und, falls nichts gelöscht wurde, `create`.
  - Die 5 Inline-Owner-Checks werden durch `assertListingOwner` ersetzt.
- **Communities-, Groups- und Membership-Services:**
  - `findOne` ohne Include aller Mitglieder, stattdessen `memberOf`.
  - Owner-Aktionen über `assert*Owner`. Verlassen und Entfernen über die Kaskade.
  - Beitreten wird `create` mit P2002 → 409, das behebt die Race.
- **`users.service` delete:** in einer Transaktion `revokeCommunityMembership` für fremde Communities, dann die Sichtbarkeit löschen.
- **Validierung:** `ParseUUIDPipe` auf allen ID- und Token-Parametern (400 statt 500). Das 3-Bilder-Limit gibt 400.
- **Löschen:**
  - `visibility.service.ts`
  - `ownership.guard.ts`
  - `GET /listings` und `findAll` (toter Doppel-Code)
- **Migration `fix_membership_invariants`** (nur DML, idempotent):
  - Verwaiste Gruppen-Owner werden der Community-Owner.
  - Gruppenmitglieder ohne Community-Mitgliedschaft werden entfernt.
  - Jeder Gruppen-Owner wird Mitglied seiner Gruppe.
  - Sichtbarkeit wird gelöscht, wenn das Inserat gelöscht ist, das Ziel gelöscht ist oder der Ersteller dort nicht mehr Mitglied ist.
  - Doppelte Sichtbarkeits-Einträge werden entfernt.
  - Vorher `SELECT count(*)` read-only auf Staging und Prod ausführen und die Zahlen in den PR schreiben.
- **Privacy-Seite §10** anpassen: Gruppen gehen beim Austritt an den Community-Owner.
- **Ergebnis:** der Feed sinkt von rund 10 auf rund 5 Queries, die Detailseite von rund 12 auf rund 6.

### B2: Schlanker und schneller
- **Neu `src/listings/storage.ts`** mit `putFiles`, `removeFiles`, `publicUrl`.
  - Das AWS SDK wird erst beim ersten Gebrauch geladen (lazy `import()`).
  - Der S3/lokal-Zweig existiert dann einmal statt dreimal.
- **Neu `src/listings/listing.mapper.ts`** mit `toImageDto`, `toListingListItem`, `toListingDetail`. Das ersetzt 4 Kopien der Bild-URL-Zuordnung.
- **`image.service.ts`:**
  - sharp per lazy `import()`.
  - Mehrere Dateien parallel mit `Promise.all` und ein einziges `createMany`.
  - Die bestehenden Bilder kommen vom Aufrufer.
  - `crypto.randomUUID` statt des Pakets `uuid`.
- Die Bild-Endpoints geben `{ id, images }` zurück statt einen vollen `findOne`-Durchlauf.
- **Refresh-Tokens:**
  - Rotation per `deleteMany({ id })`. Das bleibt tolerant gegen parallele Refreshes.
  - Logout löscht alle Tokens des Users. Login räumt abgelaufene weg.
  - Die Spalte `revoked_at` bleibt vorerst und fällt erst in B3 (expand/contract).
  - Privacy-Seite §2.4 anpassen.
- **Migration `drop_redundant_indexes`:** Indizes, die schon von einem Unique abgedeckt sind:
  - `users.email`
  - `communities.invite_token`
  - `refresh_tokens.token_hash`
  - `community_members.community_id`
  - `listing_bookmarks.user_id`
  - `listing_visibility.listing_id`

  Die Gruppen-Indizes bleiben für B3.
- **Kleinere Punkte:**
  - `FilterListingsDto.limit` bekommt `@Max(100)`.
  - OAuth-Start und Callback in `auth.controller` teilen sich zwei Helfer statt Kopien.
  - Überflüssige `imports: [DatabaseModule]` und `exports` entfernen.
- **Löschen:**
  - `GET /users/me`
  - `InviteStateService.generateState/parseState`
  - `common/utils/prisma.utils.ts`
  - `prisma/seed-listings.ts`
  - `if (!updated)`
  - `JWT_REFRESH_SECRET` (Compose, README, CLAUDE.md)
  - Pakete `uuid` und `@types/uuid`

### B3: Merge Community/Gruppe (zusammen mit F5)
- **Schema:**
  - `Community` bekommt `parentId?` mit `parent`/`children` und `onDelete: Cascade`, dazu `@@index([parentId])`.
  - `ListingVisibility` bekommt `communityId` als Pflichtfeld und `@@unique([listingId, communityId])`.
  - Weg fallen `Group`, `GroupMember`, `VisibilityType` und `RefreshToken.revokedAt`.
- **Migration `merge_groups_into_communities`:** mit `--create-only` erzeugen und von Hand in einer Transaktion schreiben.
  1. Kollisionsprüfung auf IDs und Tokens.
  2. `parent_id` hinzufügen.
  3. `groups` in `communities` kopieren (gleiche UUIDs und Tokens).
  4. `group_members` in `community_members` kopieren (`ON CONFLICT DO NOTHING`).
  5. `listing_visibility.community_id = group_id` setzen und deduplizieren.
  6. `group_id` und `visibility_type` entfernen, `NOT NULL` setzen, neuen Unique anlegen.
  7. FK und Index für `parent_id`.
  8. `groups`, `group_members` und den Enum droppen.

  Es entstehen keine neuen Tabellen, also ist kein neues RLS nötig.
- **API danach:**
  - `GET /communities` liefert eine flache Liste aller Mitgliedschaften mit `parentId` und `parent`.
  - `POST /communities {name, description?, parentId?}`. Der Parent muss eine eigene Mitgliedschaft und top-level sein.
  - `/communities/:id` plus `members`, `leave`, `refresh-invite` gelten für beide Ebenen.
  - `POST /communities/join/:token`: Beim Beitritt zu einer Untergruppe wird der User auch Mitglied des Parents.
  - `GET /communities/preview/:token` enthält `parent`.
  - Listings arbeiten nur noch mit `communityIds`.
  - `/groups/*` entfällt.
  - `InviteStateService` leitet alle Einladungen auf `/communities/join`.
- **Code:**
  - `src/groups/` wird gelöscht.
  - Die Kaskaden arbeiten über `scope(id) = { OR: [{ id }, { parentId: id }] }`.
  - `access.where` verliert den Gruppenzweig.
  - Anpassen: DTOs, `seed.ts`, `packages/shared/src/types.ts`, CLAUDE.md.
- **Deploy-Risiko:** `migrate deploy` läuft während des Builds, und der alte Code liest dann eine gedroppte Tabelle. Das gibt 1–2 Minuten 500er.
  - Off-peak deployen.
  - Vorher `pg_dump` über `DIRECT_URL`.
  - Probelauf auf einem lokalen Restore des Prod-Dumps: Die Paare `(listing, user)` mit Sicht müssen vorher und nachher per `diff` identisch sein.
  - `prisma migrate diff` muss leer sein.

---

## Frontend

### F0: Aufräumen ohne Backend-Abhängigkeit
- **Löschen:**
  - `language-switch.tsx`, `use-media-query.ts`
  - `lib/utils/__tests__/*`
  - `public/sw.js` und die Offline-Seite samt ihren Keys (der Service Worker wurde nie registriert)
  - `areFiltersEqual`, den Parameter `currentParams`
  - den toten Pfad in `CreateGroupDialog` ohne Vorauswahl
  - die Links auf `/listings` in den not-found-Seiten
  - das leere Verzeichnis `apps/frontend/apps/`
- **Deps:**
  - `@radix-ui/react-tabs` entfernen, `@radix-ui/react-collapsible` ergänzen, `sharp` zu den devDependencies.
  - `packages/shared/package.json` bekommt `"sideEffects": false`. Damit fällt zod aus dem Layout-Bundle.
- **Bilder:**
  - `sizes` auf alle `<Image fill>`.
  - Kleine Kacheln nutzen `thumbnailUrl`.
  - `priority` nur auf die ersten 3 Karten.
  - Hero- und How-it-works-Bilder ohne `unoptimized`.
- **i18n:** hartcodierte Aria-Labels und die Texte in `contact-buttons.tsx` übersetzen, beide Sprachen.
- **ESLint:** `.eslintrc.json` mit `next/core-web-vitals`. Den First-Load-JS-Wert als Baseline notieren.

### F1: Grundlage
- **Neu:**
  - `@tanstack/react-query@5`
  - `src/lib/api/client.ts` (ersetzt `lib/api.ts`) mit Single-Flight-Refresh:
    - Parallele 401 teilen sich ein Refresh-Promise.
    - Scheitert der Refresh, wird `setQueryData(['me'], null)` gesetzt statt eines `window.location`-Redirects.
    - Der Refresh läuft über eine eigene axios-Instanz ohne Interceptor.
  - `src/lib/api/errors.ts`: `getErrorKey(err, fallback)` bildet Status-Codes auf i18n-Keys ab. Heute landen englische Backend-Texte im Toast.
  - `src/hooks/use-error-toast.ts`
  - `src/components/providers/query-provider.tsx`
- **`use-auth.ts`:** etwa 25 Zeilen auf Basis von `useQuery(meQuery)`, liefert `{ user, loading, logout }`. `fetchUser` und `setUser` fallen weg.
- Auth-Callback und Profil nutzen `setQueryData`.
- Die 22 Kopien von `error.response?.data?.message` werden durch `showError(getErrorKey(...))` ersetzt.
- **Query-Keys:** hierarchisch nach REST-Ressource, also `['me']`, `['listings','list',filters]`, `['listings','detail',id]`, `['communities','list']`, `['communities','detail',id,'members']`.
  - Später kommen `['notifications','unread']` mit `refetchInterval` und `['conversations',id,'messages']` dazu.
- **Tests:** `tsx --test` mit `node:test`, ohne neue Dependency. Abgedeckt werden Single-Flight (zwei parallele 401 ergeben einen Refresh), der fehlgeschlagene Refresh und `url-filters`.

### F2: Lese-Pfade und Filter-Bugs
- **Neu `lib/api/listings.ts` und `lib/api/communities.ts`:** Keys, Fetch-Funktionen und `queryOptions()` stehen zusammen. Es gibt keine Barrel-Datei.
- **`url-filters.ts`:** ein `appendFilterParams` statt drei Query-String-Builder. `getImageUrl` wird einmal zentral definiert.
- **`listings-page.tsx`:**
  - `useQuery` mit `keepPreviousData`: kein Skeleton-Flackern mehr, und alte Requests werden abgebrochen.
  - Pagination als eigene Komponente.
  - Der `useAuth`-Aufruf fällt weg.
- **`listing-filters.tsx`:** feuert nur noch, wenn `next !== filters.search`. Das behebt den Sprung auf Seite 1.
- **`mobile-filter-sheet.tsx`:** der Initial-State kommt aus den aktuellen Filtern, der Sync-Effekt fällt weg. Damit gibt es beim Öffnen genau eine Count-Query.
- **`listing-card.tsx`:** Bookmark per Mutation, die die Liste invalidiert. Das behebt den Fehler, dass ein ent-bookmarktes Inserat im Bookmark-Filter stehen bleibt. `onBookmarkChange` wird gelöscht.
- **`listings/[id]/page.tsx`:** aufteilen in `ListingGallery`, `ListingOwnerActions` und `ListingContactCard`. Ein Löschdialog statt zwei.
- **Neu `components/ui/confirm-dialog.tsx`:** ersetzt die 10 kopierten AlertDialog-Blöcke nach und nach.

### F3: Rechte aus dem Backend
- `packages/shared/types.ts` bekommt `ListingViewer` und `CommunityViewer`.
- Die 4 `isOwner`-Stellen lesen `viewer.*`: `listings/[id]/page.tsx`, `listing-card.tsx`, `communities/[id]/page.tsx`, `groups/[id]/page.tsx`. Die Karte braucht dann kein `useAuth` mehr.
- Die Edit-Seite leitet um, wenn `!viewer.canEdit`.

### F4: Schreib-Pfade für Inserate
- Create und Edit laufen als Mutations. Edit nutzt den Detail-Cache und öffnet dadurch sofort.
- `listing-form.tsx` holt Communities und Gruppen per Query und ist die einzige Stelle, die ausstehende Bilder hält.
- `image-upload.tsx` (553 Zeilen) wird ersetzt durch `image-picker.tsx`, `image-tile.tsx`, `listing-images-editor.tsx` und `pending-images-editor.tsx`, zusammen etwa 300 Zeilen.
- Die FileReader-Data-URLs bleiben wegen der Android-Ausnahme.

### F5: Community und Gruppe vereint (im PR B3)
- **Neu in `components/communities/`:**
  - `community-detail.tsx`, aufgeteilt in Header mit Breadcrumb aus `parent`, Aktionen, `SubgroupList` (nur wenn `!parentId`), `MemberList` und Löschdialog
  - `community-form-dialog.tsx` für Anlegen und Bearbeiten, mit optionalem `parentId`
  - `join-dialog.tsx`
- Texte über `useTranslations(parentId ? 'groups' : 'communities')`.
- **Untergruppen:** `['communities','list']` gefiltert nach `parentId`. Es gibt keinen eigenen Endpoint.
- **Redirect in `next.config.js`:** `/:locale/groups/:id` geht auf `/:locale/communities/:id` (308). Das deckt auch `/groups/join?token=` ab.
- **Löschen:**
  - `app/[locale]/groups/**`
  - `components/groups/**`
  - die alten Community-Dialoge
  - `lib/api/groups.ts`
  - den Key `pendingGroupInviteToken`
  - die Gruppen-Typen und -Schemas in `shared`
- **Zeilen:** die 10 betroffenen Dateien schrumpfen von rund 2500 auf rund 1000.

### F6: Abschluss
- Ungenutzte Übersetzungs-Keys per Skript finden und in de und fr entfernen. Dynamische Präfixe wie `types.*` und `categories.*` werden dabei berücksichtigt.
- Das Bundle gegen die Baseline aus F0 vergleichen.

---

## Test-Fälle (Integration, ab B0)

- **Auth:**
  - Ohne Token gibt es 401.
  - `/health` und beide Previews sind öffentlich.
  - Bearer und Cookie funktionieren beide.
  - Ein gelöschter User bekommt 401.
- **Sichtbarkeit:**
  - Der Ersteller sieht sein Inserat. Ein Community-Mitglied sieht es. Ein Aussenstehender bekommt 404 und das Inserat fehlt im Feed und im `total`.
  - Ein Gruppenmitglied sieht ein Gruppen-Inserat, ein Community-Mitglied ohne Gruppe nicht.
  - Suche, Typ und Kategorie weichen die Sichtbarkeit nie auf.
  - `myListings`, `bookmarked` und `isBookmarked` stimmen.
  - "Geteilt mit" zeigt nur eigene Mitgliedschaften, der Owner sieht alle.
  - Kontaktdaten sind für den Owner ausgeblendet.
  - Ein gelöschtes Inserat oder eine gelöschte Community ist unsichtbar.
  - Eine Nicht-UUID gibt 400.
- **Inserate:**
  - Teilen in eine fremde Community oder Gruppe gibt 403 (C).
  - Doppelte IDs ergeben einen Eintrag.
  - PATCH oder DELETE durch einen Nicht-Owner mit Sicht gibt 403, ohne Sicht 404.
  - Ein 4. Bild gibt 400.
  - Genau ein Cover. Wird das Cover gelöscht, rückt das nächste nach.
  - Bei ungültigem Ziel bleibt kein verwaistes Inserat zurück.
- **Communities:**
  - Rechte-Matrix Owner / Mitglied / Aussenstehender für PATCH, DELETE, refresh-invite und members.
  - Join gibt 201, danach 409 `{alreadyMember}`. Zwei parallele Joins ergeben 201 und 409.
  - Der Owner kann nicht austreten.
- **Kaskaden:**
  - Nach Austritt oder Entfernen ist das Inserat aus der Community und ihren Gruppen weg (A). Eigene Gruppen gehören danach dem Community-Owner, der dort Mitglied ist (F).
  - Wird eine Community gelöscht, sind ihre Gruppen-Shares unsichtbar (B).
  - Nach Account-Löschung sind die Inserate weg, Gruppen übertragen, und der Token gibt 401.
- **Nach B3:**
  - Eine Untergruppe einer Untergruppe gibt 400.
  - Beim Beitritt zu einer Untergruppe wird der User auch Mitglied des Parents.
  - Die flache Liste enthält `parentId`.

## Verifikation pro PR
- **Backend:**
  - `docker compose up -d postgres`
  - `npm run test:int -w apps/backend`, `npm test`, `npm run lint`, `npm run build`
- **Frontend:**
  - `npm run type-check`, `npm run build` (First-Load-JS-Werte vergleichen), `npm test -w apps/frontend` (ab F1)
  - Manuelle Flows auf dem Dev-Server mit Blick auf das Network-Tab:
    - genau ein `/auth/me` pro Seite
    - abgelaufenes `accessToken` (Cookie löschen) auf der Community-Detailseite: genau ein Refresh, kein Toast
    - Reload von `?page=3` bleibt auf Seite 3
- **Staging nach jedem Merge auf `develop`:**
  - Login, Refresh und Logout
  - Curl-Test für C (Teilen in fremde Community)
  - Austritt eines Gruppen-Owners
  - Bilder hochladen und löschen im Bucket `listing-images`
  - Kaltstart von `/health` vor und nach B2 in den Vercel-Logs
- **B1 und B3:** Probelauf der Migration auf einem lokalen Restore des Prod-Dumps, bevor gemerged wird.
- **Doku:** CLAUDE.md und README pro PR nachführen: Test-Befehle, API-Routen, Schema, Frontend-State.

## Bewusst ausgeklammert
- Communities eines gelöschten Users bleiben verwaist. Das ist auf der Privacy-Seite dokumentiert, die Lösung gehört zu #161 (Ownership übertragen).
- Bilder bleiben öffentliche URLs mit UUID-Namen. Signierte URLs wären ein eigenes Thema.
- Kein Server-Side-Fetching: Das Refresh-Cookie ist auf den API-Host beschränkt.
- Keine Caching-Schicht (#146, #69). Der relationale Filter macht sie vorerst unnötig.
- sharp decodiert zweimal, und S3-Deletes laufen einzeln. Beides lohnt sich nicht, weil das Frontend Bilder schon vor dem Upload verkleinert.
