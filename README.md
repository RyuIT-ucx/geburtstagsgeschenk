# Mamis Geburtstagsgeschenk

Eine interaktive Geburtstagseinladung für Martina: Wunschtage auswählen, eine Geheimakte lösen und die verfügbaren Tage abschicken. Der tatsächliche Ausflug bleibt auf der Seite geheim.

## Vorschau und Veröffentlichung

Die Seite ist eine statische Website mit `index.html`, `styles.css`, `app.js` und `config.js`. Lokal starten mit:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Veröffentlicht über GitHub Pages unter `https://ryuit-ucx.github.io/geburtstagsgeschenk/`.

## Wunschtage per E-Mail

Der Abschicken-Button sendet die ausgewählten Tage und die freiwillige Vermutung über FormSubmit an denselben Empfänger wie die E-Date-Seite. Der Alias steht in `config.js`. Für die neue Seitenadresse kann FormSubmit eine Aktivierung per E-Mail verlangen. Erst nach einer erfolgreichen Antwort zeigt die Seite die Bestätigung. Falls das Senden fehlschlägt, können die Daten alternativ als Nachricht geteilt werden.
