import type { ReactNode } from 'react';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mt-8 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>;
}

function Text({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-muted-foreground ${className}`}>{children}</p>;
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">{children}</ul>;
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="underline" target="_blank" rel="noopener">
      {children}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Datenschutzerklärung</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <Text>
          Der Verein LocalShare («wir») betreibt die Plattform LocalShare. Diese Erklärung beschreibt
          so genau wie möglich, welche Personendaten die Plattform bearbeitet, wer sie sehen kann,
          wo sie gespeichert sind und wie lange. Wo die Plattform heute noch nicht so arbeitet, wie
          wir es uns wünschen, sagen wir das offen. Massgebend sind das Schweizer
          Datenschutzgesetz (DSG) und, soweit anwendbar, die EU-Datenschutz-Grundverordnung (DSGVO).
        </Text>

        <Section title="1. Verantwortlicher">
          <Text>Verantwortlich für die Datenbearbeitung ist:</Text>
          <Text className="mt-2">
            <strong>Verein LocalShare</strong>
            <br />
            Sitz: Bern, Schweiz
            <br />
            <br />
            <strong>E-Mail:</strong> info@localshare.ch
          </Text>
        </Section>

        <Section title="2. Welche Daten wir bearbeiten">
          <SubTitle>2.1 Ihr Konto</SubTitle>
          <List>
            <li>
              E-Mail-Adresse, Vor- und Nachname: Diese übernehmen wir bei Ihrer ersten Anmeldung von
              Google oder Microsoft. Spätere Änderungen bei Google oder Microsoft übernehmen wir nicht
              automatisch. Vor- und Nachname können Sie im Profil ändern.
            </li>
            <li>Kennung Ihres Kontos bei Google bzw. Microsoft und die dort hinterlegte E-Mail-Adresse</li>
            <li>Bevorzugte Sprache (Deutsch oder Französisch)</li>
            <li>Zeitpunkt, zu dem Sie bei der Registrierung den Nutzungsbedingungen und dieser Datenschutzerklärung zugestimmt haben</li>
            <li>Zeitpunkt der Erstellung und der letzten Änderung Ihres Kontos</li>
          </List>

          <SubTitle>2.2 Freiwillige Angaben</SubTitle>
          <List>
            <li>Wohnadresse</li>
            <li>Telefonnummer</li>
          </List>
          <Text className="mt-2">
            Beide Angaben sind freiwillig. Sie können sie im Profil jederzeit ändern oder entfernen.
          </Text>

          <SubTitle>2.3 Inhalte, die Sie erstellen</SubTitle>
          <List>
            <li>Inserate: Titel, Beschreibung, Art (verkaufen, vermieten, verleihen, suchen), Kategorie, Preis und Zeiteinheit</li>
            <li>
              Bilder zu Inseraten: Wir speichern eine verkleinerte Fassung (max. 1280 Pixel breit) und ein
              Vorschaubild. Gespeicherte Bilder enthalten keine Metadaten, also auch keine GPS-Standortdaten.
              Zusätzlich speichern wir den ursprünglichen Dateinamen (z. B. «IMG_1234.jpg») und die Dateigrösse.
            </li>
            <li>Mit welchen Communitys und Gruppen Sie ein Inserat teilen</li>
            <li>Ihre Merkliste (gemerkte Inserate)</li>
            <li>Communitys und Gruppen, die Sie gründen: Name, Beschreibung und Einladungslink</li>
            <li>Ihre Mitgliedschaften in Communitys und Gruppen, jeweils mit dem Beitrittsdatum</li>
          </List>

          <SubTitle>2.4 Anmeldesitzungen</SubTitle>
          <Text>
            Damit Sie angemeldet bleiben, speichern wir bei jeder Anmeldung und bei jeder automatischen
            Verlängerung der Sitzung (bei aktiver Nutzung etwa alle 15 Minuten) einen Eintrag mit einem
            nicht umkehrbaren Prüfwert (Hash) des Sitzungsschlüssels, dem Zeitpunkt und dem Ablaufdatum. Aus diesen Einträgen
            lässt sich ablesen, wann Sie die Plattform ungefähr genutzt haben. Wir werten sie dafür nicht
            aus. Die Einträge werden derzeit erst gelöscht, wenn Sie Ihr Konto löschen.
          </Text>

          <SubTitle>2.5 Technische Daten bei unseren Hosting-Anbietern</SubTitle>
          <Text>
            Bei jedem Aufruf der Plattform verarbeiten unsere Hosting-Anbieter (siehe Abschnitt 7)
            technisch notwendige Daten: Ihre IP-Adresse und den daraus abgeleiteten ungefähren Standort,
            den Browser und das Betriebssystem, die aufgerufene Adresse inklusive Parametern (z. B.
            Suchbegriffe oder Einladungscodes), den Zeitpunkt und das Ergebnis der Anfrage. Die Plattform
            selbst speichert keine IP-Adressen und wertet diese Daten nicht aus. Wir anonymisieren sie auch
            nicht; sie liegen in den Protokollen der Anbieter vor (Aufbewahrung siehe Abschnitt 10).
          </Text>

          <SubTitle>2.6 Was wir nicht erheben</SubTitle>
          <List>
            <li>Keine Analyse- oder Tracking-Werkzeuge (z. B. kein Google Analytics), keine Werbung</li>
            <li>Keine Schriften, Skripte oder Inhalte von Drittanbietern in Ihrem Browser</li>
            <li>Kein Profilbild und kein Zugriff auf Ihre E-Mails, Kontakte, Kalender oder Dateien bei Google oder Microsoft</li>
            <li>Keine Standortdaten</li>
          </List>
        </Section>

        <Section title="3. Wofür wir die Daten verwenden">
          <List>
            <li>Anmeldung und Verwaltung Ihres Kontos</li>
            <li>Anzeige Ihrer Inserate in den Communitys und Gruppen, die Sie auswählen</li>
            <li>Kontaktaufnahme zwischen Mitgliedern</li>
            <li>Verwaltung von Communitys, Gruppen und Einladungen</li>
            <li>Betrieb, Fehlersuche und Sicherheit der Plattform (technische Daten gemäss Abschnitt 2.5)</li>
          </List>
          <Text className="mt-4">
            Wir verwenden Ihre Daten nicht für Werbung, verkaufen sie nicht und erstellen keine Profile.
            Die Plattform versendet keine E-Mails. Falls wir Sie kontaktieren müssen (z. B. bei wesentlichen
            Änderungen), schreiben wir Ihnen persönlich an Ihre E-Mail-Adresse.
          </Text>
        </Section>

        <Section title="4. Rechtsgrundlagen">
          <Text>
            Wir bearbeiten Personendaten nach Treu und Glauben, zweckgebunden und verhältnismässig
            (Art. 6 DSG). Soweit die DSGVO anwendbar ist, stützen wir uns auf:
          </Text>
          <List>
            <li>
              <strong>Vertrag</strong> (Art. 6 Abs. 1 lit. b DSGVO): Bereitstellung der Plattform gemäss
              den Nutzungsbedingungen
            </li>
            <li>
              <strong>Einwilligung</strong> (Art. 6 Abs. 1 lit. a DSGVO): freiwillige Angaben wie Adresse
              und Telefonnummer; Sie können sie jederzeit entfernen
            </li>
            <li>
              <strong>Berechtigtes Interesse</strong> (Art. 6 Abs. 1 lit. f DSGVO): sicherer und
              funktionierender Betrieb (technische Daten)
            </li>
          </List>
        </Section>

        <Section title="5. Wer Ihre Daten sieht">
          <SubTitle>5.1 Andere Mitglieder</SubTitle>
          <List>
            <li>
              <strong>Alle Mitglieder</strong> einer Community oder Gruppe, der Sie angehören, sehen Ihren
              Vor- und Nachnamen und in der Mitgliederliste Ihre <strong>E-Mail-Adresse</strong> und Ihr
              Beitrittsdatum.
            </li>
            <li>
              <strong>Wer eines Ihrer Inserate sehen kann</strong> (die Mitglieder der Communitys und Gruppen,
              mit denen Sie es teilen), sieht Ihren Namen, Ihre E-Mail-Adresse und, falls angegeben, Ihre
              Adresse und Telefonnummer sowie die ursprünglichen Dateinamen der Bilder.
            </li>
            <li>
              <strong>Wer einen Einladungslink erhält</strong>, sieht auch ohne Anmeldung Name und
              Beschreibung der Community, den Vor- und Nachnamen der Person, die sie gegründet hat, und
              die Anzahl Mitglieder. Bei Gruppen werden keine Namen angezeigt.
            </li>
          </List>

          <SubTitle>5.2 Bilder</SubTitle>
          <Text>
            Bilder werden unter einer zufällig erzeugten, nicht erratbaren Adresse gespeichert. Wer diese
            Adresse kennt (z. B. weil sie weitergegeben wurde), kann das Bild ohne Anmeldung abrufen.
          </Text>

          <SubTitle>5.3 Kontakt über Signal, WhatsApp und E-Mail</SubTitle>
          <Text>
            Auf einem Inserat können Sie die inserierende Person per E-Mail, Signal oder WhatsApp
            kontaktieren. Erst wenn Sie darauf klicken, öffnet sich Ihr E-Mail-Programm bzw. Signal oder
            WhatsApp. Dabei werden die E-Mail-Adresse bzw. die Telefonnummer der inserierenden Person und
            bei E-Mail und WhatsApp auch der Titel des Inserats an die jeweilige Anwendung übergeben. Für
            die weitere Bearbeitung gelten die Bestimmungen von Signal bzw. WhatsApp (Meta).
          </Text>

          <SubTitle>5.4 Weitere Empfänger</SubTitle>
          <List>
            <li>Google bzw. Microsoft bei der Anmeldung (Abschnitt 6)</li>
            <li>Unsere Hosting-Anbieter, die Daten in unserem Auftrag bearbeiten (Abschnitt 7)</li>
            <li>Behörden oder Gerichte, wenn wir rechtlich dazu verpflichtet sind</li>
          </List>
          <Text className="mt-2">Darüber hinaus geben wir keine Daten weiter.</Text>
        </Section>

        <Section title="6. Anmeldung über Google und Microsoft">
          <Text>
            Die Anmeldung erfolgt ausschliesslich über Google oder Microsoft. Diese Anbieter erfahren
            dadurch, dass Sie sich bei LocalShare anmelden.
          </Text>
          <List>
            <li>
              <strong>Google</strong> (Berechtigungen «email» und «profile»): Google übermittelt uns u. a.
              Name, E-Mail-Adresse und Profilbild. Wir speichern nur Vor- und Nachname, E-Mail-Adresse und
              Ihre Google-Kennung, nicht das Profilbild.
            </li>
            <li>
              <strong>Microsoft</strong> (Berechtigungen «openid», «profile», «email», «User.Read»): Microsoft
              übermittelt uns Ihr Basisprofil, das neben Name und E-Mail auch Angaben wie Berufsbezeichnung,
              Telefonnummern oder Bürostandort enthalten kann, sofern diese in Ihrem Microsoft-Konto
              hinterlegt sind. Wir speichern nur Vor- und Nachname, E-Mail-Adresse und Ihre
              Microsoft-Kennung. Die übrigen Angaben verwerfen wir sofort.
            </li>
          </List>
          <Text className="mt-4">
            Melden Sie sich mit einem zweiten Anbieter an, der dieselbe E-Mail-Adresse liefert, verknüpfen
            wir diesen automatisch mit Ihrem bestehenden Konto. Wir erhalten keinen Zugriff auf Ihre E-Mails,
            Dateien oder anderen Dienste bei Google oder Microsoft. Es gelten zusätzlich die
            Datenschutzbestimmungen von{' '}
            <ExternalLink href="https://policies.google.com/privacy">Google</ExternalLink> und{' '}
            <ExternalLink href="https://privacy.microsoft.com/">Microsoft</ExternalLink>.
          </Text>
        </Section>

        <Section title="7. Hosting und Speicherort">
          <List>
            <li>
              <strong>Vercel Inc., USA</strong> – betreibt die Webseite und den Server der Plattform. Die
              Anwendung läuft in Frankfurt (Deutschland). Anfragen gelangen über das weltweite Netzwerk von
              Vercel zum nächstgelegenen Standort, in Europa z. B. nach Paris oder Frankfurt.
            </li>
            <li>
              <strong>Supabase Pte. Ltd., Singapur</strong> – betreibt die Datenbank und den Speicher für
              Bilder. Die Daten liegen in Frankfurt (Deutschland) auf Servern von Amazon Web Services.
            </li>
          </List>
          <Text className="mt-4">
            Beide Anbieter haben ihren Sitz ausserhalb der Schweiz und der EU und können aus diesen Ländern
            auf die Daten zugreifen.
          </Text>
          <List>
            <li>
              Vercel ist unter dem EU-U.S. und dem Swiss-U.S. Data Privacy Framework zertifiziert. Wir nutzen
              den kostenlosen Tarif «Hobby» von Vercel. Den Auftragsbearbeitungsvertrag (Data Processing
              Addendum) bietet Vercel nach eigenen Angaben nur für die kostenpflichtigen Tarife an. Für unseren
              Tarif besteht deshalb <strong>kein</strong> separater Auftragsbearbeitungsvertrag mit Vercel.
            </li>
            <li>
              Mit Supabase besteht ein Auftragsbearbeitungsvertrag als Teil der Nutzungsbedingungen. Allfällige
              Übermittlungen stützt Supabase auf die Standardvertragsklauseln der EU-Kommission.
            </li>
          </List>
          <Text className="mt-4">
            Wenn Sie uns per E-Mail schreiben, wird Ihre Nachricht bei unserem E-Mail-Anbieter Proton AG
            (Schweiz) gespeichert.
          </Text>
        </Section>

        <Section title="8. Datensicherheit">
          <List>
            <li>Alle Verbindungen sind verschlüsselt (HTTPS).</li>
            <li>Anmelde-Cookies sind für Skripte im Browser nicht lesbar (httpOnly).</li>
            <li>Die Kennwerte der Anmeldesitzungen speichern wir nur als Hash.</li>
            <li>Die Datenbank ist nur mit Zugangsdaten erreichbar, die ausschliesslich der Server der Plattform kennt. Die öffentliche Datenschnittstelle von Supabase ist abgeschaltet, und Zugriffsregeln (Row Level Security) sperren alle Tabellen für anonyme Zugriffe.</li>
            <li>Bilder werden ohne Metadaten gespeichert.</li>
          </List>
          <Text className="mt-4">
            Offen gesagt: Wir nutzen den kostenlosen Tarif von Supabase. Dieser erstellt{' '}
            <strong>keine automatischen Datensicherungen</strong>. Bei einem schweren technischen Ausfall
            könnten Daten verloren gehen. Bilder sind, wie in Abschnitt 5.2 beschrieben, über ihre Adresse
            ohne Anmeldung abrufbar.
          </Text>
        </Section>

        <Section title="9. Cookies und Speicher im Browser">
          <Text>Wir verwenden nur technisch notwendige Cookies, keine Tracking- oder Werbe-Cookies:</Text>
          <List>
            <li>
              <strong>accessToken</strong> – hält Sie angemeldet, gültig 15 Minuten
            </li>
            <li>
              <strong>refreshToken</strong> – verlängert Ihre Anmeldung, gültig 90 Tage
            </li>
            <li>
              <strong>pendingInvite</strong> – merkt sich einen Einladungslink während der Anmeldung, gültig
              15 Minuten
            </li>
            <li>
              <strong>NEXT_LOCALE</strong> – speichert Ihre Sprache (Deutsch/Französisch), gültig 1 Jahr
            </li>
          </List>
          <Text className="mt-4">
            Die Anmelde-Cookies gelten für alle Adressen unter localshare.ch und sind für Skripte nicht
            lesbar. Beim Abmelden leeren wir sie. Zusätzlich legt die Plattform im Sitzungsspeicher Ihres
            Browsers (sessionStorage) vorübergehend einen Einladungscode und den Namen der eingeladenen
            Community oder Gruppe ab, bis Sie das Browserfenster schliessen oder sich abmelden.
          </Text>
        </Section>

        <Section title="10. Aufbewahrung und Löschung">
          <List>
            <li>
              <strong>Konto und Inhalte:</strong> solange Ihr Konto besteht.
            </li>
            <li>
              <strong>Gelöschtes Inserat:</strong> Die Bilder werden sofort gelöscht. Titel, Beschreibung und
              Preis bleiben als «gelöscht» markiert in der Datenbank, sind aber für niemanden mehr sichtbar.
            </li>
            <li>
              <strong>Anmeldesitzungen:</strong> bis zur Löschung Ihres Kontos (siehe Abschnitt 2.4).
            </li>
            <li>
              <strong>Technische Protokolle:</strong> Wir können die Protokolle von Vercel 1 Stunde und die von
              Supabase 1 Tag lang einsehen. Wie lange die Anbieter eigene Daten aufbewahren, richtet sich nach
              deren Datenschutzbestimmungen.
            </li>
          </List>

          <SubTitle>Was beim Löschen Ihres Kontos passiert</SubTitle>
          <Text>
            Sie können Ihr Konto im Profil selbst löschen. Dabei werden sofort gelöscht: Ihre
            Anmeldesitzungen, die Verknüpfung mit Google bzw. Microsoft und Ihre Mitgliedschaften in
            Communitys und Gruppen. Ihre Inserate werden ausgeblendet.
          </Text>
          <Text className="mt-2">
            <strong>Derzeit bleiben jedoch gespeichert:</strong> Ihr Name, Ihre E-Mail-Adresse, Adresse und
            Telefonnummer (als «gelöscht» markiert), der Text Ihrer Inserate, deren Bilder (weiterhin über die
            Bildadresse abrufbar) und Ihre Merkliste. Communitys und Gruppen, die Sie gegründet haben, bleiben
            bestehen, und Ihr Name wird dort weiterhin als Gründer angezeigt. Wir arbeiten daran, dass die
            Löschung künftig alle Daten vollständig entfernt.
          </Text>
          <Text className="mt-2">
            Weil Ihre E-Mail-Adresse gespeichert bleibt, können Sie sich mit derselben Adresse derzeit nicht
            neu registrieren. Bis zur Behebung gilt: Schreiben Sie uns an info@localshare.ch, dann löschen wir
            alle Ihre Daten vollständig, einschliesslich der Bilder, und bestätigen Ihnen die Löschung.
          </Text>
        </Section>

        <Section title="11. Ihre Rechte">
          <List>
            <li>
              <strong>Auskunft und Datenherausgabe:</strong> Mit «Daten exportieren» im Profil erhalten Sie Ihr
              Konto, Ihre Anmeldeverknüpfungen, Ihre Communitys, Gruppen und Mitgliedschaften sowie Ihre aktiven
              Inserate mit Bildangaben als Datei (JSON). Nicht enthalten sind derzeit Ihre Merkliste, Ihre
              Anmeldesitzungen, gelöschte Inserate und die Bilddateien selbst. Eine vollständige Auskunft
              erhalten Sie auf Anfrage per E-Mail.
            </li>
            <li>
              <strong>Berichtigung:</strong> Name, Adresse, Telefonnummer und Sprache ändern Sie im Profil.
              Für eine Änderung Ihrer E-Mail-Adresse schreiben Sie uns.
            </li>
            <li>
              <strong>Löschung:</strong> siehe Abschnitt 10.
            </li>
            <li>
              <strong>Widerspruch und Widerruf:</strong> Sie können einer Bearbeitung widersprechen und freiwillige
              Angaben jederzeit entfernen.
            </li>
            <li>
              <strong>Beschwerde:</strong> beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten
              (EDÖB) oder, wenn Sie in der EU wohnen, bei der Datenschutzbehörde Ihres Landes.
            </li>
          </List>
          <Text className="mt-4">Für alle Anfragen erreichen Sie uns unter info@localshare.ch.</Text>
        </Section>

        <Section title="12. Mindestalter">
          <Text>
            Die Plattform richtet sich an Personen ab 18 Jahren. Wir prüfen das Alter technisch nicht. Wenn
            Sie annehmen, dass wir Daten einer minderjährigen Person bearbeiten, melden Sie sich bitte bei uns.
          </Text>
        </Section>

        <Section title="13. Änderungen">
          <Text>
            Wir passen diese Erklärung an, wenn sich die Plattform oder die Rechtslage ändert. Die aktuelle
            Version finden Sie immer unter /privacy. Über wesentliche Änderungen informieren wir Sie per E-Mail.
          </Text>
        </Section>

        <Section title="14. Kontakt">
          <Text>Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte:</Text>
          <Text className="mt-2">
            <strong>E-Mail:</strong> info@localshare.ch
          </Text>
        </Section>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <p>Stand: 30. September 2026</p>
        </div>
      </div>
    </div>
  );
}
