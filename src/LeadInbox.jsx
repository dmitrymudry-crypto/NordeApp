import React, { useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { LEAD_STATUSES } from "./lead-schema.js";
import { listDemoInquiries, updateDemoInquiry } from "./demo-inquiries.js";
import { configurationLabel } from "./bathroom-options.js";
import { formatPrice } from "./PriceCalculator.jsx";
export default function LeadInbox() {
  const [leads, setLeads] = useState(listDemoInquiries),
    [error, setError] = useState("");
  function update(id, status) {
    try {
      updateDemoInquiry(id, status);
      setLeads(listDemoInquiries());
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className="lead-inbox">
      <div className="page-heading">
        <span className="eyebrow">LOKALE DEMONSTRATION</span>
        <h1>Anfragen im Blick.</h1>
        <p>
          Diese Beispieldaten befinden sich nur auf diesem Gerät. Es wurde
          nichts an Norde übermittelt.
        </p>
      </div>
      <button
        className="button outline"
        onClick={() => setLeads(listDemoInquiries())}
      >
        <RefreshCw size={16} />
        Aktualisieren
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="inbox-grid">
        {leads.map((lead) => (
          <article className="card" key={lead.id}>
            <span className="badge green">{lead.id}</span>
            <h2>{lead.name}</h2>
            <p>{lead.address}</p>
            <p>
              Telefon: {lead.phone}
              {lead.email && (
                <>
                  <br />
                  E-Mail: {lead.email}
                </>
              )}
            </p>
            <div className="configuration-summary">
              {configurationLabel(lead.configuration).map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
            <p>
              <b>
                {lead.quote.total === null
                  ? "Individuelles Angebot"
                  : formatPrice(lead.quote.total) + " brutto"}
              </b>{" "}
              · Demo-Richtwert
            </p>
            {lead.photos?.length > 0 && (
              <div className="photo-grid">
                {lead.photos.map((photo, i) => (
                  <img key={i} src={photo} alt={"Badfoto " + (i + 1)} />
                ))}
              </div>
            )}
            {lead.notes && <p>{lead.notes}</p>}
            <label className="field">
              <span>Demo-Status für {lead.name}</span>
              <select
                value={lead.status}
                onChange={(e) => update(lead.id, e.target.value)}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
      {!leads.length && (
        <div className="empty">
          <h2>Noch keine Demo-Anfragen.</h2>
          <p>Probieren Sie zuerst den Konfigurator aus.</p>
        </div>
      )}
    </section>
  );
}
