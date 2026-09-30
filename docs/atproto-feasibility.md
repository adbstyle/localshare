# Machbarkeits-Analyse: LocalShare auf/mit AT Protocol (Bluesky)

Stand: 9. August 2026 · Recherche-Datum aller Quellen: 2026-08-09 · **Update: 30. September 2026 (siehe Kap. 1a und PoC-Ergebnis in Kap. 1b)**

## 1. TL;DR

Technisch wäre LocalShare als atproto-App baubar — für **öffentliche** Listings sogar gut (eigene Lexicons, OAuth ist produktionsreif, mit Tap ist die Indexer-Infrastruktur klein). Der Kern von LocalShare ist aber **privat**: invite-basierte Communities/Groups, Listings nur für Mitglieder sichtbar. atproto ist public-by-default und kann diese Zugriffskontrolle heute nicht auf Protokollebene erzwingen; «Permissioned Data» ist erst ein Design-Proposal ohne Ship-Termin. Ein Rewrite heute würde entweder die Privatheit opfern oder die Zugriffskontrolle doch wieder komplett app-seitig lösen — dann bringt atproto kaum Nutzen. **Empfehlung: Kein Rewrite jetzt. Optional atproto-OAuth als dritten Login-Provider (kleiner Aufwand), und das Permissioned-Data-Proposal beobachten — dessen «Spaces»-Konzept passt fast 1:1 auf LocalShare-Communities. Re-Evaluation, sobald es produktionsreif ist.**

## 1a. Update 2026-09-30: «Permissioned Data» ist als «atproto Spaces» in der Alpha

Die zentrale Wartebedingung aus Kap. 6 hat sich schneller bewegt als erwartet:

- **20.08.2026:** [Atproto Spaces Alpha](https://atproto.com/blog/atproto-spaces-alpha) öffentlich — laufender Code statt Paper: TypeScript-SDKs (Alpha-Snapshots), gehosteter Test-PDS, Docker-Image für Self-Hosting, Beispiel-App **bulletin.my** (Bulletin Board, Quellcode offen — dem LocalShare-Use-Case sehr nah).
- **28.09.2026:** [Proposal 0016 gemerged und in «atproto spaces» umbenannt](https://github.com/bluesky-social/proposals/pull/115).
- **Modell bestätigt das Mapping aus Kap. 4:** Space-Authority (DID) kontrolliert Zugriff, Records liegen in per-Space permissioned Repos auf dem PDS (eigene Lexicons), Sync direkt PDS→App ohne öffentliche Relay-Firehose; seit September getrennte `readPolicy`/`writePolicy` pro Space.
- **Einschränkungen:** Explizit Alpha — Breaking Changes erwartet, destruktive Migrationen möglich, kein Security-Review, Alpha-Accounts nicht persistent, Produktion abgeraten. Spaces sind **Zugriffskontrolle, keine Verschlüsselung** (wer Space-Zugriff hat, liest alles). Spec ändert sich laufend (API-Umbenennungen im September).
- **Timeline:** Iteration durch den Herbst 2026, erklärtes Ziel: Launch noch 2026.

**Konsequenz für die Empfehlung (Kap. 6):** Weiterhin kein Produktions-Rewrite. Aber die Bedingung für Option C (PoC) ist erfüllt: Ein LocalShare-Space-PoC auf Basis der Alpha-SDKs und der Bulletin-Board-Vorlage ist jetzt möglich. Re-Evaluation konkret terminierbar: beim angekündigten Stable-Launch (Ende 2026).

## 1b. PoC-Ergebnis 2026-09-30: Der Kernkonflikt aus Kap. 4 ist technisch lösbar

Option C wurde umgesetzt und lokal verifiziert. **Ergebnis:** Das Kernmodell von LocalShare funktioniert auf atproto Spaces. Communities sind nur per Einladung zugänglich, Inserate sehen nur Mitglieder, entfernte Mitglieder verlieren den Zugriff. Das gilt über PDS-Grenzen hinweg, und die Zugriffskontrolle setzt der PDS durch, nicht nur die App.

### Aufbau

- Umbau der Beispiel-App [Bulletin](https://github.com/bluesky-social/bulletin) (Next.js, SQLite) auf die LocalShare-Domäne. Getestet gegen ein lokales atproto-Netz (Branch `permissioned-data-alpha` @ `de009e6`, `pnpm start:multi-pds` in `packages/dev-env`) mit 3 PDSes und Test-Accounts auf jedem PDS.
- **Community = Space** vom Typ `ch.localshare.community` mit `readPolicy`/`writePolicy = managingAppPolicy`. Vor jeder Credential-Ausgabe und jedem Write fragt der PDS die App (`com.atproto.simplespace.checkUserAccess`). Die App antwortet anhand der Mitgliedschaft in ihrer DB.
- **Invite-Token** nur in der App-DB, nie im Space. Beitritt über den Link `/join/<token>`.
- **Inserat** = Record `ch.localshare.listing` (Typ, Kategorie, Preis in Rappen, Zeiteinheit, Bild-Blob) im Space-Repo der Person, die es erstellt, auf **deren eigenem PDS**. Community-Name und -Beschreibung liegen als Record `ch.localshare.communityProfile` beim Owner.
- **Die App ist die AppView:** Sie registriert sich per `space.registerNotify` und bekommt `notifyWrite`-Pushes. Änderungen holt sie per `listRepoOps` bzw. `space.getRepo` direkt vom PDS der Autor:innen und verifiziert die Commit-Signatur vor dem Indexieren.
- Nicht umgesetzt: Groups, Bookmarks, Bearbeiten, Suche/Filter, i18n.

### Verifizierte Szenarien

Die Protokoll-Checks liefen per Prüfskript direkt gegen die PDSes, an der App vorbei.

| Szenario | Ergebnis |
|---|---|
| Community erstellen (`createSpace`), Inserate mit/ohne Bild | ✅ |
| Beitritt per Invite über PDS-Grenze, Mitglied postet vom eigenen PDS | ✅ `checkUserAccess write → granted`, Sync von fremdem PDS mit Commit-Verifikation |
| Öffentliches `repo.listRecords` / `sync.getRepo` der Autor:innen | ✅ enthält keine Inserate |
| Öffentliches `sync.getBlob` für Inserat-Bild | ✅ `BlobNotFound` |
| Anonymes `space.getRepo` / `space.getBlob` | ✅ `401 AuthMissing` |
| Space-Credential für Nicht-Mitglied | ✅ `UserNotAuthorized` |
| Nicht-Mitglied schreibt an der App vorbei direkt in den Space | ✅ vom eigenen PDS angenommen, **nie weitergeleitet oder indexiert** |
| Owner entfernt Mitglied | ✅ Inserate sofort ausgeblendet, danach `checkUserAccess read → denied` |

### Erkenntnisse

1. **Die Zugriffskontrolle sitzt im Protokoll.** Ohne Space-Credential gibt der PDS nichts heraus. Die App entscheidet nur, *wer* ein Credential bekommt. Damit entfällt der Hauptgrund gegen Option A (Listings müssten öffentlich sein).
2. **Die Mitgliedschaft lebt bei `managingAppPolicy` in der App-DB**, genau wie heute bei LocalShare, und ist damit nicht portabel. Der Alpha-PDS kennt auch `memberListPolicy` (`putMember`/`removeMember`), dann liegt die Liste beim PDS. Diese Variante ist noch nicht erprobt.
3. **Schreibschutz heisst Nicht-Weiterleiten.** Jede Person kann in ihr eigenes Repo eines Spaces schreiben. Die Authority trackt und forwardet aber nur berechtigte Writes. Records entfernter Mitglieder bleiben in deren PDS, deshalb muss die App beim Anzeigen nach aktueller Mitgliedschaft filtern.
4. **Keine Verschlüsselung.** Spaces sind Access Control. Wer einen PDS betreibt, kann die Daten der eigenen User lesen.
5. **Der Sync braucht eine Mitglieds-Session.** Die App liest Spaces mit dem Credential eines eingeloggten Mitglieds. Ist keines eingeloggt, stoppt der Sync (live beobachtet). Umgekehrt überlebt ein bereits ausgestelltes Space-Credential den Logout bis zu seinem Ablauf.
6. **Onboarding bleibt die grösste Hürde.** Jede Person braucht einen PDS, der Spaces unterstützt, und das kann heute nur der Alpha-PDS. Für den gehosteten Alpha-PDS bräuchte die App zudem eine öffentlich erreichbare `did:web`-Identität.

### Aktualisierte Empfehlung

Weiterhin kein Produktionsumbau vor dem Stable-Launch. Danach ist Option A auf Basis von Spaces der ernsthafte Kandidat. Entscheidungsgrundlage sind dann Onboarding, DSG/DSGVO und das Mitgliedschafts-Modell (App-DB oder `memberListPolicy`).

### Nachbauen

Der PoC-Code liegt bewusst **nicht** im Repo. Er ist an die Alpha-API gebunden, die sich laufend ändert, er gehört nicht zum LocalShare-Stack, und die Vorlage Bulletin hat (Stand 30.09.2026) keine Lizenz. Zum Wiederholen beim Stable-Launch: Bulletin klonen, lokales Netz wie oben starten, dann die LocalShare-Lexicons und `managingAppPolicy` nach dem Muster dieses Kapitels umsetzen. Die Lexicons sind:

- `ch.localshare.community`: Space-Typ, Key `tid`, Collections `communityProfile` und `listing`.
- `ch.localshare.communityProfile`: Record mit Key `literal:self`, Felder `name` und `description`.
- `ch.localshare.listing`: Record mit Key `tid`. Felder `title` (max. 60), `description`, `listingType` (sell/rent/lend/search), `category` (wie Prisma-Enum), `price` (Rappen), `priceTimeUnit` (hour/day/week/month, nur bei rent), `image` (Blob, JPEG/PNG/WebP, max. 1 MB).
- `ch.localshare.permissions`: Permission-Set mit Space-Resource `ch.localshare.community`, `authority` `*` und ohne `skey` (entspricht der Wildcard).

## 2. atproto-Primer (nur das Nötigste)

| Konzept | Bedeutung |
|---|---|
| **DID / Handle** | Dezentrale, portable User-Identität (`did:plc:…`) + menschenlesbarer Handle (Domain, z.B. `adrian.localshare.ch`) |
| **PDS** | Personal Data Server: hostet das Daten-Repo eines Users. User können bsky.social nutzen oder selbst hosten |
| **Repo / Records** | Signierter Datenspeicher pro User; Inhalte sind typisierte Records (JSON) |
| **Lexicon** | Schema-Sprache für Record-Typen; Apps definieren eigene Namespaces (z.B. `ch.localshare.listing`) |
| **Relay / Firehose** | Aggregiert alle Repos des Netzwerks und streamt Änderungen — **alles darin ist öffentlich** |
| **AppView** | App-Backend, das den Stream indexiert und Queries beantwortet (das wäre die Rolle des heutigen NestJS-Backends) |
| **Tap** | Offizielle Sync-Komponente (Go-Binary): abonniert relevante Record-Typen und liefert Events per Webhook — ersetzt eigene Firehose/Jetstream-Indexer weitgehend |
| **Blobs** | Binärdaten (Bilder) im PDS, referenziert aus Records |
| **OAuth** | atproto-eigener OAuth-Flow für Login/Schreibrechte; seit 2026 inkl. Permission Sets produktionsreif |

## 3. Mapping LocalShare → atproto

Basis: `apps/backend/prisma/schema.prisma` (10 Models).

| LocalShare-Model | atproto-Äquivalent | Machbarkeit |
|---|---|---|
| `User` | DID + Handle; Profil als Record (z.B. `ch.localshare.profile`) | ✅ Gut. Aber: `homeAddress`/`phoneNumber` dürften **nicht** ins öffentliche Repo |
| `SsoAccount` (Google/MS) | Entfällt — Identität ist der atproto-Account; Login via atproto OAuth | ✅ Ersetzt |
| `RefreshToken` | Entfällt — OAuth-Sessions verwaltet die Client-Library (`@atproto/oauth-client-node` bzw. `@atproto/lex`) | ✅ Ersetzt |
| `Listing` | Record `ch.localshare.listing` (eigenes Lexicon: type/category/price/priceTimeUnit als Enums) | ⚠️ Nur sinnvoll, wenn Listing öffentlich sein darf |
| `ListingImage` | Blobs im PDS, referenziert im Listing-Record; Thumbnails generiert der AppView | ✅ Standard-Pattern (Blobs folgen der Sichtbarkeit des Records → öffentlich) |
| `Community` | Kein natives Konzept. Als öffentlicher Record beschreibbar, aber Semantik (wer ist drin, wer sieht was) nicht erzwingbar | ❌ Heute nur AppView-seitig (klassische DB) |
| `CommunityMember` | Mitgliedschaft = private Information | ❌ Gehört nicht in öffentliche Repos |
| `Group` / `GroupMember` | Wie Community | ❌ Dito |
| `Community.inviteToken` / `Group.inviteToken` | Geheimnis — darf nie in ein Repo | ❌ Bleibt zwingend server-seitig |
| `ListingVisibility` | **Kernkonflikt** (siehe Kap. 4): keine Lese-Zugriffskontrolle auf Protokollebene | ❌ Heute nicht abbildbar |
| `ListingBookmark` | Privat. Bluesky löst eigene Bookmarks über proprietären privaten State, nicht über Protokoll-Records | ❌ Kein interoperables Muster; bliebe AppView-seitig |
| Soft-Delete (`deletedAt`) | Record-Delete im Repo; AppView muss Tombstones nachziehen. Achtung: bereits replizierte Kopien (Relays, fremde AppViews) sind nicht rückholbar | ⚠️ Löschung nur «best effort» netzwerkweit |

**Fazit Mapping:** Listings, Bilder und Identität mappen sauber — aber nur als öffentliche Daten. Alles, was LocalShare ausmacht (Communities, Groups, Invites, Visibility, Bookmarks), müsste weiterhin in der eigenen Postgres-DB leben.

## 4. Kernkonflikt: Privatheit

- **Public-by-default ist fundamental:** Jedes Record in einem Repo ist via Firehose bzw. `com.atproto.sync.getRepo` von *jedem* abrufbar — unabhängig davon, was die App im UI anzeigt. Ein `ch.localshare.listing`-Record mit «Sichtbarkeit: nur Nachbarschaft Wylergut» wäre trotzdem weltweit lesbar. App-seitige Filterung (heutiger `VisibilityService` im AppView) wäre reine Kosmetik.
- **Stand der Protokoll-Arbeit:** Die [Spring-2026-Roadmap](https://atproto.com/blog/2026-spring-roadmap) erklärt die Public-Data-Schicht für «broadly complete» und macht **Permissioned Data** zum Hauptfokus des Sommers 2026 — «new protocol concepts, sync mechanisms, and data flows», parallele Experimente (Blacksky, Northsky, Habitat), aber **kein Ship-Termin**.
- **Das Proposal passt zu LocalShare:** [Proposal 0016 «Permissioned Data»](https://github.com/bluesky-social/proposals/tree/main/0016-permissioned-data) definiert *Permissioned Spaces*: ein Space mit Owner-DID, dessen Host die Member-Liste verwaltet; Records mit Access-Perimeter, Zugriffskontrolle durch den PDS. Das ist konzeptionell fast exakt das LocalShare-Modell (Community = Space, Owner verwaltet Mitglieder, Listings mit Scope). Aber: explizit «initial proposal», Terminologie und Verhalten «likely to change»; Shared-Data-Arbeit startete erst nach Abschluss der Auth Scopes.
- **Konsequenz:** Wer heute private Gruppen-Inhalte auf atproto baut, baut sie *neben* dem Protokoll (eigene DB, eigene ACL) — genau das, was LocalShare schon hat.

## 5. Architektur-Optionen

### A) Voller atproto-Rewrite — ❌ heute nicht empfohlen
Lexicons `ch.localshare.*`, User-Daten in PDS-Repos, NestJS-Backend wird AppView (Tap-Webhook-Indexer + Postgres), Login via atproto OAuth.
- **Pro:** Portable Identität/Daten, Interoperabilität (Listings in anderen atproto-Apps sichtbar), kein eigener Auth-Stack.
- **Contra:** Listings zwingend öffentlich → bricht das Produktversprechen (private Nachbarschaften); Communities/Visibility/Bookmarks blieben trotzdem in eigener DB (Doppel-Architektur); Nutzer bräuchten atproto-Accounts (Onboarding-Hürde für nicht-technische Nachbarn); DSG/DSGVO-Risiko (Kap. 7).
- **Aufwand:** grob 2–4 Personenmonate (Backend-Neubau, Lexicon-Design, Migration, Frontend-Auth).

### B) Hybrid: atproto andocken — ✅ möglich, moderater Nutzen
App bleibt wie sie ist. Zwei unabhängige Bausteine:
1. **«Login mit Bluesky»** als dritter SSO-Provider: `SsoProvider`-Enum um `ATPROTO` erweitern, neue Passport-artige Strategy mit [`@atproto/oauth-client-node`](https://www.npmjs.com/package/@atproto/oauth-client-node), Button im Login (`login-page.tsx`). Aufwand: ~1–2 Wochen.
2. **Optionales Cross-Posting:** Ersteller kann ein Listing explizit als *öffentlich* markieren → App schreibt zusätzlich ein `ch.localshare.listing`-Record ins User-Repo (Reichweite im atproto-Netzwerk). Aufwand: ~1–2 Wochen + Lexicon-Design.
- **Pro:** Kein Umbau, echter Zusatznutzen, sammelt atproto-Erfahrung.
- **Contra:** Nutzerbasis (Nachbarn) hat kaum Bluesky-Accounts → Baustein 1 bringt evtl. wenig; Baustein 2 nur für bewusst öffentliche Angebote sinnvoll.

### C) Separater Proof-of-Concept — ✅ günstig zum Lernen
Statusphere-Tutorial ([atproto.com/guides/statusphere-tutorial](https://atproto.com/guides/statusphere-tutorial)) mit eigenem Listing-Lexicon nachbauen (`@atproto/lex` + Tap + SQLite). Aufwand: wenige Tage. Kein Produktionsnutzen, aber belastbare Team-Erfahrung.

### D) Status quo + Beobachten — ✅ Empfehlung (siehe Kap. 6)
Nichts bauen. Permissioned-Data-Proposal (0016) und Roadmap verfolgen; Re-Evaluation, wenn Spaces produktionsreif sind.

## 6. Empfehlung

**D, optional kombiniert mit B1 (atproto-Login), falls Bluesky-affine Nutzer relevant werden.**

Begründung:
1. Der einzige Teil von LocalShare, der von atproto heute profitieren würde (öffentliche Listings), widerspricht dem Kernversprechen des Produkts (private Nachbarschaften).
2. Der Teil, der wirklich passen würde — Permissioned Spaces ≈ Communities — ist genau das, was die atproto-Community gerade entwirft, aber ohne Termin und mit angekündigten Breaking Changes. Jetzt darauf zu bauen hiesse, auf einen Draft zu bauen.
3. Ein Rewrite jetzt ergäbe eine Doppel-Architektur (Records für Öffentliches + eigene DB für alles Private) mit den Kosten beider Welten und dem Nutzen keiner.
4. Wenn Permissioned Data shipped, ist LocalShare ein nahezu idealer Anwendungsfall — dann lohnt sich eine echte Neubewertung (Option A auf Basis von Spaces). Bis dahin hält Option C das Wissen aktuell, falls gewünscht.

## 7. Risiken & offene Fragen

- **DSG/DSGVO vs. öffentliche Repos:** Records werden netzwerkweit repliziert (Relays, fremde AppViews). Löschbegehren sind nur im eigenen Repo durchsetzbar — für eine Schweizer Nachbarschafts-App mit Klarnamen/Adressen ein reales Compliance-Risiko bei Option A/B2.
- **Onboarding:** Zielgruppe (Nachbarn) hat mehrheitlich keine atproto-Accounts. Entweder Bluesky-Signup zumuten oder selbst PDS-Accounts anbieten (Betrieb möglich und günstig — ~$5/Monat-VPS-Klasse pro kleiner Instanz — aber zusätzliche Betriebsverantwortung inkl. Account-Support).
- **Protokoll-Dynamik:** Tooling ändert sich schnell (2025: Jetstream-Indexer, 2026: `@atproto/lex` + Tap). Frühe Investitionen können Rework bedeuten.
- **Private State bleibt proprietär:** Selbst Bluesky löst Bookmarks ausserhalb des Protokolls — Interoperabilität für private Daten existiert noch nirgends.
- **Offen:** Will LocalShare überhaupt Reichweite/Föderation, oder ist Geschlossenheit ein Feature? Diese Produktfrage entscheidet mehr als die Technik.

## 8. Quellen (abgerufen 2026-08-09)

- [AT Protocol Roadmap (Spring 2026)](https://atproto.com/blog/2026-spring-roadmap) — Status Permissioned Data, OAuth/Permission Sets
- [Proposal 0016: Permissioned Data](https://github.com/bluesky-social/proposals/tree/main/0016-permissioned-data) ([PR #94](https://github.com/bluesky-social/proposals/pull/94)) — Spaces, Access-Perimeter
- [Private Data Working Group — AT Protocol Community Wiki](https://atproto.wiki/en/working-groups/private-data)
- [OAuth — AT Protocol Spec](https://atproto.com/specs/oauth) · [OAuth for AT Protocol (Blog)](https://docs.bsky.app/blog/oauth-atproto) · [`@atproto/oauth-client-node`](https://www.npmjs.com/package/@atproto/oauth-client-node)
- [Statusphere Example App Tutorial](https://atproto.com/guides/statusphere-tutorial) — Referenzarchitektur Third-Party-App (Lex, Tap)
- [Smoke Signal Tech Talk](https://atprotocol.dev/tech-talk-smoke-signal-events/) — Events/RSVP auf atproto (Community-Lexicons)
- [TechCrunch: Beyond Bluesky — Apps auf AT Protocol](https://techcrunch.com/2025/06/13/beyond-bluesky-these-are-the-apps-building-social-experiences-on-the-at-protocol/) — u.a. Frontpage
- [Self-hosting — AT Protocol Guide](https://atproto.com/guides/self-hosting) · [PDS-Self-Hosting-Guide 2026 (Pi Stack)](https://www.pistack.xyz/posts/2026-04-23-self-host-bluesky-pds-at-protocol-server-guide-2026/) — Betrieb/Kosten
- [macwright.com: I haven't made anything with AT Proto yet (03/2026)](https://macwright.com/2026/03/16/atproto) — unabhängige Einschätzung private data

Quellen Update (abgerufen 2026-09-30):

- [The Atproto Spaces Alpha is Live (20.08.2026)](https://atproto.com/blog/atproto-spaces-alpha) — Alpha-Ankündigung, SDKs, bulletin.my, Limitationen, Timeline
- [Proposal-PR #115: Rename to atproto spaces (merged 28.09.2026)](https://github.com/bluesky-social/proposals/pull/115)
- [Spec-Deltas September 2026 (ezpds Spaces-Alpha-Watch)](https://github.com/malpercio-dev/ezpds/pull/660) — laufende Breaking Changes (readPolicy/writePolicy, putMember)
- [bluesky-social/bulletin @ `0acf237`](https://github.com/bluesky-social/bulletin) — Vorlage des PoC (Kap. 1b)
- [bluesky-social/atproto, Branch `permissioned-data-alpha`](https://github.com/bluesky-social/atproto/tree/permissioned-data-alpha) — lokales Dev-Netz des PoC
