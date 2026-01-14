# Implement-Issue Orchestrator Agent

Autonomer Entwicklungsteam-Koordinator für LocalShare. Orchestriert den gesamten Entwicklungsprozess von Issue bis Deployment.

## Quick Start

```bash
/implement-issue <ISSUE_NUMBER>
# oder
/implement-issue <GITHUB_URL>
```

**Beispiel:**
```bash
/implement-issue 5
/implement-issue https://github.com/adbstyle/localshare/issues/5
```

## Workflow-Phasen

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENT-ISSUE WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │ Phase 1      │  gh issue view + git checkout                 │
│  │ Issue & Git  │  → feature/* oder bugfix/* Branch             │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 2      │  systematic-debugging Skill                   │
│  │ Analyse      │  → Root Cause / Requirements                  │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 3      │  senior-architect Skill                       │
│  │ Architektur  │  → Technische Lösung entwerfen                │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 4      │  senior-fullstack ODER senior-frontend        │
│  │ Implement    │  → Code schreiben                             │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 5      │  code-reviewer + /code-review                 │
│  │ Review       │  → Verbesserungsvorschläge (keine Impl.)      │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 6      │  senior-architect Skill                       │
│  │ Bewertung    │  → Review-Vorschläge evaluieren               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 7      │  senior-fullstack ODER senior-frontend        │
│  │ Umsetzung    │  → Empfohlene Verbesserungen                  │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 8      │  qa-qualityassurance Skill                    │
│  │ QA Testing   │  → Automatisierte Tests                       │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 9      │  kill-port.sh + clean:cache + dev             │
│  │ Clean Start  │  → Services neu starten                       │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 10     │  ⚠️  USER INTERACTION REQUIRED                │
│  │ Manual Test  │  → Warte auf Bestätigung                      │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Phase 11     │  gh issue close                               │
│  │ Issue Close  │  → Abschluss auf GitHub                       │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Phasen-Details

### Phase 1: Issue & Branch Setup

| Aktion | Command |
|--------|---------|
| Issue laden | `gh issue view <NR> --json title,body,labels,comments` |
| Auf develop wechseln | `git checkout develop && git pull` |
| Branch erstellen | Basierend auf Labels (siehe unten) |

**Branch-Naming:**

| Issue Labels | Branch Prefix | Beispiel |
|--------------|---------------|----------|
| `epic`, `story`, `feature`, `enhancement` | `feature/` | `feature/5-user-auth` |
| `bug`, `problem`, `fix` | `bugfix/` | `bugfix/12-login-crash` |

### Phase 2: Analyse (systematic-debugging)

- Analysiert Problem/Feature im Kontext
- Identifiziert betroffene Dateien
- Dokumentiert Root Cause (Bug) oder Requirements (Feature)

### Phase 3: Architektur (senior-architect)

- Entwirft technische Lösung
- Berücksichtigt CLAUDE.md Patterns
- Erstellt Implementierungsplan
- **Entscheidet:** Frontend-only vs. Fullstack

### Phase 4: Implementation

| Entscheidung | Skill |
|--------------|-------|
| Frontend-only | `senior-frontend` |
| Fullstack | `senior-fullstack` |

### Phase 5: Code Review

Zwei Review-Durchläufe:
1. `code-reviewer` Skill
2. `/code-review` Command

**Wichtig:** In dieser Phase wird NICHT implementiert, nur Vorschläge gesammelt.

### Phase 6: Review-Bewertung

`senior-architect` bewertet jeden Vorschlag:
- Umsetzen (mit Begründung)
- Ablehnen (mit Begründung)

### Phase 7: Verbesserungen umsetzen

Gleicher Skill wie Phase 4 setzt die vom Architekten genehmigten Verbesserungen um.

### Phase 8: QA Testing

`qa-qualityassurance` führt aus:
- Automatisierte Tests
- Regressionsprüfung
- Validierung gegen Issue-Anforderungen

### Phase 9: Clean Restart

```bash
./scripts/kill-port.sh 3000 3001
npm run clean:cache
npm run dev
```

### Phase 10: Manuelle Tests (USER PAUSE)

**Einzige Phase mit User-Interaktion!**

Agent zeigt:
- Zusammenfassung der Änderungen
- Liste geänderter Dateien
- Test-Szenarien zum Prüfen

Wartet auf User-Bestätigung.

### Phase 11: Issue schliessen

```bash
gh issue close <NR> --comment "Implemented in branch <name>. Ready for PR."
```

## Verwendete Skills

| Skill | Zweck |
|-------|-------|
| `systematic-debugging` | Problem-Analyse |
| `senior-architect` | Architektur & Review-Bewertung |
| `senior-fullstack` | Backend + Frontend Implementation |
| `senior-frontend` | Frontend-only Implementation |
| `code-reviewer` | Code Review |
| `code-review:code-review` | PR-Style Review |
| `qa-qualityassurance` | Testing |

## Konfiguration

### Permissions (settings.local.json)

Folgende Permissions müssen erlaubt sein:

```json
{
  "permissions": {
    "allow": [
      "Bash(gh issue view:*)",
      "Bash(gh issue close:*)",
      "Bash(git checkout:*)",
      "Bash(git pull:*)",
      "Bash(git branch:*)",
      "Bash(./scripts/kill-port.sh:*)",
      "Bash(npm run clean:cache:*)",
      "Bash(npm run dev:*)",
      "Skill(systematic-debugging:*)",
      "Skill(senior-architect:*)",
      "Skill(senior-fullstack:*)",
      "Skill(senior-frontend:*)",
      "Skill(code-reviewer:*)",
      "Skill(code-review:code-review:*)",
      "Skill(qa-qualityassurance:*)"
    ]
  }
}
```

### Command-Datei

Speicherort: `.claude/commands/implement-issue.md`

## Output-Format

Nach jeder Phase:
```
✓ Phase X: [Name] - [Status]
  → [Kurze Beschreibung]
```

Abschluss-Zusammenfassung mit allen Änderungen.

## Einschränkungen

1. **User-Bestätigung bei Phase 10** - Design-Entscheidung für Qualitätssicherung
2. **Skill-Permissions** - Jeder Skill muss in settings.local.json erlaubt sein
3. **GitHub CLI** - `gh` muss authentifiziert sein (`gh auth login`)
4. **Develop Branch** - Muss existieren und aktuell sein

## Troubleshooting

### "Permission denied" bei Skill

→ Skill zu `settings.local.json` permissions hinzufügen

### "gh: command not found"

```bash
brew install gh
gh auth login
```

### Branch existiert bereits

→ Agent versucht automatisch mit Suffix (`-v2`, `-v3`, etc.)

### Issue nicht gefunden

→ Prüfe Repository-Zugriff: `gh repo view adbstyle/localshare`
