export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Nutzungsbedingungen</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <p className="text-muted-foreground font-medium">
          <strong>Wichtig:</strong> Dies ist ein rechtlich verbindlicher Vertrag.
          Durch die Nutzung der LocalShare-Plattform stimmen Sie diesen Nutzungsbedingungen zu.
          Bei Nichteinverständnis müssen Sie die Nutzung sofort einstellen.
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Geltungsbereich und Definitionen</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Geltungsbereich</h3>
          <p className="text-muted-foreground">
            Diese Nutzungsbedingungen gelten für die Nutzung der LocalShare-Plattform
            ("die Plattform"), einer Progressive Web App für nachbarschaftliches Teilen
            innerhalb von Gemeinschaften. Die Plattform wird betrieben vom LocalShare Verein,
            einem nicht gewinnorientierten Verein nach Art. 60 ff. ZGB mit Sitz in der Schweiz.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Definitionen</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Plattform:</strong> Die LocalShare Web-Applikation und alle zugehörigen Dienste</li>
            <li><strong>Betreiber:</strong> LocalShare Verein und dessen Vorstandsmitglieder</li>
            <li><strong>Nutzer:</strong> Jede Person, die die Plattform nutzt</li>
            <li><strong>Gemeinschaft:</strong> Eine Nutzergruppe (z.B. Nachbarschaft, Quartier)</li>
            <li><strong>Gruppe:</strong> Untergruppe innerhalb einer Gemeinschaft</li>
            <li><strong>Anzeige:</strong> Von Nutzern erstellte Inserate (Verkauf, Verleih, Vermietung, Suche)</li>
            <li><strong>Nutzerinhalt:</strong> Alle von Nutzern erstellten Inhalte (Anzeigen, Bilder, Texte)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">1.3 Plattform-Natur</h3>
          <p className="text-muted-foreground">
            <strong>Kritischer Hinweis:</strong> LocalShare ist eine reine Vermittlungsplattform,
            die Nutzer verbindet. Der Betreiber überprüft, verifiziert, kontrolliert oder
            garantiert <strong>keine</strong> Nutzer, Anzeigen, Gegenstände, Dienstleistungen
            oder Informationen auf der Plattform. Alle Aktivitäten, Interaktionen und
            Transaktionen erfolgen <strong>auf eigenes Risiko</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Nutzungsvoraussetzungen</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Mindestalter</h3>
          <p className="text-muted-foreground">
            Sie müssen mindestens 18 Jahre alt sein oder über die Zustimmung eines
            Erziehungsberechtigten verfügen, um die Plattform zu nutzen.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Rechtliche Verantwortung</h3>
          <p className="text-muted-foreground">
            Sie sind allein verantwortlich für die Einhaltung aller anwendbaren lokalen,
            kantonalen und nationalen Gesetze, einschliesslich aber nicht beschränkt auf
            Steuervorschriften, Gewährleistungsrecht und Verbraucherschutzgesetze.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Account-Sicherheit</h3>
          <p className="text-muted-foreground">
            Sie sind verantwortlich für die Sicherheit Ihres Accounts (Google/Microsoft Login)
            und alle Aktivitäten, die unter Ihrem Account erfolgen. Bei unbefugtem Zugriff
            informieren Sie uns bitte umgehend unter security@localshare.ch.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Zulässige Nutzung</h2>
          <p className="text-muted-foreground">Die Plattform darf genutzt werden für:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Verkauf (SELL):</strong> Verkauf von legalen, gebrauchten oder neuen Gütern</li>
            <li><strong>Vermietung (RENT):</strong> Zeitweise Vermietung von Gegenständen gegen Entgelt</li>
            <li><strong>Verleih (LEND):</strong> Kostenloses oder vergünstigtes Ausleihen von Gegenständen</li>
            <li><strong>Suche (SEARCH):</strong> Gesuche nach bestimmten Gütern oder Dienstleistungen</li>
            <li>Teilnahme an nachbarschaftlichen Gemeinschaften und Gruppen</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Verbotene Nutzung</h2>
          <p className="text-muted-foreground">Folgendes ist ausdrücklich verboten:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Veröffentlichung illegaler Inhalte (Drogen, Waffen, gestohlene Güter, Fälschungen)</li>
            <li>Spam, kommerzielle Massenwerbung oder automatisierte Zugriffe (Bots, Scraping)</li>
            <li>Hassrede, Beleidigungen, Diskriminierung oder Belästigung</li>
            <li>Betrug, irreführende Anzeigen oder Falschdarstellungen</li>
            <li>Pornografische oder jugendgefährdende Inhalte</li>
            <li>Verletzung von Urheberrechten, Markenrechten oder Persönlichkeitsrechten</li>
            <li>Weitergabe vertraulicher Informationen Dritter ohne Zustimmung</li>
            <li>Hochladen von Schadsoftware oder schädlichem Code</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Transaktionen zwischen Nutzern</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Keine Vertragspartei</h3>
          <p className="text-muted-foreground">
            <strong>Der Betreiber ist NICHT Partei von Transaktionen.</strong> LocalShare
            verkauft, kauft, inspiziert, verifiziert oder garantiert keine Gegenstände
            oder Dienstleistungen. Der Betreiber übernimmt <strong>keinerlei Gewährleistung</strong>
            bezüglich Eigentum, Qualität, Sicherheit, Rechtmässigkeit, Echtheit, Zustand oder
            Eignung von angebotenen Gegenständen oder Dienstleistungen.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Eigenverantwortung</h3>
          <p className="text-muted-foreground">
            Sie sind <strong>allein verantwortlich</strong> für:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Überprüfung anderer Nutzer vor Transaktionen</li>
            <li>Inspektion von Gegenständen vor Kauf, Miete oder Ausleihe</li>
            <li>Festlegung klarer Bedingungen, Erwartungen und Fristen</li>
            <li>Dokumentation des Zustands von Gegenständen (Fotos, Videos)</li>
            <li>Ergreifung aller notwendigen Sicherheitsmassnahmen</li>
            <li>Direkte Streitbeilegung mit anderen Nutzern</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Risiken bei Verleih und Vermietung</h3>
          <p className="text-muted-foreground">
            Bei Verleih- und Mietaktivitäten tragen Sie das volle Risiko für:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Beschädigung oder Verlust von Gegenständen</li>
            <li>Verspätete oder ausbleibende Rückgabe</li>
            <li>Nichterfüllung von Vereinbarungen</li>
            <li>Streitigkeiten über den Zustand bei Rückgabe</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Wir empfehlen dringend, bei wertvollen Gegenständen schriftliche
            Vereinbarungen zu treffen und den Zustand vor/nach zu dokumentieren.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Sicherheit bei persönlichen Treffen</h2>
          <p className="text-muted-foreground">
            <strong>Warnung:</strong> Persönliche Treffen mit anderen Nutzern erfolgen
            auf Ihr eigenes Risiko. Der Betreiber führt keine Identitätsprüfungen oder
            Hintergrundüberprüfungen durch. Wir empfehlen:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Treffen Sie sich an öffentlichen, belebten Orten</li>
            <li>Informieren Sie Freunde oder Familie über Ihr Treffen</li>
            <li>Nehmen Sie keine grossen Bargeldbeträge mit</li>
            <li>Vertrauen Sie Ihrem Instinkt – brechen Sie bei Unbehagen ab</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Rechte an Nutzerinhalten</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Eigentum</h3>
          <p className="text-muted-foreground">
            Sie behalten alle Eigentumsrechte an Ihren Anzeigen, Bildern und Texten.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Lizenzgewährung</h3>
          <p className="text-muted-foreground">
            Durch Veröffentlichung gewähren Sie dem Betreiber eine nicht-exklusive,
            weltweite, gebührenfreie, unterlizenzierbare Lizenz zur Nutzung, Vervielfältigung,
            Änderung, Verbreitung und Anzeige Ihrer Inhalte zum Zweck der Plattform-Funktionalität.
            Diese Lizenz erlischt bei Löschung Ihrer Inhalte.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Inhaltsanforderungen</h3>
          <p className="text-muted-foreground">
            Ihre Inhalte müssen wahrheitsgemäss und genau sein. Sie müssen die Rechte an
            allen veröffentlichten Inhalten besitzen oder zur Nutzung berechtigt sein.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Haftungsausschluss und Risikoübernahme</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">8.1 "Wie besehen" Bereitstellung</h3>
          <p className="text-muted-foreground">
            Die Plattform wird "wie besehen" und "wie verfügbar" ohne jegliche ausdrückliche
            oder stillschweigende Gewährleistung bereitgestellt. Der Betreiber garantiert nicht,
            dass die Plattform (a) unterbrechungsfrei, fehlerfrei oder sicher ist, (b) frei von
            technischen Mängeln, Viren oder schädlichen Komponenten ist, oder (c) genaue oder
            zuverlässige Ergebnisse liefert.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Haftungsbeschränkung</h3>
          <p className="text-muted-foreground">
            Im maximal zulässigen gesetzlichen Rahmen haftet der Betreiber <strong>nicht</strong> für:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Indirekte, zufällige, besondere, exemplarische oder Folgeschäden</li>
            <li>Entgangenen Gewinn, Datenverlust oder Nutzungsausfall</li>
            <li>Persönliche Verletzungen oder Sachschäden</li>
            <li>Emotionale Belastung oder immaterielle Verluste</li>
            <li>Handlungen anderer Nutzer (Betrug, Missbrauch, Belästigung)</li>
            <li>Fehler, Ungenauigkeiten oder falsche Informationen auf der Plattform</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Ausschluss für Vorstandsmitglieder</h3>
          <p className="text-muted-foreground">
            Kein Vorstandsmitglied, Vereinsmitglied oder Freiwilliger des LocalShare Vereins
            haftet persönlich für Ansprüche, Schäden, Verluste, Kosten oder Ausgaben, die aus
            der Nutzung der Plattform entstehen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Freistellung (Indemnifikation)</h2>
          <p className="text-muted-foreground">
            Sie erklären sich bereit, den Betreiber, seine Vorstandsmitglieder, Mitglieder,
            Freiwilligen und Vertreter von allen Ansprüchen, Forderungen, Schäden, Verlusten,
            Kosten und Ausgaben (einschliesslich Anwaltskosten) freizustellen und schadlos
            zu halten, die entstehen aus:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Ihrer Nutzung oder Ihrem Missbrauch der Plattform</li>
            <li>Ihren Transaktionen, Treffen oder Interaktionen mit anderen Nutzern</li>
            <li>Ihren Nutzerinhalten</li>
            <li>Ihrer Verletzung dieser Nutzungsbedingungen</li>
            <li>Ihrer Verletzung von Gesetzen oder Rechten Dritter</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Moderation und Account-Sperrung</h2>
          <p className="text-muted-foreground">
            Der Betreiber behält sich das Recht vor:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Anzeigen ohne Vorwarnung zu löschen, die gegen diese Bedingungen verstossen</li>
            <li>Accounts bei Missbrauch temporär oder permanent zu sperren</li>
            <li>Gemeinschaften/Gruppen mit illegalen Inhalten zu entfernen</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Der Betreiber hat jedoch <strong>keine Verpflichtung</strong>, Inhalte zu überwachen,
            Verstösse zu untersuchen oder Massnahmen zu ergreifen. Allfällige Moderationsmassnahmen
            erfolgen nach eigenem Ermessen und begründen keine Verpflichtung zur Fortsetzung.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Verfügbarkeit und Datenerhaltung</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Plattform-Verfügbarkeit</h3>
          <p className="text-muted-foreground">
            Der Betreiber kann die Plattform jederzeit modifizieren, unterbrechen, aussetzen
            oder einstellen, mit oder ohne Vorankündigung. Bei geplanter Einstellung erfolgt
            eine Benachrichtigung mindestens 30 Tage im Voraus.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Keine Datenerhaltungsgarantie</h3>
          <p className="text-muted-foreground">
            Der Betreiber hat keine Verpflichtung, Ihre Daten, Nutzerinhalte oder Account-
            Informationen aufzubewahren, zu sichern oder zu schützen. Sie sind selbst
            verantwortlich für die Sicherung wichtiger Daten.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Änderungen dieser Nutzungsbedingungen</h2>
          <p className="text-muted-foreground">
            Der Betreiber kann diese Nutzungsbedingungen jederzeit ändern. Änderungen werden
            auf dieser Seite veröffentlicht. Bei wesentlichen Änderungen werden Sie per
            E-Mail informiert. Durch weitere Nutzung nach Änderungen akzeptieren Sie die
            neuen Bedingungen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Anwendbares Recht und Gerichtsstand</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">13.1 Anwendbares Recht</h3>
          <p className="text-muted-foreground">
            Es gilt Schweizer Recht unter Ausschluss des UN-Kaufrechts (CISG) und der
            Kollisionsnormen des internationalen Privatrechts.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">13.2 Gerichtsstand</h3>
          <p className="text-muted-foreground">
            Ausschliesslicher Gerichtsstand ist der Sitz des LocalShare Vereins in der Schweiz,
            soweit gesetzlich zulässig. Für Konsumenten gilt der gesetzliche Gerichtsstand.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Salvatorische Klausel</h2>
          <p className="text-muted-foreground">
            Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam, ungültig oder
            undurchsetzbar sein, bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt.
            Die unwirksame Bestimmung wird durch eine wirksame ersetzt, die dem wirtschaftlichen
            Zweck am nächsten kommt.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">15. Vollständige Vereinbarung</h2>
          <p className="text-muted-foreground">
            Diese Nutzungsbedingungen stellen die gesamte Vereinbarung zwischen Ihnen und dem
            Betreiber bezüglich der Plattform dar und ersetzen alle vorherigen Vereinbarungen,
            Mitteilungen und Absprachen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">16. Kontakt</h2>
          <p className="text-muted-foreground">
            Bei Fragen zu diesen Nutzungsbedingungen kontaktieren Sie uns unter:
          </p>
          <p className="text-muted-foreground mt-2">
            <strong>E-Mail:</strong> legal@localshare.ch<br />
            <strong>Allgemein:</strong> contact@localshare.ch
          </p>
        </section>

        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          <p>Stand: Januar 2026</p>
          <p className="mt-2">
            Diese Nutzungsbedingungen wurden für die LocalShare-Plattform erstellt und
            entsprechen Schweizer Recht (OR, ZGB).
          </p>
        </div>
      </div>
    </div>
  );
}
