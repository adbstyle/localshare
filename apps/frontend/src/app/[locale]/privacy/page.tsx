import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Datenschutzerklärung</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Datenerhebung</h2>
          <p className="text-muted-foreground">Wir erheben folgende Daten:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>E-Mail-Adresse, Vor- und Nachname (von Google/Microsoft SSO)</li>
            <li>Hausadresse (von Ihnen angegeben, Pflichtfeld)</li>
            <li>Telefonnummer (optional, von Ihnen angegeben)</li>
            <li>Inhalt Ihrer Anzeigen (Titel, Beschreibung, Bilder, Kategorie)</li>
            <li>Mitgliedschaften in Gemeinschaften und Gruppen</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Verwendung der Daten</h2>
          <p className="text-muted-foreground">
            Ihre Daten werden ausschliesslich zur Bereitstellung der App-Funktionalität verwendet:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Authentifizierung und Account-Verwaltung</li>
            <li>Anzeigen von Anzeigen innerhalb Ihrer Gemeinschaften</li>
            <li>Kontaktaufnahme zwischen Nutzern (E-Mail, Signal, WhatsApp)</li>
            <li>Verwaltung von Gemeinschaften und Gruppen</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            <strong>Wir verwenden Ihre Daten NICHT für:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Werbung oder Marketing</li>
            <li>Weitergabe an Dritte (ausser SSO-Provider für Login)</li>
            <li>Tracking oder Analyse über Google Analytics o.ä.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Speicherort der Daten</h2>
          <p className="text-muted-foreground">
            Alle Daten werden auf Servern in der Schweiz/EU gespeichert und verarbeitet.
            Wir verwenden PostgreSQL als Datenbank und hosten die Applikation selbst.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. SSO-Provider (Google, Microsoft)</h2>
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
            Wir fordern <strong>keine</strong> Zugriffe auf Gmail, Google Drive, OneDrive oder andere Dienste an.
            Bitte beachten Sie die Datenschutzrichtlinien von{' '}
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
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cookies</h2>
          <p className="text-muted-foreground">
            Wir verwenden folgende Cookies:
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
            Wir verwenden <strong>keine</strong> Tracking-Cookies von Drittanbietern.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Ihre Rechte (DSGVO/DSG)</h2>
          <p className="text-muted-foreground">Sie haben folgende Rechte:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Recht auf Auskunft</strong>: Sie können jederzeit einsehen, welche Daten
              wir über Sie gespeichert haben
            </li>
            <li>
              <strong>Recht auf Löschung</strong>: Sie können Ihren Account jederzeit in den
              Einstellungen löschen
            </li>
            <li>
              <strong>Recht auf Datenportabilität</strong>: Nutzen Sie die
              "Daten exportieren"-Funktion in Ihrem Profil für einen DSGVO-konformen Export
            </li>
            <li>
              <strong>Recht auf Korrektur</strong>: Bearbeiten Sie Ihre Daten jederzeit in
              Ihrem Profil
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Datenweitergabe</h2>
          <p className="text-muted-foreground">
            Ihre Kontaktdaten (E-Mail, Hausadresse, optional Telefonnummer) werden <strong>nur</strong>{' '}
            anderen Nutzern angezeigt, wenn diese eine Ihrer Anzeigen ansehen.
            Dies ist notwendig, damit Interessenten Sie kontaktieren können.
          </p>
          <p className="text-muted-foreground mt-4">
            Wir geben <strong>keine</strong> Daten an Dritte weiter, ausser:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>SSO-Provider (Google/Microsoft) für Login-Authentifizierung</li>
            <li>Bei rechtlicher Verpflichtung (z.B. Gerichtsbeschluss)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Datensicherheit</h2>
          <p className="text-muted-foreground">
            Wir setzen technische und organisatorische Massnahmen zum Schutz Ihrer Daten ein:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>HTTPS-Verschlüsselung für alle Verbindungen</li>
            <li>Verschlüsselte Speicherung von Passwörtern (bcrypt)</li>
            <li>Regelmässige Sicherheitsupdates</li>
            <li>Zugriffsbeschränkungen auf Datenbankebene</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Änderungen dieser Datenschutzerklärung</h2>
          <p className="text-muted-foreground">
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
            Rechtslage oder Änderungen unserer Dienstleistungen anzupassen. Die aktuelle Version
            ist immer unter /privacy abrufbar.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Kontakt</h2>
          <p className="text-muted-foreground">
            Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:
          </p>
          <p className="text-muted-foreground mt-2">
            <strong>E-Mail:</strong> privacy@localshare.ch<br />
            <strong>Datenschutzbeauftragter:</strong> LocalShare Team
          </p>
        </section>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <p>Stand: Dezember 2025</p>
          <p className="mt-2">
            Diese Datenschutzerklärung erfüllt die Anforderungen der DSGVO (EU) und des
            Schweizer Datenschutzgesetzes (DSG).
          </p>
        </div>
      </div>
    </div>
  );
}
