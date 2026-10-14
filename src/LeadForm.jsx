import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { calculateBathroomPrice } from "./pricing.js";
import { configurationLabel } from "./bathroom-options.js";
import { submitDemoInquiry } from "./demo-inquiries.js";
import BathroomPreview from "./BathroomPreview.jsx";
import PhotoUpload from "./PhotoUpload.jsx";
import { formatPrice } from "./PriceCalculator.jsx";
import "./lead-form.css";
export const EMPTY_INQUIRY = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  startDate: "",
  consent: false,
  website: "",
  photos: [],
};
export default function LeadForm({
  configuration,
  onBack,
  data,
  onChange,
  sent,
  onSent,
  onHome,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (key, value) => {
    setError("");
    onChange({ ...data, [key]: value });
  };
  const quote = calculateBathroomPrice(configuration);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = submitDemoInquiry(data, configuration);
      onSent(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <section className="inquiry-success">
        <span className="success-mark">
          <Check size={43} />
        </span>
        <span className="eyebrow">DEMO-ANFRAGE GESPEICHERT</span>
        <h1>Ihre Idee nimmt Form an.</h1>
        <p>
          Die Konfiguration und Ihre Beispieldaten sind auf diesem Gerät
          gespeichert.
        </p>
        <div className="success-explanation">
          <ShieldCheck size={21} />
          <span>
            <b>Keine echte Übermittlung.</b> Es wurde keine E-Mail versendet und
            keine Anfrage an Norde übermittelt.
          </span>
        </div>
        <div className="success-reference">
          <FileText size={19} />
          <span>Ihre Demo-Referenz</span>
          <b>{sent.id}</b>
        </div>
        <div className="configuration-summary">
          {configurationLabel(configuration).map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
        <button className="button full" onClick={onHome}>
          Zur Übersicht
          <ArrowRight size={18} />
        </button>
        <button className="quiet-button" onClick={onBack}>
          Konfiguration weiter bearbeiten
        </button>
      </section>
    );
  return (
    <section className="lead-form">
      <button className="text-button lead-back" onClick={onBack}>
        <ArrowLeft size={18} />
        Zurück zur Konfiguration
      </button>
      <div className="page-heading">
        <span className="eyebrow">DER NÄCHSTE SCHRITT</span>
        <h1>Erzählen Sie uns von Ihrem Bad.</h1>
        <p>
          Ihre Auswahl ist schon dabei. Für die Beratung fehlt nur noch ein
          wenig Kontext.
        </p>
      </div>
      <div className="inquiry-layout">
        <form className="inquiry-fields" onSubmit={submit}>
          <div className="demo-callout" role="note">
            <ShieldCheck size={20} />
            <p>
              <b>Sie testen den Ablauf.</b> Diese Anfrage bleibt auf Ihrem
              Gerät. Bitte nur Beispieldaten eingeben.
            </p>
          </div>
          <h2>Wie erreichen wir Sie?</h2>
          <div className="inquiry-field-grid">
            <label>
              Name <span>Pflichtfeld</span>
              <input
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={data.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </label>
            <label>
              Telefon <span>Pflichtfeld</span>
              <input
                required
                type="tel"
                maxLength={35}
                autoComplete="tel"
                value={data.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+49 …"
              />
            </label>
          </div>
          <label>
            E-Mail <span>Optional</span>
            <input
              type="email"
              maxLength={254}
              autoComplete="email"
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@beispiel.de"
            />
          </label>
          <h2>Wo entsteht Ihr neues Bad?</h2>
          <label>
            Projektadresse <span>Pflichtfeld</span>
            <input
              required
              minLength={3}
              maxLength={300}
              autoComplete="street-address"
              placeholder="Straße, Hausnummer, PLZ und Ort"
              value={data.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </label>
          <label>
            Gewünschter Beginn <span>Optional</span>
            <input
              type="date"
              min={new Date().toLocaleDateString("sv-SE")}
              value={data.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </label>
          <h2>
            Ein Blick in Ihr aktuelles Bad <small>Optional</small>
          </h2>
          <PhotoUpload
            max={3}
            limit={1500000}
            photos={data.photos}
            onChange={(p) => set("photos", p)}
            onError={setError}
          />
          <label>
            Was sollten wir noch wissen? <span>Optional</span>
            <textarea
              maxLength={1500}
              rows={3}
              value={data.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Besondere Wünsche, Zugang oder zeitliche Vorstellungen …"
            />
          </label>
          <label className="lead-consent">
            <input
              required
              type="checkbox"
              checked={data.consent}
              onChange={(e) => set("consent", e.target.checked)}
            />
            <span>
              Ich habe verstanden, dass dies eine lokale Demonstration ist und
              meine Angaben zur Simulation auf diesem Gerät gespeichert werden.
              Keine echte Anfrage oder Beauftragung.
            </span>
          </label>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="button full" disabled={busy} type="submit">
            {busy ? "Wird gespeichert …" : "Demo-Anfrage speichern"}
            <ArrowRight size={18} />
          </button>
          <p className="inquiry-footnote">
            Ohne Registrierung. Kein E-Mail-Versand. Kein verbindlicher Auftrag.
          </p>
        </form>
        <aside className="inquiry-summary">
          <BathroomPreview configuration={configuration} />
          <h2>Ihre Auswahl</h2>
          <div className="configuration-summary">
            {configurationLabel(configuration).map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
          <span className="eyebrow">UNVERBINDLICHER RICHTWERT</span>
          <strong>
            {quote.total === null
              ? "Individuelles Angebot"
              : formatPrice(quote.total) + " brutto"}
          </strong>
          <p>
            Basispreis bestätigt. Zuschläge sind Demo-Beispiele. Details und
            Machbarkeit brauchen eine persönliche Prüfung.
          </p>
          <button className="text-button" onClick={onBack}>
            Auswahl ändern
            <ArrowLeft size={17} />
          </button>
        </aside>
      </div>
    </section>
  );
}
