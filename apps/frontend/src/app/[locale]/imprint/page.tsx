export default function ImprintPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Impressum</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Betreiber der Plattform</h2>
          <p className="text-muted-foreground">
            <strong>LocalShare Verein</strong><br />
            Nachbarschafts-Sharing-Plattform<br />
            <br />
            [Vereinsadresse]<br />
            [PLZ Ort]<br />
            Schweiz
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Kontakt</h2>
          <p className="text-muted-foreground">
            <strong>E-Mail:</strong> contact@localshare.ch<br />
            <strong>Website:</strong> https://localshare.ch
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Vereinsregister</h2>
          <p className="text-muted-foreground">
            Der LocalShare Verein ist ein nicht gewinnorientierter Verein gemäss Art. 60 ff. ZGB.<br />
            <br />
            <strong>Gründungsjahr:</strong> [Jahr]<br />
            <strong>Sitz:</strong> [Ort], Schweiz
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Verantwortlich für den Inhalt</h2>
          <p className="text-muted-foreground">
            Gemäss Art. 8 Abs. 1 lit. a UWG und Art. 28 DSG:<br />
            <br />
            Vorstand des LocalShare Vereins<br />
            [Kontaktadresse]<br />
            contact@localshare.ch
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Haftungsausschluss</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">Plattform-Natur und Vermittlerrolle</h3>
          <p className="text-muted-foreground">
            LocalShare ist eine nicht-kommerzielle Vermittlungsplattform, die Nutzer in
            Nachbarschaften verbindet. Der Verein ist <strong>nicht</strong> Partei von
            Transaktionen zwischen Nutzern. Wir überprüfen, verifizieren oder garantieren
            keine Nutzer, Inserate, Gegenstände oder Dienstleistungen auf der Plattform.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Inhalt des Onlineangebotes</h3>
          <p className="text-muted-foreground">
            Der Betreiber übernimmt keinerlei Gewähr für die Aktualität, Korrektheit,
            Vollständigkeit oder Qualität der bereitgestellten Informationen und
            nutzergenierten Inhalte. Haftungsansprüche gegen den Betreiber, welche sich
            auf Schäden materieller oder ideeller Art beziehen, die durch die Nutzung
            oder Nichtnutzung der dargebotenen Informationen bzw. durch die Nutzung
            fehlerhafter und unvollständiger Informationen verursacht wurden, sind
            grundsätzlich ausgeschlossen, sofern kein nachweislich vorsätzliches oder
            grob fahrlässiges Verschulden vorliegt.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Transaktionen zwischen Nutzern</h3>
          <p className="text-muted-foreground">
            Alle Transaktionen (Verkauf, Verleih, Vermietung, Tausch) erfolgen direkt
            zwischen Nutzern. LocalShare ist nicht verantwortlich für:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
            <li>Qualität, Zustand oder Rechtmässigkeit angebotener Gegenstände</li>
            <li>Nichterfüllung oder mangelhafte Erfüllung von Vereinbarungen</li>
            <li>Schäden an oder Verlust von verliehenen/gemieteten Gegenständen</li>
            <li>Streitigkeiten zwischen Nutzern</li>
            <li>Finanzielle Verluste aus Transaktionen</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Verweise und Links</h3>
          <p className="text-muted-foreground">
            Bei direkten oder indirekten Verweisen auf fremde Webseiten ("Hyperlinks"),
            die ausserhalb des Verantwortungsbereiches des Betreibers liegen, würde eine
            Haftungsverpflichtung ausschliesslich in dem Fall in Kraft treten, in dem
            der Betreiber von den Inhalten Kenntnis hat und es ihm technisch möglich und
            zumutbar wäre, die Nutzung im Falle rechtswidriger Inhalte zu verhindern.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Urheber- und Kennzeichenrecht</h3>
          <p className="text-muted-foreground">
            Der Betreiber ist bestrebt, in allen Publikationen die Urheberrechte der
            verwendeten Bilder, Grafiken und Texte zu beachten, von ihm selbst erstellte
            Inhalte zu nutzen oder auf lizenzfreie Medien zurückzugreifen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Risikohinweis für Nutzer</h2>
          <p className="text-muted-foreground">
            Durch die Nutzung der Plattform anerkennen Sie:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
            <li>Alle Interaktionen und Transaktionen erfolgen auf eigenes Risiko</li>
            <li>Sie sind selbst verantwortlich für die Überprüfung anderer Nutzer</li>
            <li>Bei persönlichen Treffen empfehlen wir öffentliche Orte</li>
            <li>Sie sind für die Einhaltung aller anwendbaren Gesetze verantwortlich</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Open Source</h2>
          <p className="text-muted-foreground">
            Diese Plattform ist Open Source Software, lizenziert unter AGPL-3.0.
          </p>
          <p className="text-muted-foreground mt-4">
            <strong>Quellcode:</strong>{' '}
            <a
              href="https://github.com/localshare-ch/localshare"
              className="underline"
              target="_blank"
              rel="noopener"
            >
              GitHub Repository
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Verwendete Technologien</h2>
          <p className="text-muted-foreground">
            Diese Plattform wurde erstellt mit:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Next.js 14 (React Framework)</li>
            <li>NestJS (Backend Framework)</li>
            <li>Prisma ORM + PostgreSQL</li>
            <li>shadcn/ui (UI Components)</li>
            <li>Tailwind CSS</li>
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <p>Stand: Januar 2026</p>
        </div>
      </div>
    </div>
  );
}
