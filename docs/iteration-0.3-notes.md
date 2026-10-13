

## Iteration 0.3 — Konfigurator und Anfragen (Entwicklungszweig)

- Preisbasis: **12.949 EUR brutto** für Komplettsanierung inklusive Material und Sanitärausstattung bei bis zu 6 m². Details und technische Voraussetzungen sind vor der Veröffentlichung zu bestätigen.
- Alle zusätzlichen Positionspreise sind **Testwerte**, noch nicht von Norde genehmigt. Für >6 m² keine automatische Gesamtsumme.
- Der öffentliche Preisrechner führt zu einem eigenständigen Kontaktformular ohne Registrierung.
- \`POST /api/leads\` überprüft Kontaktangaben und Optionen, berechnet den Bruttopreis serverseitig neu, begrenzt Anfragen per IP und speichert sie in SQLite. Idempotency-Key reduziert versehentliche Duplikate.
- \`GET /api/leads\` und \`PATCH /api/leads/:id\` sind nur für eingeloggte Administrationskonten erlaubt. Team-Zugang über Einstellungen → Neue Anfragen.
- **Wichtig:** Es gibt aktuell KEINEN E-Mail-Versand. \`info@norde-dev.de\` ist die geplante Benachrichtigungsadresse, keine aktiv konfigurierte Integration. Gespeicherte Leads werden nicht automatisch als E-Mail zugestellt.
- **GitHub Pages:** Die autonome Offline-Demo simuliert API-Aufrufe. Das neue Formular erkennt den Offline-Modus und lehnt echte Einreichungen transparent ab. Für Live-Leads muss die Anwendung auf einem HTTPS-Server mit persistentem Datenverzeichnis und einem Benachrichtigungsanbieter bereitgestellt werden.
- **Datenschutz/Produktionssperre:** Bis zur rechtlichen Prüfung, Sicherung der Datenbank, Spamschutz (z. B. CAPTCHA), Löschroutine, Benachrichtigungsintegration und produktiven Ende-zu-Ende-Tests nur mit Beispieldaten testen.

Prüfen: \`npm test\` und \`npm run build\` mit Node 24+.
