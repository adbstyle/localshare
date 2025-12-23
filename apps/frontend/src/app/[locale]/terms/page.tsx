export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Nutzungsbedingungen</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Geltungsbereich</h2>
          <p className="text-muted-foreground">
            Diese Nutzungsbedingungen gelten für die Nutzung der LocalShare-Plattform
            ("die Plattform"), einer Progressive Web App für nachbarschaftliches Teilen
            von Anzeigen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Zulässige Nutzung</h2>
          <p className="text-muted-foreground">Die Plattform darf genutzt werden für:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Verkauf, Vermietung oder Verleih von legalen Gütern</li>
            <li>Anbieten und Suchen von legalen Dienstleistungen</li>
            <li>Nachbarschaftliche Gemeinschaften und Gruppen</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Verbotene Nutzung</h2>
          <p className="text-muted-foreground">Folgendes ist ausdrücklich verboten:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Veröffentlichung illegaler Inhalte (Drogen, Waffen, gestohlene Güter, etc.)</li>
            <li>Spam oder kommerzielle Massenwerbung</li>
            <li>Hassrede, Beleidigungen oder Diskriminierung</li>
            <li>Betrug oder irreführende Anzeigen</li>
            <li>Pornografische oder jugendgefährdende Inhalte</li>
            <li>Verletzung von Urheberrechten oder Markenrechten</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Account und Verantwortung</h2>
          <p className="text-muted-foreground">
            Sie sind verantwortlich für:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Die Richtigkeit Ihrer Angaben (Name, Adresse, Kontaktdaten)</li>
            <li>Die Sicherheit Ihres Accounts (Google/Microsoft Login)</li>
            <li>Alle Aktivitäten unter Ihrem Account</li>
            <li>Die Rechtmässigkeit Ihrer Anzeigen und Aktivitäten</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Haftungsausschluss</h2>
          <p className="text-muted-foreground">
            <strong>Die Plattform ist nur ein Vermittler.</strong> Wir haften nicht für:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Transaktionen zwischen Nutzern (Verkauf, Verleih, etc.)</li>
            <li>Qualität, Zustand oder Rechtmässigkeit angebotener Güter/Dienstleistungen</li>
            <li>Schäden aus fehlgeschlagenen Transaktionen</li>
            <li>Verlust von Daten durch technische Probleme</li>
            <li>Missbrauch der Plattform durch andere Nutzer</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            <strong>Wichtig:</strong> Alle Transaktionen finden ausserhalb der Plattform statt.
            Sie sind selbst verantwortlich für die Abwicklung (Übergabe, Zahlung, etc.).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Rechte an User-Content</h2>
          <p className="text-muted-foreground">
            Sie behalten alle Rechte an Ihren Anzeigen, Bildern und Texten.
          </p>
          <p className="text-muted-foreground mt-4">
            Durch Veröffentlichung gewähren Sie der Plattform eine nicht-exklusive,
            weltweite Lizenz zur Anzeige und Verbreitung Ihrer Inhalte zum Zweck
            der Plattform-Funktionalität.
          </p>
          <p className="text-muted-foreground mt-4">
            Sie können Ihre Inhalte jederzeit löschen. Die Lizenz erlischt dann.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Moderation und Account-Sperrung</h2>
          <p className="text-muted-foreground">
            Wir behalten uns das Recht vor:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Anzeigen zu löschen, die gegen diese Nutzungsbedingungen verstossen</li>
            <li>Accounts bei Missbrauch zu sperren (temporär oder permanent)</li>
            <li>Gemeinschaften/Gruppen mit illegalen Inhalten zu löschen</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Eine Sperrung erfolgt in der Regel nach Warnung, kann aber bei schweren
            Verstössen (illegale Inhalte, Betrug) sofort erfolgen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Verfügbarkeit der Plattform</h2>
          <p className="text-muted-foreground">
            Wir bemühen uns um hohe Verfügbarkeit, können aber keine Garantie geben.
            Die Plattform kann temporär ausfallen (Wartung, Updates, technische Probleme).
          </p>
          <p className="text-muted-foreground mt-4">
            Wir behalten uns das Recht vor, die Plattform jederzeit einzustellen,
            werden aber mindestens 30 Tage vorher informieren.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Änderungen der Nutzungsbedingungen</h2>
          <p className="text-muted-foreground">
            Wir können diese Nutzungsbedingungen jederzeit ändern.
            Änderungen werden auf dieser Seite veröffentlicht.
          </p>
          <p className="text-muted-foreground mt-4">
            Bei wesentlichen Änderungen werden Sie per E-Mail informiert.
            Durch weitere Nutzung nach Änderungen akzeptieren Sie die neuen Bedingungen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Anwendbares Recht und Gerichtsstand</h2>
          <p className="text-muted-foreground">
            Es gilt Schweizer Recht unter Ausschluss des UN-Kaufrechts (CISG).
          </p>
          <p className="text-muted-foreground mt-4">
            Gerichtsstand ist Zürich, Schweiz (bei kommerziellem Betrieb der Plattform).
            Für Konsumenten gilt der gesetzliche Gerichtsstand.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Salvatorische Klausel</h2>
          <p className="text-muted-foreground">
            Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein,
            bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Kontakt</h2>
          <p className="text-muted-foreground">
            Bei Fragen zu diesen Nutzungsbedingungen kontaktieren Sie uns unter:
          </p>
          <p className="text-muted-foreground mt-2">
            <strong>E-Mail:</strong> legal@localshare.ch
          </p>
        </section>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <p>Stand: Dezember 2025</p>
          <p className="mt-2">
            Diese Nutzungsbedingungen wurden für die LocalShare-Plattform erstellt und
            entsprechen Schweizer Recht.
          </p>
        </div>
      </div>
    </div>
  );
}
