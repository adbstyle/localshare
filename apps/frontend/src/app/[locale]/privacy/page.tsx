export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Datenschutzerklärung</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <p className="text-muted-foreground">
          Der LocalShare Verein ("wir", "uns", "Betreiber") betreibt die LocalShare-Plattform.
          Wir verpflichten uns zum Schutz Ihrer Privatsphäre und zur Einhaltung des Schweizer
          Datenschutzgesetzes (DSG) und der EU-Datenschutzgrundverordnung (DSGVO).
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Verantwortlicher</h2>
          <p className="text-muted-foreground">
            Verantwortlich für die Datenverarbeitung ist:
          </p>
          <p className="text-muted-foreground mt-2">
            <strong>LocalShare Verein</strong><br />
            [Vereinsadresse]<br />
            [PLZ Ort]<br />
            Schweiz<br />
            <br />
            <strong>E-Mail:</strong> privacy@localshare.ch
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Erhobene Daten</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personenbezogene Daten</h3>
          <p className="text-muted-foreground">Wir erheben folgende Daten:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>E-Mail-Adresse, Vor- und Nachname (von Google/Microsoft SSO)</li>
            <li>Hausadresse (von Ihnen angegeben, Pflichtfeld)</li>
            <li>Telefonnummer (optional, von Ihnen angegeben)</li>
            <li>Inhalt Ihrer Anzeigen (Titel, Beschreibung, Bilder, Kategorie, Preis)</li>
            <li>Mitgliedschaften in Gemeinschaften und Gruppen</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Technische Daten</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>IP-Adresse (anonymisiert)</li>
            <li>Browser-Typ und -Version</li>
            <li>Betriebssystem</li>
            <li>Zeitpunkt des Zugriffs</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            <strong>Hinweis:</strong> Wir verwenden <strong>keine</strong> Tracking-Tools wie
            Google Analytics oder vergleichbare Dienste.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Verwendung der Daten</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Wir verwenden Ihre Daten für:</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Authentifizierung und Account-Verwaltung</li>
            <li>Anzeigen von Anzeigen innerhalb Ihrer Gemeinschaften</li>
            <li>Kontaktaufnahme zwischen Nutzern (E-Mail, Signal, WhatsApp)</li>
            <li>Verwaltung von Gemeinschaften und Gruppen</li>
            <li>Sicherheit der Plattform (Missbrauchsprävention)</li>
            <li>Benachrichtigungen über Änderungen an der Plattform oder Ihrem Account</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Wir verwenden Ihre Daten NICHT für:</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Werbung oder Marketing</li>
            <li>Weitergabe oder Verkauf an Dritte</li>
            <li>Profiling oder automatisierte Entscheidungsfindung</li>
            <li>Tracking oder Verhaltensanalyse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Rechtsgrundlage (Art. 6 DSGVO)</h2>
          <p className="text-muted-foreground">
            Wir verarbeiten Ihre Daten auf folgenden Rechtsgrundlagen:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b):</strong> Verarbeitung ist
              notwendig für die Bereitstellung der Plattform-Funktionen
            </li>
            <li>
              <strong>Einwilligung (Art. 6 Abs. 1 lit. a):</strong> Für optionale Funktionen
              wie Newsletter oder erweiterte Benachrichtigungen
            </li>
            <li>
              <strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f):</strong> Sicherheit der
              Plattform, Missbrauchsprävention, Verbesserung des Dienstes
            </li>
            <li>
              <strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c):</strong> Erfüllung
              gesetzlicher Aufbewahrungspflichten
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Speicherort und Datensicherheit</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Speicherort</h3>
          <p className="text-muted-foreground">
            Alle Daten werden auf Servern in der Schweiz/EU gespeichert und verarbeitet.
            Wir verwenden PostgreSQL als Datenbank.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Sicherheitsmassnahmen</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>HTTPS-Verschlüsselung für alle Verbindungen</li>
            <li>Verschlüsselte Speicherung von Passwörtern (bcrypt)</li>
            <li>Regelmässige Sicherheitsupdates</li>
            <li>Zugriffsbeschränkungen auf Datenbankebene</li>
            <li>HttpOnly-Cookies für Authentifizierungs-Tokens</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. SSO-Provider (Google, Microsoft)</h2>
          <p className="text-muted-foreground">
            Wir nutzen Google und Microsoft für die Authentifizierung (Single Sign-On).
            Beim Login werden folgende Daten von diesen Providern abgerufen:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>E-Mail-Adresse</li>
            <li>Vorname und Nachname</li>
            <li>Profil-ID (zur Verknüpfung Ihres Accounts)</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Wir fordern <strong>keine</strong> Zugriffe auf Gmail, Google Drive, OneDrive oder
            andere Dienste an. Bitte beachten Sie die Datenschutzrichtlinien von{' '}
            <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener">
              Google
            </a>{' '}
            und{' '}
            <a href="https://privacy.microsoft.com/" className="underline" target="_blank" rel="noopener">
              Microsoft
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies</h2>
          <p className="text-muted-foreground">
            Wir verwenden nur technisch notwendige Cookies:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Refresh Token</strong> (httpOnly Cookie): Für die Authentifizierung,
              Gültigkeitsdauer 90 Tage
            </li>
            <li>
              <strong>Locale</strong>: Speichert Ihre Sprachpräferenz (Deutsch/Französisch)
            </li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Wir verwenden <strong>keine</strong> Tracking-Cookies, Marketing-Cookies oder
            Cookies von Drittanbietern.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Datenweitergabe an Dritte</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Sichtbarkeit für andere Nutzer</h3>
          <p className="text-muted-foreground">
            Ihre Kontaktdaten (E-Mail, Hausadresse, optional Telefonnummer) werden <strong>nur</strong>{' '}
            anderen Nutzern angezeigt, wenn diese eine Ihrer Anzeigen ansehen. Dies ist notwendig,
            damit Interessenten Sie kontaktieren können.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Keine Weitergabe an Dritte</h3>
          <p className="text-muted-foreground">
            Wir verkaufen, vermieten oder teilen Ihre Daten <strong>nicht</strong> mit Dritten, ausser:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>SSO-Provider (Google/Microsoft) für Login-Authentifizierung</li>
            <li>Bei rechtlicher Verpflichtung (z.B. Gerichtsbeschluss, behördliche Anfrage)</li>
            <li>Zum Schutz unserer Rechte oder der Sicherheit anderer Nutzer</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Aufbewahrungsdauer</h2>
          <p className="text-muted-foreground">
            Wir speichern Ihre Daten nur so lange, wie es für die Zwecke erforderlich ist:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Account-Daten:</strong> Bis zur Löschung Ihres Accounts</li>
            <li><strong>Anzeigen:</strong> Bis zur Löschung oder 6 Monate nach Archivierung</li>
            <li><strong>Server-Logs:</strong> 30 Tage (anonymisiert)</li>
            <li><strong>Gelöschte Accounts:</strong> Endgültige Löschung nach 30 Tagen Wartefrist</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Ihre Rechte (DSGVO/DSG)</h2>
          <p className="text-muted-foreground">Sie haben folgende Rechte:</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Auskunftsrecht</h3>
          <p className="text-muted-foreground">
            Sie können jederzeit Auskunft über die von uns gespeicherten Daten verlangen.
            Nutzen Sie hierfür die Funktion "Daten exportieren" in Ihrem Profil oder
            kontaktieren Sie uns per E-Mail.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Recht auf Löschung</h3>
          <p className="text-muted-foreground">
            Sie können Ihren Account und alle damit verbundenen Daten jederzeit in den
            Account-Einstellungen löschen. Nach der Löschung gibt es eine 30-tägige Wartefrist,
            danach werden alle Daten endgültig gelöscht.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.3 Recht auf Datenportabilität</h3>
          <p className="text-muted-foreground">
            Nutzen Sie die "Daten exportieren"-Funktion in Ihrem Profil für einen
            DSGVO-konformen Export Ihrer Daten im JSON-Format.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.4 Recht auf Berichtigung</h3>
          <p className="text-muted-foreground">
            Bearbeiten Sie Ihre Daten jederzeit in Ihrem Profil oder kontaktieren Sie uns.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.5 Widerspruchsrecht</h3>
          <p className="text-muted-foreground">
            Sie können der Verarbeitung Ihrer Daten widersprechen, sofern die Verarbeitung
            auf berechtigtem Interesse basiert.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.6 Beschwerderecht</h3>
          <p className="text-muted-foreground">
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
            In der Schweiz ist dies der Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte
            (EDÖB).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Minderjährige</h2>
          <p className="text-muted-foreground">
            Die Plattform richtet sich an Personen ab 18 Jahren. Wir erheben wissentlich keine
            Daten von Minderjährigen unter 18 Jahren. Wenn Sie glauben, dass wir Daten eines
            Minderjährigen gespeichert haben, kontaktieren Sie uns bitte umgehend.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Haftungsbeschränkung</h2>
          <p className="text-muted-foreground">
            Wir garantieren keine unterbrechungsfreie oder fehlerfreie Verfügbarkeit der Plattform.
            Alle Dienste werden "wie besehen" bereitgestellt. Im maximal zulässigen gesetzlichen
            Rahmen haften wir nicht für indirekte Schäden, Datenverlust, entgangenen Gewinn oder
            andere Folgeschäden.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Änderungen dieser Datenschutzerklärung</h2>
          <p className="text-muted-foreground">
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
            Rechtslage oder Änderungen unserer Dienstleistungen anzupassen. Bei wesentlichen
            Änderungen werden Sie per E-Mail informiert. Die aktuelle Version ist immer
            unter /privacy abrufbar.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Kontakt</h2>
          <p className="text-muted-foreground">
            Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:
          </p>
          <p className="text-muted-foreground mt-2">
            <strong>E-Mail:</strong> privacy@localshare.ch<br />
            <strong>Datenschutzverantwortlicher:</strong> Vorstand LocalShare Verein
          </p>
        </section>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <p>Stand: Januar 2026</p>
          <p className="mt-2">
            Diese Datenschutzerklärung erfüllt die Anforderungen der DSGVO (EU) und des
            Schweizer Datenschutzgesetzes (DSG, revidierte Fassung 2023).
          </p>
        </div>
      </div>
    </div>
  );
}
