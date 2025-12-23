export default function ImprintPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Impressum</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Betreiber der Plattform</h2>
          <p className="text-muted-foreground">
            <strong>LocalShare</strong><br />
            Neighbourhood Sharing Platform<br />
            <br />
            [Ihr Name / Firmenname]<br />
            [Strasse Nr.]<br />
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
          <h2 className="text-2xl font-semibold mt-8 mb-4">Handelsregister</h2>
          <p className="text-muted-foreground">
            [Nur bei gewerblicher Nutzung]<br />
            <strong>UID:</strong> CHE-XXX.XXX.XXX<br />
            <strong>Handelsregisternummer:</strong> CHE-XXX.XXX.XXX<br />
            <strong>Registergericht:</strong> [Ort]
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Verantwortlich für den Inhalt</h2>
          <p className="text-muted-foreground">
            Gemäss Art. 8 Abs. 1 lit. a UWG:<br />
            <br />
            [Ihr Name]<br />
            [Adresse]<br />
            [E-Mail]
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Haftungsausschluss</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">Inhalt des Onlineangebotes</h3>
          <p className="text-muted-foreground">
            Der Autor übernimmt keinerlei Gewähr für die Aktualität, Korrektheit,
            Vollständigkeit oder Qualität der bereitgestellten Informationen.
            Haftungsansprüche gegen den Autor, welche sich auf Schäden materieller
            oder ideeller Art beziehen, die durch die Nutzung oder Nichtnutzung der
            dargebotenen Informationen bzw. durch die Nutzung fehlerhafter und
            unvollständiger Informationen verursacht wurden, sind grundsätzlich
            ausgeschlossen.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Verweise und Links</h3>
          <p className="text-muted-foreground">
            Bei direkten oder indirekten Verweisen auf fremde Webseiten ("Hyperlinks"),
            die ausserhalb des Verantwortungsbereiches des Autors liegen, würde eine
            Haftungsverpflichtung ausschliesslich in dem Fall in Kraft treten, in dem
            der Autor von den Inhalten Kenntnis hat und es ihm technisch möglich und
            zumutbar wäre, die Nutzung im Falle rechtswidriger Inhalte zu verhindern.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Urheber- und Kennzeichenrecht</h3>
          <p className="text-muted-foreground">
            Der Autor ist bestrebt, in allen Publikationen die Urheberrechte der
            verwendeten Bilder, Grafiken, Tondokumente, Videosequenzen und Texte zu
            beachten, von ihm selbst erstellte Bilder, Grafiken, Tondokumente,
            Videosequenzen und Texte zu nutzen oder auf lizenzfreie Grafiken,
            Tondokumente, Videosequenzen und Texte zurückzugreifen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Open Source</h2>
          <p className="text-muted-foreground">
            Diese Plattform ist Open Source Software, lizenziert unter AGPL-3.0.
          </p>
          <p className="text-muted-foreground mt-4">
            <strong>Quellcode:</strong>{' '}
            <a
              href="https://github.com/yourusername/localshare"
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
          <p>Stand: Dezember 2025</p>
        </div>
      </div>
    </div>
  );
}
